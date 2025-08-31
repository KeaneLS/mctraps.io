import { auth, googleProvider, db, functions } from "./config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
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
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserDocument(userCredential.user);
  return userCredential.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  try {
    if (result.user.photoURL) {
      await updateProfile(result.user, { photoURL: result.user.photoURL });
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