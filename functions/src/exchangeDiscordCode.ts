/* eslint-disable linebreak-style */
import {onCall, HttpsError} from "firebase-functions/https";
import * as functions from "firebase-functions";
import {initializeApp, getApps} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {getAuth as getAdminAuth} from "firebase-admin/auth";
import {defineSecret} from "firebase-functions/params";
import {enforceRateLimit} from "./rateLimit";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

const DISCORD_CLIENT_ID = defineSecret("DISCORD_CLIENT_ID");
const DISCORD_CLIENT_SECRET = defineSecret("DISCORD_CLIENT_SECRET");

type ExchangePayload = {
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
  mode?: "auth" | "verify";
  intendedUid?: string;
  authAction?: "login" | "signup";
};

export const exchangeDiscordCode = onCall({
  secrets: [DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET],
}, async (request) => {
  const callerUid = request.auth?.uid;
  const intendedUidRaw = (request.data as ExchangePayload)?.intendedUid;
  const intendedUid = intendedUidRaw &&
    intendedUidRaw.trim() !== "" ?
    intendedUidRaw :
    undefined;
  const authAction = (request.data as ExchangePayload)?.authAction;
  if (callerUid) {
    await enforceRateLimit(
      callerUid,
      "exchangeDiscordCode",
      10,
      3600
    );
  }
  const {
    code,
    redirectUri,
    codeVerifier,
    mode,
  } = (request.data ?? {}) as ExchangePayload;

  if (!code) {
    throw new HttpsError("invalid-argument", "Missing Discord code.");
  }
  if (!redirectUri) {
    throw new HttpsError(
      "invalid-argument",
      "Missing redirectUri for Discord exchange."
    );
  }

  const clientId = DISCORD_CLIENT_ID.value();
  const clientSecret = DISCORD_CLIENT_SECRET.value();
  if (!clientId || !clientSecret) {
    throw new HttpsError(
      "failed-precondition",
      "Discord client credentials are not configured."
    );
  }

  let tokenJson: {access_token: string; token_type: string; scope?: string};
  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        ...(codeVerifier ? {code_verifier: codeVerifier} : {}),
      }),
    });
    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      functions.logger.error("discord token error", {
        status: tokenRes.status,
        body: txt,
      });
      throw new HttpsError(
        "unauthenticated",
        "Discord token exchange failed"
      );
    }
    tokenJson = await tokenRes.json();
  } catch (err: unknown) {
    const message = (err as Error)?.message || String(err);
    functions.logger.error("exchange token exception", {message});
    throw err instanceof HttpsError ? err :
      new HttpsError("internal", "Token exchange failed");
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    throw new HttpsError(
      "unauthenticated",
      "Discord did not return an access token."
    );
  }

  let userJson: {
    id: string;
    username?: string;
    global_name?: string | null;
    avatar?: string | null;
    email?: string | null;
  };
  try {
    const userRes = await fetch(
      "https://discord.com/api/users/@me",
      {headers: {Authorization: `Bearer ${accessToken}`}}
    );
    if (!userRes.ok) {
      const txt = await userRes.text();
      functions.logger.error("discord user fetch error", {
        status: userRes.status,
        body: txt,
      });
      throw new HttpsError(
        "permission-denied",
        "Failed to fetch Discord user"
      );
    }
    userJson = await userRes.json();
  } catch (err: unknown) {
    const message = (err as Error)?.message || String(err);
    functions.logger.error("user fetch exception", {message});
    throw err instanceof HttpsError ? err :
      new HttpsError("internal", "Discord user fetch failed");
  }

  const accountUsername = userJson.username || null;
  const display = userJson.global_name || accountUsername;
  const email = userJson.email || null;
  const cdn = "https://cdn.discordapp.com/avatars";
  const avatar: string | null = userJson.avatar ?
    `${cdn}/${userJson.id}/${userJson.avatar}.png` :
    null;
  const discordId = userJson.id;
  const linkRef = db.collection("discordLinks").doc(discordId);
  const linkSnap = await linkRef.get();
  const existingUid: string | undefined = linkSnap.exists ?
    (linkSnap.get("uid") as string | undefined) :
    undefined;

  if (mode === "auth" && authAction === "signup" && existingUid) {
    throw new HttpsError(
      "already-exists",
      "discord_already_linked"
    );
  }

  if (mode === "verify") {
    if (!intendedUid) {
      throw new HttpsError(
        "invalid-argument",
        "missing_intended_uid"
      );
    }
    if (existingUid && existingUid !== intendedUid) {
      throw new HttpsError(
        "already-exists",
        "discord_already_linked"
      );
    }
    if (!existingUid) {
      try {
        await linkRef.set({
          uid: intendedUid,
          createdAt: FieldValue.serverTimestamp(),
        }, {merge: true});
      } catch (err: unknown) {
        const message = (err as Error)?.message || String(err);
        functions.logger.warn("discord linkRef set (verify) failed", {
          message,
        });
      }
    }
    return {
      profile: {
        displayName: display,
        email,
        photoURL: avatar,
        discordUsername: accountUsername,
      },
    };
  }

  const adminAuth = getAdminAuth();
  let uid: string | null = null;

  if (existingUid) {
    uid = existingUid;
  }

  if (!uid && callerUid) {
    uid = callerUid;
    try {
      await linkRef.set({
        uid,
        createdAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    } catch (err: unknown) {
      const message = (err as Error)?.message || String(err);
      functions.logger.warn("discord linkRef set (caller) failed", {message});
    }
  }

  if (!uid && email) {
    try {
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
    } catch {
      const created = await adminAuth.createUser({
        email,
        displayName: display ?? undefined,
        photoURL: avatar ?? undefined,
        emailVerified: true,
      });
      uid = created.uid;
    }
    try {
      await linkRef.set({
        uid,
        createdAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    } catch (err: unknown) {
      const message = (err as Error)?.message || String(err);
      functions.logger.warn("discord linkRef set (email) failed", {message});
    }
  }

  if (!uid) {
    const stableUid = `discord:${discordId}`;
    try {
      const importResult = await adminAuth.importUsers([
        {uid: stableUid},
      ]);
      if (importResult.failureCount > 0) {
        functions.logger.warn(
          "discord importUsers had failures",
          {failureCount: importResult.failureCount}
        );
      }
    } catch (err: unknown) {
      const message = (err as Error)?.message || String(err);
      functions.logger.warn("discord importUsers failed", {message});
    }
    uid = stableUid;
    try {
      await linkRef.set({
        uid,
        createdAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    } catch (err: unknown) {
      const message = (err as Error)?.message || String(err);
      functions.logger.warn("discord linkRef set (fallback) failed", {message});
    }
  }

  try {
    const updates: {
      displayName?: string;
      photoURL?: string;
      email?: string;
      emailVerified?: boolean;
    } = {};
    if (display) updates.displayName = display;
    if (avatar) updates.photoURL = avatar;
    if (email) {
      updates.email = email;
      updates.emailVerified = true;
    }
    if (Object.keys(updates).length > 0) {
      await adminAuth.updateUser(uid, updates);
    }
  } catch (err: unknown) {
    const typed = err as {
      errorInfo?: {code?: string};
      code?: string;
    };
    const code = typed?.errorInfo?.code || typed?.code;
    const message = (err as Error)?.message || String(err);
    if (code !== "auth/email-already-exists") {
      functions.logger.warn(
        "updateUser failed",
        {code, message, uid}
      );
    }
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        admin: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        discordUsername: accountUsername ?? null,
        displayName: display ?? null,
        email: email ?? null,
        photoURL: avatar ?? null,
      }, {merge: true});
    } else {
      await userRef.set({
        updatedAt: FieldValue.serverTimestamp(),
        discordUsername: accountUsername ?? null,
        displayName: display ?? null,
        email: email ?? null,
        photoURL: avatar ?? null,
      }, {merge: true});
    }
  } catch (err: unknown) {
    const message = (err as Error)?.message || String(err);
    functions.logger.error("firestore update exception", {message});
  }

  const customToken = await adminAuth.createCustomToken(uid);
  return {
    customToken,
    profile: {
      displayName: display,
      email,
      photoURL: avatar,
      discordUsername: accountUsername,
    },
  };
});


