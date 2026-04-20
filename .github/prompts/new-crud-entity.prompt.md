---
description: "Scaffold a new Firestore CRUD entity with interface, Zod schema, 5 CRUD functions, security rule, and test stubs. Use when adding a new collection to Thina CRM."
agent: "agent"
---
# New CRUD Entity: {{ entity }}

Scaffold a complete CRUD entity for the Thina CRM project. The entity name is provided by the user.

## What to Generate

### 1. TypeScript Interface
Add to `src/lib/firestore.ts`:
- All fields specified by the user
- Required fields: `id?: string`, `createdAt?: Timestamp`, `updatedAt?: Timestamp`, `ownerId: string`
- Use `Timestamp` type from `firebase/firestore`

### 2. Zod Schema
Add to `src/lib/schemas.ts`:
- Mirror the interface exactly
- `id: z.string().optional()`
- `createdAt: firestoreTimestamp` and `updatedAt: firestoreTimestamp` (the `firestoreTimestamp` helper is already defined)
- `ownerId: z.string()`
- Export the schema

### 3. Five CRUD Functions
Add to `src/lib/firestore.ts`:
- `addEntityName(data)` — create with `serverTimestamp()`
- `getEntityNames()` — list all, ordered by `createdAt` desc, validated with `parseDoc()`
- `getEntityNameById(id)` — single doc lookup, returns `null` if not found
- `updateEntityName(id, data)` — partial update with `updatedAt: serverTimestamp()`
- `deleteEntityName(id)` — delete by ID

Follow the exact same pattern as `addLead`, `getLeads`, `getLeadById`, `updateLead`, `deleteLead` in `src/lib/firestore.ts`.

### 4. Firestore Security Rule
Add to `firestore.rules`:
```
match /collectionName/{docId} {
  allow read: if isAuth();
  allow create: if isCreatingOwn();
  allow update, delete: if isOwner();
}
```

### 5. Test Stubs
Add to `src/lib/__tests__/entity-name.test.ts`:
- Schema validation test: valid document passes
- Schema validation test: missing ownerId fails
- Schema validation test: invalid enum/type fails (if applicable)

## Rules
- Use `parseDoc()` from `@/lib/schemas` for all reads
- Collection name is the plural, camelCase form (e.g. "buyerProfiles")
- Currency values are in ZAR (South African Rand)
- All dates as ISO strings unless they are Firestore Timestamps
- Import order: firebase/firestore, then local imports
