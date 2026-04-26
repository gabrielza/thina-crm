import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  getCountFromServer,
  doc,
  setDoc,
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
import { parseDoc, LeadSchema, ContactSchema, TransactionSchema } from "./schemas";

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
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAt?: string; // ISO date — locked on first touch
  starred?: boolean;
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
  return snapshot.docs.map((d) => parseDoc<Lead>(LeadSchema, { id: d.id, ...d.data() }, d.id));
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
  return parseDoc<Lead>(LeadSchema, { id: snapshot.id, ...snapshot.data() }, snapshot.id);
}

export async function deleteLead(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, LEADS_COLLECTION, id));
}

export async function toggleLeadStar(id: string, starred: boolean) {
  const db = getFirebaseDb();
  const docRef = doc(db, LEADS_COLLECTION, id);
  await updateDoc(docRef, { starred, updatedAt: serverTimestamp() });
}

export async function getLeadsByContact(contactId: string): Promise<Lead[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, LEADS_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Lead[];
}

// ─── CONTACTS ────────────────────────────────────────────

export interface PopiaConsent {
  given: boolean;
  date: string; // ISO date
  method: "verbal" | "written" | "electronic" | "opt-in-form";
  optEmail: boolean;
  optSms: boolean;
  optPhone: boolean;
  optWhatsapp: boolean;
  revokedDate?: string;
}

export interface Contact {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  notes: string;
  popiaConsent?: PopiaConsent;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAt?: string; // ISO date — locked on first touch
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
  return snapshot.docs.map((d) => parseDoc<Contact>(ContactSchema, { id: d.id, ...d.data() }, d.id));
}

export async function getContactById(id: string): Promise<Contact | null> {
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, CONTACTS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return parseDoc<Contact>(ContactSchema, { id: snapshot.id, ...snapshot.data() }, snapshot.id);
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

export async function getTasksByContact(contactId: string): Promise<Task[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, TASKS_COLLECTION), where("contactId", "==", contactId), orderBy("dueDate", "asc"));
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

// ─── TRANSACTIONS ────────────────────────────────────────

export type TransactionStage =
  | "otp_signed"
  | "fica_submitted"
  | "fica_verified"
  | "bond_applied"
  | "bond_approved"
  | "transfer_lodged"
  | "transfer_registered"
  | "commission_paid"
  | "fallen_through";

export interface CommissionSplit {
  party: string;
  percentage: number;
  amount: number;
}

export interface StageHistoryEntry {
  stage: TransactionStage;
  date: string; // ISO date
  note?: string;
}

