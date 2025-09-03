import { auth, googleProvider, db, functions } from "./config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  User,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  getIdToken,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { getDoc } from "firebase/firestore";

async function ensureUserDocument(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }) {
  const userRef = doc(db, "users", user.uid);
  let exists = false;
  try {
    const snap = await getDoc(userRef);
    exists = snap.exists();
  } catch {}
  const baseData: Record<string, unknown> = {
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    updatedAt: serverTimestamp(),
  };
  if (!exists) {
    baseData.createdAt = serverTimestamp();
    baseData.admin = false;
    baseData.discordUsername = null;
  }
  await setDoc(userRef, baseData, { merge: true });
}

export const signupWithEmail = async (email: string, password: string) => {
  const current = auth.currentUser;
  if (current && current.isAnonymous) {
    try {
      const cred = EmailAuthProvider.credential(email, password);
      const linked = await linkWithCredential(current, cred);
      try { await linked.user.reload(); } catch {}
      await ensureUserDocument(linked.user);
      return linked.user;
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        const signedIn = await signInWithEmailAndPassword(auth, email, password);
        try { await signedIn.user.reload(); } catch {}
        return signedIn.user;
      }
      throw err;
    }
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  try { await userCredential.user.reload(); } catch {}
  await ensureUserDocument(userCredential.user);
  return userCredential.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginWithGoogle = async () => {
  const current = auth.currentUser;
  if (current && current.isAnonymous) {
    try {
      const linked = await linkWithPopup(current, googleProvider);
      try { await linked.user.reload(); } catch {}
      try {
        const updates: { displayName?: string; photoURL?: string } = {};
        if (!linked.user.displayName && linked.user.providerData?.[0]?.displayName) {
          updates.displayName = linked.user.providerData[0]!.displayName!;
        }
        if (!linked.user.photoURL && linked.user.providerData?.[0]?.photoURL) {
          updates.photoURL = linked.user.providerData[0]!.photoURL!;
        }
        if (updates.displayName || updates.photoURL) {
          await updateProfile(linked.user, updates);
          try { await linked.user.reload(); } catch {}
        }
      } catch {}
      await ensureUserDocument(linked.user);
      return linked.user;
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (
        code === "auth/credential-already-in-use" ||
        code === "auth/account-exists-with-different-credential" ||
        code === "auth/email-already-in-use"
      ) {
        try {
          const cred = GoogleAuthProvider.credentialFromError(err);
          if (cred) {
            const signed = await signInWithCredential(auth, cred);
            try { await signed.user.reload(); } catch {}
            await ensureUserDocument(signed.user);
            return signed.user;
          }
        } catch {}
        const signed = await signInWithPopup(auth, googleProvider);
        try { await signed.user.reload(); } catch {}
        await ensureUserDocument(signed.user);
        return signed.user;
      }
      throw err;
    }
  }
  const result = await signInWithPopup(auth, googleProvider);
  try { await result.user.reload(); } catch {}
  try {
    const updates: { displayName?: string; photoURL?: string } = {};
    if (!result.user.displayName && result.user.providerData?.[0]?.displayName) {
      updates.displayName = result.user.providerData[0]!.displayName!;
    }
    if (!result.user.photoURL && result.user.providerData?.[0]?.photoURL) {
      updates.photoURL = result.user.providerData[0]!.photoURL!;
    }
    if (updates.displayName || updates.photoURL) {
      await updateProfile(result.user, updates);
      try { await result.user.reload(); } catch {}
    }
  } catch {}
  await ensureUserDocument(result.user);
  return result.user;
};

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

export const logout = async () => {
  await signOut(auth);
};

export const verifyDiscordCloud = async (data: { displayName?: string | null; email?: string | null; photoURL?: string | null; discordUsername?: string | null }) => {
  const callable = httpsCallable(functions, "verifyDiscord");
  const res = await callable(data);
  return res.data as unknown;
};

async function waitForAuthInit(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  return await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });
}

export async function ensureAnonymousUser(): Promise<User> {
  const existing = await waitForAuthInit();
  if (existing) {
    try { await getIdToken(existing, true); } catch {}
    return existing;
  }
  const cred = await signInAnonymously(auth);
  try { await getIdToken(cred.user, true); } catch {}
  return cred.user;
}