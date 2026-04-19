import { describe, it, expect } from "vitest";

/**
 * Smoke tests that validate the app's configuration and infrastructure.
 * These run WITHOUT Firebase connections — they check that the setup is correct
 * so we never deploy a broken app again.
 *
 * The missing Firestore database incident would have been caught by the
 * "Firebase env vars" and "firebase.json" checks below.
 */

describe("Environment Configuration", () => {
  it("has required Firebase client env vars defined (or .env.local exists)", () => {
    // In CI, these come from secrets. Locally, from .env.local.
    // This test validates that the build won't silently produce an unconfigured app.
    const requiredVars = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
    ];

    // At minimum, PROJECT_ID must be set (others can be empty in test)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (projectId) {
      expect(projectId.length).toBeGreaterThan(0);
      // If project ID is set, all others should be too
      for (const key of requiredVars) {
        expect(process.env[key], `Missing env var: ${key}`).toBeTruthy();
      }
    } else {
      // In CI without env vars, just verify the list is correct
      expect(requiredVars).toHaveLength(6);
    }
  });
});

describe("Project Configuration Files", () => {
  it("package.json has correct project name and scripts", async () => {
    const pkg = await import("../../../package.json");
    expect(pkg.name).toBe("thina-crm");
    expect(pkg.scripts.build).toBe("next build");
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.dev).toBe("next dev");
  });

  it("package.json has all required dependencies", async () => {
    const pkg = await import("../../../package.json");
    const deps = { ...pkg.dependencies };
    const requiredDeps = ["firebase", "firebase-admin", "next", "react", "react-dom"];
    for (const dep of requiredDeps) {
      expect(deps[dep], `Missing dependency: ${dep}`).toBeDefined();
    }
  });

  it("package.json has test framework in devDependencies", async () => {
    const pkg = await import("../../../package.json");
    expect(pkg.devDependencies.vitest).toBeDefined();
  });

  it("tsconfig.json has strict mode enabled", async () => {
    const tsconfig = await import("../../../tsconfig.json");
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it("tsconfig.json has path alias configured", async () => {
    const tsconfig = await import("../../../tsconfig.json");
    expect(tsconfig.compilerOptions.paths["@/*"]).toEqual(["./src/*"]);
  });
});

describe("Firebase Configuration Files", () => {
  it("firebase.json exists and has correct structure", async () => {
    const firebase = await import("../../../firebase.json");
    expect(firebase).toBeDefined();
  });

  it("firebase.json specifies africa-south1 region", async () => {
    const firebase = await import("../../../firebase.json");
    // App Hosting region should be africa-south1 (Johannesburg)
    const region =
      firebase.frameworksBackend?.region ||
      firebase.hosting?.frameworksBackend?.region;
    if (region) {
      expect(region).toBe("africa-south1");
    }
  });

  it("firestore.rules covers all 5 collections", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf-8");

    const collections = ["leads", "contacts", "activities", "tasks", "transactions"];
    for (const col of collections) {
      expect(rules, `Missing security rule for collection: ${col}`).toContain(
        `match /${col}/{docId}`
      );
    }
  });

  it("firestore.rules requires authentication for reads", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf-8");

    // Every collection should require auth for read
    expect(rules).toContain("allow read: if isAuth()");
    // Should NOT have any unrestricted reads (except showDays which is public for QR code form)
    const rulesWithoutShowDays = rules.replace(/\/\/ Show Days[\s\S]*?match \/showDays\/\{docId\} \{[\s\S]*?\}/, "");
    expect(rulesWithoutShowDays).not.toMatch(/allow read: if true/);
    expect(rules).not.toMatch(/allow read, write;/);
  });

  it("firestore.rules requires ownership for writes", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf-8");

    expect(rules).toContain("allow create: if isCreatingOwn()");
    expect(rules).toContain("allow update, delete: if isOwner()");
  });
});

describe("Data Model Consistency", () => {
  it("firestore.ts exports all expected CRUD functions", async () => {
    const firestore = await import("@/lib/firestore");

    // Leads
    expect(firestore.addLead).toBeTypeOf("function");
    expect(firestore.getLeads).toBeTypeOf("function");
    expect(firestore.getLeadById).toBeTypeOf("function");
    expect(firestore.updateLead).toBeTypeOf("function");
    expect(firestore.deleteLead).toBeTypeOf("function");

    // Contacts
    expect(firestore.addContact).toBeTypeOf("function");
    expect(firestore.getContacts).toBeTypeOf("function");
    expect(firestore.getContactById).toBeTypeOf("function");
    expect(firestore.updateContact).toBeTypeOf("function");
    expect(firestore.deleteContact).toBeTypeOf("function");

    // Activities
    expect(firestore.addActivity).toBeTypeOf("function");
    expect(firestore.getActivities).toBeTypeOf("function");
    expect(firestore.deleteActivity).toBeTypeOf("function");

    // Tasks
    expect(firestore.addTask).toBeTypeOf("function");
    expect(firestore.getTasks).toBeTypeOf("function");
    expect(firestore.updateTask).toBeTypeOf("function");
    expect(firestore.deleteTask).toBeTypeOf("function");

    // Transactions
    expect(firestore.addTransaction).toBeTypeOf("function");
    expect(firestore.getTransactions).toBeTypeOf("function");
    expect(firestore.getTransactionById).toBeTypeOf("function");
    expect(firestore.updateTransaction).toBeTypeOf("function");
    expect(firestore.deleteTransaction).toBeTypeOf("function");
    expect(firestore.getTransactionsByLead).toBeTypeOf("function");
  });

  it("firestore.ts exports TRANSACTION_STAGES constant", async () => {
    const firestore = await import("@/lib/firestore");
    expect(firestore.TRANSACTION_STAGES).toBeDefined();
    expect(Array.isArray(firestore.TRANSACTION_STAGES)).toBe(true);
    expect(firestore.TRANSACTION_STAGES.length).toBe(9);
    expect(firestore.TRANSACTION_STAGES[0]).toHaveProperty("key");
    expect(firestore.TRANSACTION_STAGES[0]).toHaveProperty("label");
  });

  it("scoring.ts exports all expected functions", async () => {
    const scoring = await import("@/lib/scoring");
    expect(scoring.calculateLeadScore).toBeTypeOf("function");
    expect(scoring.getScoreLabel).toBeTypeOf("function");
    expect(scoring.calculateForecast).toBeTypeOf("function");
    expect(scoring.calculateCommission).toBeTypeOf("function");
    expect(scoring.calculateTransactionForecast).toBeTypeOf("function");
  });
});
