import React from 'react';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
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
    const unsub = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (!user) {
        setCurrentUser(null);
        return;
      }
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          const url = snap.exists() ? (snap.get('photoURL') as string | null) : null;
          const admin = snap.exists() ? Boolean(snap.get('admin')) : undefined;
          if (!user.photoURL && url) {
            try {
              await updateProfile(user, { photoURL: url });
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


