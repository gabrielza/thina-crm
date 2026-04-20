---
name: new-feature
description: "Scaffold a complete new feature for Thina CRM end-to-end. Use when adding a new Firestore collection, page, or entity type. Covers interface, Zod schema, CRUD functions, page, sheet forms, security rules, seed data, and tests."
argument-hint: "Feature name, e.g. 'invoices' or 'agent profiles'"
---
# New Feature Scaffold — Thina CRM

## When to Use
- Adding a new Firestore collection/entity type
- Building a new page with full CRUD
- Extending the CRM with a new domain concept

## Pre-Flight Checklist
Before starting, confirm with the user:
1. **Entity name** (singular + plural, e.g. "invoice" / "invoices")
2. **Fields** — what data does this entity store?
3. **Relationships** — does it link to contacts, leads, properties, transactions?
4. **Access model** — standard owner-based, or public read (like showDays)?
5. **UI needs** — list page, detail page, Kanban board, or dashboard widget?

## Procedure (8 Steps)

### Step 1: TypeScript Interface
Add to `src/lib/firestore.ts`:
```typescript
export interface EntityName {
  id?: string;
  // ... entity-specific fields
  contactId?: string;          // if linked to contacts
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  ownerId: string;             // REQUIRED — access control
}
```
**Rules:**
- `ownerId: string` is mandatory on every entity
- `createdAt` / `updatedAt` use Firestore `Timestamp`
- Optional foreign keys: `contactId`, `leadId`, `propertyId`, `transactionId`

### Step 2: Zod Schema
Add to `src/lib/schemas.ts`:
```typescript
export const EntityNameSchema = z.object({
  id: z.string().optional(),
  // ... mirror the interface fields
  createdAt: firestoreTimestamp,
  updatedAt: firestoreTimestamp,
  ownerId: z.string(),
});
```
**Rules:**
- Schema must match the interface exactly
- Use `firestoreTimestamp` (defined as `z.any().optional()`) for Timestamp fields
- Export the schema — it's used by `parseDoc()` in CRUD functions

### Step 3: CRUD Functions
Add to `src/lib/firestore.ts` (5 functions per collection):
```typescript
const COLLECTION = "entityNames";

export async function addEntityName(data: Omit<EntityName, "id" | "createdAt" | "updatedAt">) {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getEntityNames(): Promise<EntityName[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => parseDoc<EntityName>(EntityNameSchema, { id: d.id, ...d.data() }, d.id));
}

export async function getEntityNameById(id: string): Promise<EntityName | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return parseDoc<EntityName>(EntityNameSchema, { id: snapshot.id, ...snapshot.data() }, snapshot.id);
}

export async function updateEntityName(id: string, data: Partial<EntityName>) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteEntityName(id: string) {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COLLECTION, id));
}
```
**Rules:**
- Always use `parseDoc()` with the Zod schema when reading
- Always set `serverTimestamp()` on create and update
- Import the schema from `@/lib/schemas`

### Step 4: Firestore Security Rules
Add to `firestore.rules`:
```
// Entity Names
match /entityNames/{docId} {
  allow read: if isAuth();
  allow create: if isCreatingOwn();
  allow update, delete: if isOwner();
}
```
**Rules:**
- Standard pattern: authenticated read, owner-only write/delete
- If public access needed (like showDays), use `allow read: if true;`
- If public create needed (like showDayLeads), add schema validation in rules

### Step 5: List Page
Create `src/app/entity-names/page.tsx`:
```typescript
"use client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/hooks/use-auth";
// ... imports

export default function EntityNamesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<EntityName[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getEntityNames();
        setItems(data);
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchData();
  }, [user]);

  return (
    <AppShell>
      {/* Page header with title + "New" button */}
      {/* Data table or card grid */}
    </AppShell>
  );
}
```

### Step 6: Sheet Forms
Create `src/components/new-entity-name-sheet.tsx` and `edit-entity-name-sheet.tsx`:
- Slide-over panel using `<Sheet>` from shadcn/ui
- Controlled form inputs with `useState`
- On submit: call CRUD function with `ownerId: user.uid`
- On success: call parent refresh callback + close sheet

### Step 7: Seed Data
Add seed records in `src/app/api/seed/route.ts`:
- Generate 20-50 realistic records with South African context
- Include variety in field values
- All seed records use the authenticated user's UID as `ownerId`

### Step 8: Tests
**Unit tests** — add to `src/lib/__tests__/`:
- Schema validation: valid document passes, missing required fields fail
- Any pure business logic functions

**E2E tests** — add to `e2e/`:
- Page loads and displays data
- Create new entity via sheet form
- Edit existing entity
- Delete entity

## Post-Scaffold Checklist
- [ ] Interface added to `firestore.ts`
- [ ] Zod schema added to `schemas.ts`
- [ ] 5 CRUD functions in `firestore.ts`
- [ ] Security rules in `firestore.rules`
- [ ] List page created
- [ ] New + Edit sheet components created
- [ ] Seed data added
- [ ] Unit tests pass (`npm run test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Update collection count in spec doc (currently 16)