export interface Transaction {
  id?: string;
  propertyAddress: string;
  salePrice: number;
  commissionRate: number;
  commissionAmount: number;
  vatIncluded: boolean;
  vatAmount: number;
  splits: CommissionSplit[];
  agentNetCommission: number;
  stage: TransactionStage;
  stageHistory: StageHistoryEntry[];
  ficaBuyer: boolean;
  ficaSeller: boolean;
  conveyancer: string;
  bondOriginator: string;
  buyerName: string;
  sellerName: string;
  leadId?: string;
  contactId?: string;
  notes: string;
  dates: {
    otpSigned?: string;
    bondApplied?: string;
    bondApproved?: string;
    transferLodged?: string;
    transferRegistered?: string;
    commissionPaid?: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  ownerId: string;
}

export const TRANSACTION_STAGES: { key: TransactionStage; label: string }[] = [
  { key: "otp_signed", label: "OTP Signed" },
  { key: "fica_submitted", label: "FICA Submitted" },
  { key: "fica_verified", label: "FICA Verified" },
  { key: "bond_applied", label: "Bond Applied" },
  { key: "bond_approved", label: "Bond Approved" },
  { key: "transfer_lodged", label: "Transfer Lodged" },
  { key: "transfer_registered", label: "Transfer Registered" },
  { key: "commission_paid", label: "Commission Paid" },
  { key: "fallen_through", label: "Fallen Through" },
];

const TRANSACTIONS_COLLECTION = "transactions";

export async function addTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
    ...transaction,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTransactions(maxResults?: number): Promise<Transaction[]> {
  const db = getFirebaseDb();
  const q = maxResults
    ? query(collection(db, TRANSACTIONS_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults))
    : query(collection(db, TRANSACTIONS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => parseDoc<Transaction>(TransactionSchema, { id: d.id, ...d.data() }, d.id));
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, TRANSACTIONS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return parseDoc<Transaction>(TransactionSchema, { id: snapshot.id, ...snapshot.data() }, snapshot.id);
}

export async function updateTransaction(id: string, data: Partial<Transaction>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, TRANSACTIONS_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTransaction(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, id));
}

export async function getTransactionsByLead(leadId: string): Promise<Transaction[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, TRANSACTIONS_COLLECTION), where("leadId", "==", leadId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[];
}

export async function getTransactionsByContact(contactId: string): Promise<Transaction[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, TRANSACTIONS_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[];
}

// ─── SHOW DAYS ───────────────────────────────────────────

export interface ShowDay {
  id?: string;
  propertyId?: string;
  propertyAddress: string;
  date: string; // ISO date
  timeSlot: string;
  notes: string;
  active: boolean;
  ownerId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ShowDayLead {
  id?: string;
  showDayId: string;
  contactId?: string;
  name: string;
  email: string;
  phone: string;
  budget: string;
  bedrooms: string;
  notes: string;
  marketingConsent: boolean;
  createdAt?: Timestamp;
}

const SHOWDAYS_COLLECTION = "showDays";
const SHOWDAY_LEADS_COLLECTION = "showDayLeads";

export async function addShowDay(showDay: Omit<ShowDay, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, SHOWDAYS_COLLECTION), {
    ...showDay,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getShowDays(): Promise<ShowDay[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, SHOWDAYS_COLLECTION), orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ShowDay[];
}

export async function getShowDayById(id: string): Promise<ShowDay | null> {
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, SHOWDAYS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as ShowDay;
}

export async function deleteShowDay(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, SHOWDAYS_COLLECTION, id));
}

