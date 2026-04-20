"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<unknown>;
  signInWithEmail: (email: string, password: string) => Promise<unknown>;
  signUpWithEmail: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (u) => {
      setUser(u);
      setLoading(false);
      // Sync lightweight session cookie for middleware auth gate
      if (u) {
        const token = await u.getIdToken();
        document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
      } else {
        document.cookie = "__session=; path=/; max-age=0";
      }
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => signInWithPopup(auth, googleProvider);
  const signInWithEmail = async (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);
  const signUpWithEmail = async (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password);
  const signOut = async () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
