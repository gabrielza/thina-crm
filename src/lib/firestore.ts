import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  source: string;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  ownerId: string;
}

const LEADS_COLLECTION = "leads";

export async function addLead(lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) {
  const docRef = await addDoc(collection(db, LEADS_COLLECTION), {
    ...lead,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getLeads(): Promise<Lead[]> {
  const q = query(collection(db, LEADS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Lead[];
}

export async function updateLead(id: string, data: Partial<Lead>) {
  const docRef = doc(db, LEADS_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLead(id: string) {
  const docRef = doc(db, LEADS_COLLECTION, id);
  await deleteDoc(docRef);
}