export async function addShowDayLead(lead: Omit<ShowDayLead, "id" | "createdAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, SHOWDAY_LEADS_COLLECTION), {
    ...lead,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getShowDayLeads(showDayId: string): Promise<ShowDayLead[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, SHOWDAY_LEADS_COLLECTION), where("showDayId", "==", showDayId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ShowDayLead[];
}

// ─── PROPERTIES / MANDATES ───────────────────────────────

export type MandateType = "sole" | "open" | "dual" | "auction";

export interface Property {
  id?: string;
  address: string;
  suburb: string;
  city: string;
  province: string;
  /** Google Places metadata (optional, captured by address autocomplete). */
  placeId?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  propertyType: "house" | "apartment" | "townhouse" | "land" | "commercial" | "farm";
  bedrooms: number;
  bathrooms: number;
  garages: number;
  erfSize: number; // sqm
  floorSize: number; // sqm
  askingPrice: number;
  mandateType: MandateType;
  mandateStart: string; // ISO date
  mandateEnd: string; // ISO date
  status: "active" | "under_offer" | "sold" | "withdrawn" | "expired";
  description: string;
  features: string[];
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  contactId?: string;
  transactionId?: string;
  leadId?: string;
  ownerId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const PROPERTIES_COLLECTION = "properties";

export async function addProperty(property: Omit<Property, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, PROPERTIES_COLLECTION), {
    ...property,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getProperties(maxResults?: number): Promise<Property[]> {
  const db = getFirebaseDb();
  const q = maxResults
    ? query(collection(db, PROPERTIES_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults))
    : query(collection(db, PROPERTIES_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Property[];
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const db = getFirebaseDb();
  const snapshot = await getDoc(doc(db, PROPERTIES_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Property;
}

export async function updateProperty(id: string, data: Partial<Property>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, PROPERTIES_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProperty(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, PROPERTIES_COLLECTION, id));
}

export async function getPropertiesByContact(contactId: string): Promise<Property[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, PROPERTIES_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Property[];
}

// ─── INBOUND LEADS (Portal Injection) ───────────────────

export interface InboundLead {
  id?: string;
  source: string; // "property24" | "private-property" | "manual"
  rawContent: string;
  parsed: {
    name: string;
    email: string;
    phone: string;
    propertyRef: string;
    propertyAddress: string;
    message: string;
  };
  status: "pending" | "accepted" | "rejected";
  leadId?: string; // linked lead after acceptance
  contactId?: string; // linked contact after acceptance
  receivedAt?: Timestamp;
  reviewedAt?: Timestamp;
  ownerId: string;
}

const INBOUND_LEADS_COLLECTION = "inboundLeads";

export async function addInboundLead(inbound: Omit<InboundLead, "id" | "receivedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, INBOUND_LEADS_COLLECTION), {
    ...inbound,
    receivedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getInboundLeads(maxResults: number = 500): Promise<InboundLead[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, INBOUND_LEADS_COLLECTION), orderBy("receivedAt", "desc"), limit(maxResults));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as InboundLead[];
}

export async function updateInboundLead(id: string, data: Partial<InboundLead>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, INBOUND_LEADS_COLLECTION, id), { ...data });
}

// ─── SMS MESSAGES ────────────────────────────────────────

export interface SmsMessage {
  id?: string;
  to: string;
  body: string;
  status: "queued" | "sent" | "delivered" | "failed";
  provider: "bulksms" | "clickatell";
  contactId?: string;
  leadId?: string;
  direction: "outbound" | "inbound";
  sentAt?: Timestamp;
  createdAt?: Timestamp;
  ownerId: string;
}

const SMS_COLLECTION = "smsMessages";

export async function addSmsMessage(sms: Omit<SmsMessage, "id" | "createdAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, SMS_COLLECTION), {
    ...sms,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSmsMessages(maxResults?: number): Promise<SmsMessage[]> {
  const db = getFirebaseDb();
  const q = maxResults
    ? query(collection(db, SMS_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults))
    : query(collection(db, SMS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as SmsMessage[];
}

export async function getSmsByContact(contactId: string): Promise<SmsMessage[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, SMS_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as SmsMessage[];
}

// ─── FOLLOW-UP SEQUENCES ────────────────────────────────

export interface SequenceStep {
  day: number; // days after trigger
  channel: "sms" | "email" | "whatsapp";
  template: string;
}

export interface FollowUpSequence {
  id?: string;
  name: string;
  trigger: "new_lead" | "show_day" | "proposal" | "manual";
  steps: SequenceStep[];
  active: boolean;
  ownerId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SequenceEnrollment {
  id?: string;
  sequenceId: string;
  leadId?: string;
  contactId?: string;
  currentStep: number;
  status: "active" | "completed" | "paused" | "cancelled";
  startedAt?: Timestamp;
  nextStepAt?: Timestamp;
  ownerId: string;
}

const SEQUENCES_COLLECTION = "followUpSequences";
const ENROLLMENTS_COLLECTION = "sequenceEnrollments";

export async function addSequence(seq: Omit<FollowUpSequence, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, SEQUENCES_COLLECTION), {
    ...seq,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getSequences(maxResults: number = 100): Promise<FollowUpSequence[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, SEQUENCES_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as FollowUpSequence[];
}

export async function updateSequence(id: string, data: Partial<FollowUpSequence>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, SEQUENCES_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSequence(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, SEQUENCES_COLLECTION, id));
}

export async function addEnrollment(enrollment: Omit<SequenceEnrollment, "id" | "startedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, ENROLLMENTS_COLLECTION), {
    ...enrollment,
    startedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getEnrollments(maxResults: number = 200): Promise<SequenceEnrollment[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, ENROLLMENTS_COLLECTION), orderBy("startedAt", "desc"), limit(maxResults));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as SequenceEnrollment[];
}

export async function updateEnrollment(id: string, data: Partial<SequenceEnrollment>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, ENROLLMENTS_COLLECTION, id), { ...data });
}

// ─── BUYER PROFILES ──────────────────────────────────────

export interface BuyerProfile {
  id?: string;
  contactId: string;
  contactName: string;
  minBudget: number;
  maxBudget: number;
  areas: string[]; // suburbs/cities
  propertyTypes: Property["propertyType"][];
  minBedrooms: number;
  minBathrooms: number;
  features: string[]; // pool, garden, security, etc.
  notes: string;
  active: boolean;
  ownerId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const BUYER_PROFILES_COLLECTION = "buyerProfiles";

export async function addBuyerProfile(profile: Omit<BuyerProfile, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, BUYER_PROFILES_COLLECTION), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getBuyerProfiles(maxResults: number = 200): Promise<BuyerProfile[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, BUYER_PROFILES_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as BuyerProfile[];
}

export async function updateBuyerProfile(id: string, data: Partial<BuyerProfile>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, BUYER_PROFILES_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBuyerProfile(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, BUYER_PROFILES_COLLECTION, id));
}

export async function getBuyerProfilesByContact(contactId: string): Promise<BuyerProfile[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, BUYER_PROFILES_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as BuyerProfile[];
}

// ─── DOCUMENTS ───────────────────────────────────────────

export interface StoredDocument {
  id?: string;
  name: string;
  type: "fica" | "otp" | "mandate" | "bond" | "transfer" | "other";
  url: string; // Firebase Storage URL
  storagePath: string;
  fileSize: number;
  mimeType: string;
  transactionId?: string;
  contactId?: string;
  propertyId?: string;
  ownerId: string;
  createdAt?: Timestamp;
}

const DOCUMENTS_COLLECTION = "documents";

export async function addStoredDocument(doc_data: Omit<StoredDocument, "id" | "createdAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), {
    ...doc_data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getDocumentsByTransaction(transactionId: string): Promise<StoredDocument[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, DOCUMENTS_COLLECTION), where("transactionId", "==", transactionId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StoredDocument[];
}

export async function getDocumentsByContact(contactId: string): Promise<StoredDocument[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, DOCUMENTS_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as StoredDocument[];
}

export async function deleteStoredDocument(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, DOCUMENTS_COLLECTION, id));
}

// ─── SPEED-TO-LEAD AUTO-RESPONSE ─────────────────────────

export interface AutoResponseRule {
  id?: string;
  name: string;
  trigger: "new_lead" | "inbound_portal" | "show_day_registration";
  enabled: boolean;
  messageTemplate: string; // Supports {{name}}, {{property}}, {{agent_name}}, {{agent_phone}}
  delayMinutes: number; // 0 = immediate
  channel: "sms";
  agentName: string;
  agentPhone: string;
  ownerId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const AUTO_RESPONSE_COLLECTION = "autoResponseRules";

export async function addAutoResponseRule(rule: Omit<AutoResponseRule, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, AUTO_RESPONSE_COLLECTION), {
    ...rule,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAutoResponseRules(maxResults: number = 100): Promise<AutoResponseRule[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, AUTO_RESPONSE_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as AutoResponseRule[];
}

export async function updateAutoResponseRule(id: string, data: Partial<AutoResponseRule>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, AUTO_RESPONSE_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteAutoResponseRule(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, AUTO_RESPONSE_COLLECTION, id));
}

// ─── CMA REPORTS ─────────────────────────────────────────

export interface CmaComparable {
  address: string;
  suburb: string;
  salePrice: number;
  saleDate: string; // ISO date
  bedrooms: number;
  bathrooms: number;
  erfSize: number;
  floorSize: number;
  propertyType: Property["propertyType"];
  daysOnMarket: number;
  adjustedPrice?: number;
  notes: string;
  /** Google Places metadata (optional, captured by address autocomplete). */
  placeId?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
}

export interface CmaReport {
  id?: string;
  title: string;
  propertyId?: string;
  subjectAddress: string;
  subjectSuburb: string;
  subjectCity: string;
  /** Google Places metadata captured by the address autocomplete (optional). */
  subjectPlaceId?: string;
  subjectFormattedAddress?: string;
  subjectLat?: number;
  subjectLng?: number;
  subjectType: Property["propertyType"];
  subjectBedrooms: number;
  subjectBathrooms: number;
  subjectErfSize: number;
  subjectFloorSize: number;
  comparables: CmaComparable[];
  estimatedValue: number;
  pricePerSqm: number;
  confidenceLevel: "low" | "medium" | "high";
  status: "draft" | "final" | "presented";
  contactId?: string;
  contactName?: string;
  notes: string;
  /**
   * Snapshot of the assigned agent at the time of the last save. Used as a
   * fallback for PDF rendering when the live profile is unavailable, and as a
   * historical record of “who prepared this report” in case the agent later
   * changes agency or leaves.
   */
  agentSnapshot?: AgentSnapshot;
  ownerId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const CMA_COLLECTION = "cmaReports";

export async function addCmaReport(report: Omit<CmaReport, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, CMA_COLLECTION), {
    ...report,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getCmaReports(maxResults: number = 200): Promise<CmaReport[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, CMA_COLLECTION), orderBy("createdAt", "desc"), limit(maxResults));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as CmaReport[];
}

export async function getCmaReportById(id: string): Promise<CmaReport | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, CMA_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CmaReport;
}

export async function updateCmaReport(id: string, data: Partial<CmaReport>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, CMA_COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteCmaReport(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, CMA_COLLECTION, id));
}

export async function getCmaReportsByContact(contactId: string): Promise<CmaReport[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, CMA_COLLECTION), where("contactId", "==", contactId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as CmaReport[];
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

// ─── AGENT PROFILE ───────────────────────────────────────
//
// One document per signed-in user, keyed by their Firebase Auth `uid`.
// Drives the agent block on CMA reports, listing brochures, and signatures.
// A lightweight `AgentSnapshot` is denormalized onto leads/contacts/properties
// when assigned, so views and PDFs don't need an extra read.

export interface AgentProfile {
  uid: string;
  // Personal
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  whatsapp: string;
  // Professional
  jobTitle: string;
  agencyName: string;
  branch: string;
  bio: string;
  // SA compliance
  ffcNumber: string;
  ffcExpiry: string; // ISO date
  eaabNumber: string;
  vatNumber: string;
  companyRegNumber: string;
  // Branding
  photoUrl: string;
  agencyLogoUrl: string;
  brandPrimaryColor: string;
  brandAccentColor: string;
  signatureBlock: string;
  // Marketing
  website: string;
  linkedinUrl: string;
  facebookUrl: string;
  instagramHandle: string;
  // Meta
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AgentSnapshot {
  agentId: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  agencyName: string;
  photoUrl: string;
  agencyLogoUrl: string;
  ffcNumber: string;
}

const AGENT_PROFILES_COLLECTION = "agentProfiles";

export function emptyAgentProfile(uid: string, fallbackEmail = "", fallbackName = ""): AgentProfile {
  return {
    uid,
    firstName: "",
    lastName: "",
    displayName: fallbackName,
    email: fallbackEmail,
    phone: "",
    whatsapp: "",
    jobTitle: "",
    agencyName: "",
    branch: "",
    bio: "",
    ffcNumber: "",
    ffcExpiry: "",
    eaabNumber: "",
    vatNumber: "",
    companyRegNumber: "",
    photoUrl: "",
    agencyLogoUrl: "",
    brandPrimaryColor: "",
    brandAccentColor: "",
    signatureBlock: "",
    website: "",
    linkedinUrl: "",
    facebookUrl: "",
    instagramHandle: "",
  };
}

export async function getAgentProfile(uid: string): Promise<AgentProfile | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, AGENT_PROFILES_COLLECTION, uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as AgentProfile;
}

export async function upsertAgentProfile(uid: string, data: Partial<AgentProfile>): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, AGENT_PROFILES_COLLECTION, uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { ...data, uid, updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, {
      ...emptyAgentProfile(uid, data.email ?? "", data.displayName ?? ""),
      ...data,
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Build the lightweight snapshot to denormalize onto owned records (lead, contact,
 * property, transaction, cma report). Returns an empty snapshot if no profile.
 */
export function buildAgentSnapshot(profile: AgentProfile | null): AgentSnapshot | undefined {
  if (!profile) return undefined;
  const name = profile.displayName
    || `${profile.firstName} ${profile.lastName}`.trim()
    || profile.email;
  return {
    agentId: profile.uid,
    agentName: name,
    agentEmail: profile.email,
    agentPhone: profile.phone,
    agencyName: profile.agencyName,
    photoUrl: profile.photoUrl,
    agencyLogoUrl: profile.agencyLogoUrl,
    ffcNumber: profile.ffcNumber,
  };
}
