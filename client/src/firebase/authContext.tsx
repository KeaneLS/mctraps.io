import React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config';
import { loginWithEmail, signupWithEmail, loginWithGoogle, logout as authLogout, resetPassword } from './authentication';

export interface AuthContextValue {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
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


