import { auth, googleProvider } from "./config";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

export const signupWithEmail = async (email: string, password: string, username?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // optionally set displayName
  if (username) {
    await updateProfile(userCredential.user, { displayName: username });
  }
  
  return userCredential.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};