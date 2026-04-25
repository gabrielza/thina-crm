import { z } from "zod";

/**
 * Safely parse a Firestore document against a Zod schema.
 * Returns the validated data, or falls back to the raw data with a console warning
 * so the app doesn't crash on malformed documents.
 */
export function parseDoc<T>(schema: z.ZodType<T>, raw: Record<string, unknown>, docId?: string): T {
  const result = schema.safeParse(raw);
  if (result.success) return result.data;
  console.warn(`[firestore] Document ${docId ?? "unknown"} failed validation:`, result.error.issues);
  // Return raw data as fallback so the UI doesn't break on legacy/bad documents
  return raw as T;
}

// ─── Shared helpers ─────────────────────────────────────

const firestoreTimestamp = z.any().optional(); // Firestore Timestamp object

// ─── Lead Schema ─────────────────────────────────────────

export const LeadSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]),
  source: z.string(),
  notes: z.string(),
  value: z.number(),
  contactId: z.string().optional(),
  score: z.number().optional(),
  assignedAgentId: z.string().optional(),
  assignedAgentName: z.string().optional(),
  assignedAt: z.string().optional(),
  starred: z.boolean().optional(),
  createdAt: firestoreTimestamp,
  updatedAt: firestoreTimestamp,
  ownerId: z.string(),
});

// ─── Contact Schema ──────────────────────────────────────

export const PopiaConsentSchema = z.object({
  given: z.boolean(),
  date: z.string(),
  method: z.enum(["verbal", "written", "electronic", "opt-in-form"]),
  optEmail: z.boolean(),
  optSms: z.boolean(),
  optPhone: z.boolean(),
  optWhatsapp: z.boolean(),
  revokedDate: z.string().optional(),
});

export const ContactSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  title: z.string(),
  notes: z.string(),
  popiaConsent: PopiaConsentSchema.optional(),
  assignedAgentId: z.string().optional(),
  assignedAgentName: z.string().optional(),
  assignedAt: z.string().optional(),
  createdAt: firestoreTimestamp,
  updatedAt: firestoreTimestamp,
  ownerId: z.string(),
});

// ─── Transaction Schema ─────────────────────────────────

export const TransactionStageSchema = z.enum([
  "otp_signed", "fica_submitted", "fica_verified", "bond_applied",
  "bond_approved", "transfer_lodged", "transfer_registered",
  "commission_paid", "fallen_through",
]);

export const TransactionSchema = z.object({
  id: z.string().optional(),
  propertyAddress: z.string(),
  salePrice: z.number(),
  commissionRate: z.number(),
  commissionAmount: z.number(),
  vatIncluded: z.boolean(),
  vatAmount: z.number(),
  splits: z.array(z.object({
    party: z.string(),
    percentage: z.number(),
    amount: z.number(),
  })),
  agentNetCommission: z.number(),
  stage: TransactionStageSchema,
  stageHistory: z.array(z.object({
    stage: TransactionStageSchema,
    date: z.string(),
    note: z.string().optional(),
  })),
  ficaBuyer: z.boolean(),
  ficaSeller: z.boolean(),
  conveyancer: z.string(),
  bondOriginator: z.string(),
  buyerName: z.string(),
  sellerName: z.string(),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  notes: z.string(),
  dates: z.object({
    otpSigned: z.string().optional(),
    bondApplied: z.string().optional(),
    bondApproved: z.string().optional(),
    transferLodged: z.string().optional(),
    transferRegistered: z.string().optional(),
    commissionPaid: z.string().optional(),
  }),
  createdAt: firestoreTimestamp,
  updatedAt: firestoreTimestamp,
  ownerId: z.string(),
});

// ─── Property Schema ─────────────────────────────────────

export const PropertySchema = z.object({
  id: z.string().optional(),
  address: z.string(),
  suburb: z.string(),
  city: z.string(),
  province: z.string(),
  propertyType: z.enum(["house", "apartment", "townhouse", "land", "commercial", "farm"]),
  bedrooms: z.number(),
  bathrooms: z.number(),
  garages: z.number(),
  erfSize: z.number(),
  floorSize: z.number(),
  askingPrice: z.number(),
  mandateType: z.enum(["sole", "open", "dual", "auction"]),
  mandateStart: z.string(),
  mandateEnd: z.string(),
  status: z.enum(["active", "under_offer", "sold", "withdrawn", "expired"]),
  description: z.string(),
  features: z.array(z.string()),
  sellerName: z.string(),
  sellerPhone: z.string(),
  sellerEmail: z.string(),
  contactId: z.string().optional(),
  transactionId: z.string().optional(),
  leadId: z.string().optional(),
  ownerId: z.string(),
  createdAt: firestoreTimestamp,
  updatedAt: firestoreTimestamp,
});

// ─── InboundLead Schema ──────────────────────────────────

export const InboundLeadSchema = z.object({
  id: z.string().optional(),
  source: z.string(),
  rawContent: z.string(),
  parsed: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    propertyRef: z.string(),
    propertyAddress: z.string(),
    message: z.string(),
  }),
  status: z.enum(["pending", "accepted", "rejected"]),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  receivedAt: firestoreTimestamp,
  reviewedAt: firestoreTimestamp,
  ownerId: z.string(),
});
