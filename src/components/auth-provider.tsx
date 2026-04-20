"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onIdTokenChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
  type UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

/**
 * Set (or clear) the lightweight __session cookie used by Edge Middleware.
 * Called both from onIdTokenChanged (background refresh) and from the
 * sign-in helpers (so the cookie exists BEFORE the first navigation).
 */
async function syncSessionCookie(user: User | null) {
  if (user) {
    const token = await user.getIdToken();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax${secure}`;
  } else {
    document.cookie = "__session=; path=/; max-age=0";
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle: async () => { throw new Error("AuthProvider not mounted"); },
  signInWithEmail: async () => { throw new Error("AuthProvider not mounted"); },
  signUpWithEmail: async () => { throw new Error("AuthProvider not mounted"); },
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
    // onIdTokenChanged fires on login, logout, AND automatic token refresh
    // (unlike onAuthStateChanged which only fires on login/logout)
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (u) => {
      setUser(u);
      setLoading(false);
      await syncSessionCookie(u);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await syncSessionCookie(cred.user);
    return cred;
  };
  const signInWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await syncSessionCookie(cred.user);
    return cred;
  };
  const signUpWithEmail = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await syncSessionCookie(cred.user);
    return cred;
  };
  const signOut = async () => {
    await firebaseSignOut(auth);
    await syncSessionCookie(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
