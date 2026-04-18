import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  getCountFromServer,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
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

export async function getLeads(maxResults?: number): Promise<Lead[]> {
  const db = getFirebaseDb();
  const q = maxResults
    ? query(collection(db, LEADS_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults))
    : query(collection(db, LEADS_COLLECTION), orderBy("createdAt", "desc"));
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

export async function getContacts(maxResults?: number): Promise<Contact[]> {
  const db = getFirebaseDb();
  const q = maxResults
    ? query(collection(db, CONTACTS_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults))
    : query(collection(db, CONTACTS_COLLECTION), orderBy("createdAt", "desc"));
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

export async function getActivities(maxResults?: number): Promise<Activity[]> {
  const db = getFirebaseDb();
  const q = maxResults
    ? query(collection(db, ACTIVITIES_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults))
    : query(collection(db, ACTIVITIES_COLLECTION), orderBy("createdAt", "desc"));
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

export async function getTasks(maxResults?: number): Promise<Task[]> {
  const db = getFirebaseDb();
  const q = maxResults
    ? query(collection(db, TASKS_COLLECTION), orderBy("dueDate", "asc"), limit(maxResults))
    : query(collection(db, TASKS_COLLECTION), orderBy("dueDate", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
}

export async function getCollectionCount(collectionName: string): Promise<number> {
  const db = getFirebaseDb();
  const snapshot = await getCountFromServer(collection(db, collectionName));
  return snapshot.data().count;
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

// ─── BATCH WRITE (for seeding) ───────────────────────────

/**
 * Write documents in batches of up to 500 (Firestore limit).
 * Returns array of generated document IDs.
 */
export async function batchWrite(
  collectionName: string,
  documents: Record<string, unknown>[],
  onProgress?: (written: number, total: number) => void
): Promise<string[]> {
  const db = getFirebaseDb();
  const ids: string[] = [];
  const BATCH_SIZE = 450; // stay under 500 limit

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = documents.slice(i, i + BATCH_SIZE);

    for (const data of chunk) {
      const docRef = doc(collection(db, collectionName));
      batch.set(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      ids.push(docRef.id);
    }

    await batch.commit();
    onProgress?.(Math.min(i + BATCH_SIZE, documents.length), documents.length);
  }

  return ids;
}

/**
 * Delete all documents in a collection (for cleanup before re-seeding).
 */
export async function clearCollection(
  collectionName: string,
  onProgress?: (deleted: number) => void
): Promise<number> {
  const db = getFirebaseDb();
  const snapshot = await getDocs(collection(db, collectionName));
  let deleted = 0;
  const BATCH_SIZE = 450;

  for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += chunk.length;
    onProgress?.(deleted);
  }

  return deleted;
}
