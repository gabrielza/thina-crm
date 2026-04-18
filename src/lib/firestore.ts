import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  source: string;
  notes: string;
  value: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  ownerId: string;
}

const LEADS_COLLECTION = "leads";

export async function addLead(lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
    ...lead,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getLeads(): Promise<Lead[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, LEADS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Lead[];
}

export async function updateLead(id: string, data: Partial<Lead>) {
  const db = getFirebaseDb();
  const docRef = doc(db, LEADS_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, LEADS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Lead;
}

export async function deleteLead(id: string) {
  const db = getFirebaseDb();
  const docRef = doc(db, LEADS_COLLECTION, id);
  await deleteDoc(docRef);
}
