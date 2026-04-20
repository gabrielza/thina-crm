---
description: "Use when working with Firestore CRUD operations, Zod schemas, data models, or security rules. Covers firestore.ts patterns, parseDoc validation, and owner-based access control."
applyTo: ["src/lib/firestore.ts", "src/lib/schemas.ts", "firestore.rules"]
---
# Firebase & Firestore Patterns

## Client SDK (`src/lib/firebase.ts`)
- Lazy-initialized: `getFirebaseAuth()`, `getFirebaseDb()`, `getFirebaseStorage()`
- Only import in `"use client"` components
- Never import in API routes — use firebase-admin instead

## Admin SDK (`src/lib/firebase-admin.ts`)
- Server-side only: `adminDb`, `adminAuth`
- Used in `src/app/api/` routes for token verification and server writes

## Firestore CRUD Pattern (`src/lib/firestore.ts`)
Every collection follows this pattern:
```typescript
const COLLECTION = "leads";

export async function addLead(lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...lead,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getLeads(): Promise<Lead[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => parseDoc<Lead>(LeadSchema, { id: d.id, ...d.data() }, d.id));
}
```

## Zod Validation (`src/lib/schemas.ts`)
- Every collection has a corresponding Zod schema (e.g., `LeadSchema`, `ContactSchema`)
- `parseDoc<T>(schema, raw, docId)` validates documents — falls back to raw data on failure
- Firestore `Timestamp` fields use `z.any().optional()`
- Always add schema when creating a new collection

## Security Rules (`firestore.rules`)
- All documents require `ownerId` field
- `isOwner()` check: `request.auth.uid == resource.data.ownerId`
- `isCreatingOwn()`: ensures user sets themselves as owner on create
- Read: authenticated users can read all docs
- Write/Delete: only document owner
- Exception: `showDays` has public read (QR code registration)
- Exception: `showDayLeads` has public create (visitor registration)

## 16 Collections
leads, contacts, activities, tasks, transactions, showDays, showDayLeads, properties, inboundLeads, smsMessages, followUpSequences, sequenceEnrollments, buyerProfiles, documents, autoResponseRules, cmaReports
