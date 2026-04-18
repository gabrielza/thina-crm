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
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

// ─── LEADS ───────────────────────────────────────────────

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
  contactId?: string;
  score?: number;
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
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Lead[];
}

export async function updateLead(id: string, data: Partial<Lead>) {
  const db = getFirebaseDb();
  const docRef = doc(db, LEADS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
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
  await deleteDoc(doc(db, LEADS_COLLECTION, id));
}

export async function getLeadsByContact(contactId: string): Promise<Lead[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, LEADS_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Lead[];
}

// ─── CONTACTS ────────────────────────────────────────────

export interface Contact {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  ownerId: string;
}

const CONTACTS_COLLECTION = "contacts";

export async function addContact(contact: Omit<Contact, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), {
    ...contact,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getContacts(): Promise<Contact[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, CONTACTS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Contact[];
}

export async function getContactById(id: string): Promise<Contact | null> {
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, CONTACTS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Contact;
}

export async function updateContact(id: string, data: Partial<Contact>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, CONTACTS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteContact(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, CONTACTS_COLLECTION, id));
}

// ─── ACTIVITIES ──────────────────────────────────────────

export interface Activity {
  id?: string;
  type: "call" | "email" | "meeting" | "note";
  subject: string;
  description: string;
  leadId?: string;
  contactId?: string;
  createdAt?: Timestamp;
  ownerId: string;
}

const ACTIVITIES_COLLECTION = "activities";

export async function addActivity(activity: Omit<Activity, "id" | "createdAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), {
    ...activity,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getActivities(): Promise<Activity[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, ACTIVITIES_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Activity[];
}

export async function getActivitiesByLead(leadId: string): Promise<Activity[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, ACTIVITIES_COLLECTION), where("leadId", "==", leadId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Activity[];
}

export async function getActivitiesByContact(contactId: string): Promise<Activity[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, ACTIVITIES_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Activity[];
}

export async function deleteActivity(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, ACTIVITIES_COLLECTION, id));
}

// ─── TASKS ───────────────────────────────────────────────

export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string
  status: "pending" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  leadId?: string;
  contactId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  ownerId: string;
}

const TASKS_COLLECTION = "tasks";

export async function addTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTasks(): Promise<Task[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, TASKS_COLLECTION), orderBy("dueDate", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
}

export async function getTasksByLead(leadId: string): Promise<Task[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, TASKS_COLLECTION), where("leadId", "==", leadId), orderBy("dueDate", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
}

export async function updateTask(id: string, data: Partial<Task>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, TASKS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTask(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, TASKS_COLLECTION, id));
}
