import React from 'react';
import { onAuthStateChanged, User, updateProfile, signInAnonymously } from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc } from 'firebase/firestore';
import { loginWithEmail, signupWithEmail, loginWithGoogle, logout as authLogout, resetPassword } from './authentication';

export type AppUser = User & { admin?: boolean };

export interface AuthContextValue {
  currentUser: AppUser | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let triedAnon = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(false);
      if (!user) {
        setCurrentUser(null);
        if (!triedAnon) {
          triedAnon = true;
          (async () => {
            try {
              await signInAnonymously(auth);
            } catch {
              // ignore since UI can still function without auth
            }
          })();
        }
        return;
      }
      if (user.isAnonymous) {
        setCurrentUser(null);
        return;
      }
      setCurrentUser(user as AppUser);
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          const url = snap.exists() ? (snap.get('photoURL') as string | null) : null;
          const nameFromDoc = snap.exists() ? (snap.get('displayName') as string | null) : null;
          const admin = snap.exists() ? Boolean(snap.get('admin')) : undefined;
          if (!snap.exists()) {
            try {
              const { doc: d, setDoc, serverTimestamp } = await import('firebase/firestore');
              const payload: Record<string, unknown> = {
                admin: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              if (user.displayName) payload.displayName = user.displayName;
              if (user.email) payload.email = user.email;
              if (user.photoURL) payload.photoURL = user.photoURL;
              await setDoc(d(db, 'users', user.uid), payload, { merge: true });
            } catch {}
          }
          if ((!user.photoURL && url) || (!user.displayName && nameFromDoc)) {
            try {
              await updateProfile(user, {
                photoURL: user.photoURL ? user.photoURL : url || undefined,
                displayName: user.displayName ? user.displayName : nameFromDoc || undefined,
              });
              try { await user.reload(); } catch {}
            } catch {}
          }
          const refreshed = auth.currentUser ?? user;
          const extended: AppUser = Object.assign(refreshed, { admin });
          setCurrentUser(extended);
        } catch {
          setCurrentUser(user as AppUser);
        }
      })();
    });
    return () => unsub();
  }, []);

  const value: AuthContextValue = {
    currentUser,
    loading,
    signup: async (email, password) => {
      const user = await signupWithEmail(email, password);
      return user;
    },
    login: async (email, password) => {
      const user = await loginWithEmail(email, password);
      return user;
    },
    loginWithGoogle: async () => {
      const user = await loginWithGoogle();
      return user;
    },
    logout: async () => {
      await authLogout();
    },
    resetPassword: async (email: string) => {
      await resetPassword(email);
    },
    reloadUser: async () => {
      try {
        await auth.currentUser?.reload();
      } catch {}
      setCurrentUser(auth.currentUser);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}


