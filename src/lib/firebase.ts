import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization to avoid crashing during build when env vars are absent
function getApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) {
    const app = getApp();
    // Use initializeFirestore on first call so we can set ignoreUndefinedProperties.
    // This lets call sites pass `field || undefined` without crashing the save.
    // Subsequent getFirestore() calls in the same app return the same instance.
    try {
      _db = initializeFirestore(app, { ignoreUndefinedProperties: true });
    } catch {
      // Already initialized (e.g. HMR) — fall back to getFirestore.
      _db = getFirestore(app);
    }
  }
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getApp());
  return _storage;
}

// Convenience getters (only use in client components at runtime)
export const auth = typeof window !== "undefined" ? getFirebaseAuth() : (undefined as unknown as Auth);
export const db = typeof window !== "undefined" ? getFirebaseDb() : (undefined as unknown as Firestore);
