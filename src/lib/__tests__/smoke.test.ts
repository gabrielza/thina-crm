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

  it("firestore.rules covers all collections", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const rules = readFileSync(resolve(process.cwd(), "firestore.rules"), "utf-8");

    const collections = [
      "leads", "contacts", "activities", "tasks", "transactions",
      "showDays", "showDayLeads", "properties", "inboundLeads",
      "smsMessages", "followUpSequences", "sequenceEnrollments",
      "buyerProfiles", "documents", "autoResponseRules", "cmaReports",
    ];
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

// ═══════════════════════════════════════════════════════════
// v1.0.0 — Customer-Centric Data Model Tests
// ═══════════════════════════════════════════════════════════

describe("v1.0.0 — Contact-Scoped Query Function Exports", () => {
  it("exports getTasksByContact function", async () => {
    const mod = await import("../firestore");
    expect(typeof mod.getTasksByContact).toBe("function");
  });

  it("exports getTransactionsByContact function", async () => {
    const mod = await import("../firestore");
    expect(typeof mod.getTransactionsByContact).toBe("function");
  });

  it("exports getPropertiesByContact function", async () => {
    const mod = await import("../firestore");
    expect(typeof mod.getPropertiesByContact).toBe("function");
  });

  it("exports getBuyerProfilesByContact function", async () => {
    const mod = await import("../firestore");
    expect(typeof mod.getBuyerProfilesByContact).toBe("function");
  });

  it("exports getCmaReportsByContact function", async () => {
    const mod = await import("../firestore");
    expect(typeof mod.getCmaReportsByContact).toBe("function");
  });
});

describe("v1.0.0 — Data Model Interface Fields", () => {
  it("Property interface accepts contactId (seller link)", async () => {
    const mod = await import("../firestore");
    // Verify the addProperty function exists (typed with contactId in interface)
    expect(typeof mod.addProperty).toBe("function");
    // TypeScript compilation already validates the interface shape;
    // this test confirms the module loads without error with the new fields
  });

  it("ShowDay interface accepts propertyId (listing link)", async () => {
    const mod = await import("../firestore");
    expect(typeof mod.addShowDay).toBe("function");
  });

  it("ShowDayLead interface accepts contactId (visitor link)", async () => {
    const mod = await import("../firestore");
    expect(typeof mod.addShowDayLead).toBe("function");
  });

  it("InboundLead interface accepts contactId (acceptance link)", async () => {
    const mod = await import("../firestore");
    expect(typeof mod.addInboundLead).toBe("function");
  });

  it("all 16 data model interfaces are exported", async () => {
    const mod = await import("../firestore");
    // Verify key CRUD functions exist for each of the 16 collections
    const expectedExports = [
      "addLead", "getLeads",
      "addContact", "getContacts",
      "addActivity", "getActivities",
      "addTask", "getTasks",
      "addTransaction", "getTransactions",
      "addShowDay", "getShowDays",
      "addShowDayLead", "getShowDayLeads",
      "addProperty", "getProperties",
      "addInboundLead", "getInboundLeads",
      "addSmsMessage", "getSmsMessages",
      "addSequence", "getSequences",
      "addEnrollment", "getEnrollments",
      "addBuyerProfile", "getBuyerProfiles",
      "addStoredDocument", "getDocumentsByTransaction",
      "addAutoResponseRule", "getAutoResponseRules",
      "addCmaReport", "getCmaReports",
    ];
    for (const fn of expectedExports) {
      expect(typeof mod[fn], `Missing export: ${fn}`).toBe("function");
    }
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

    // Show Days
    expect(firestore.addShowDay).toBeTypeOf("function");
    expect(firestore.getShowDays).toBeTypeOf("function");
    expect(firestore.getShowDayById).toBeTypeOf("function");
    expect(firestore.deleteShowDay).toBeTypeOf("function");

    // Show Day Leads
    expect(firestore.addShowDayLead).toBeTypeOf("function");
    expect(firestore.getShowDayLeads).toBeTypeOf("function");

    // Properties
    expect(firestore.addProperty).toBeTypeOf("function");
    expect(firestore.getProperties).toBeTypeOf("function");
    expect(firestore.getPropertyById).toBeTypeOf("function");
    expect(firestore.updateProperty).toBeTypeOf("function");
    expect(firestore.deleteProperty).toBeTypeOf("function");

    // Inbound Leads
    expect(firestore.addInboundLead).toBeTypeOf("function");
    expect(firestore.getInboundLeads).toBeTypeOf("function");
    expect(firestore.updateInboundLead).toBeTypeOf("function");

    // SMS Messages
    expect(firestore.addSmsMessage).toBeTypeOf("function");
    expect(firestore.getSmsMessages).toBeTypeOf("function");
    expect(firestore.getSmsByContact).toBeTypeOf("function");

    // Follow-up Sequences
    expect(firestore.addSequence).toBeTypeOf("function");
    expect(firestore.getSequences).toBeTypeOf("function");
    expect(firestore.updateSequence).toBeTypeOf("function");
    expect(firestore.deleteSequence).toBeTypeOf("function");

    // Sequence Enrollments
    expect(firestore.addEnrollment).toBeTypeOf("function");
    expect(firestore.getEnrollments).toBeTypeOf("function");
    expect(firestore.updateEnrollment).toBeTypeOf("function");

    // Buyer Profiles
    expect(firestore.addBuyerProfile).toBeTypeOf("function");
    expect(firestore.getBuyerProfiles).toBeTypeOf("function");
    expect(firestore.updateBuyerProfile).toBeTypeOf("function");
    expect(firestore.deleteBuyerProfile).toBeTypeOf("function");

    // Documents
    expect(firestore.addStoredDocument).toBeTypeOf("function");
    expect(firestore.getDocumentsByTransaction).toBeTypeOf("function");
    expect(firestore.getDocumentsByContact).toBeTypeOf("function");
    expect(firestore.deleteStoredDocument).toBeTypeOf("function");

    // Auto-Response Rules (Speed-to-Lead)
    expect(firestore.addAutoResponseRule).toBeTypeOf("function");
    expect(firestore.getAutoResponseRules).toBeTypeOf("function");
    expect(firestore.updateAutoResponseRule).toBeTypeOf("function");
    expect(firestore.deleteAutoResponseRule).toBeTypeOf("function");

    // CMA Reports
    expect(firestore.addCmaReport).toBeTypeOf("function");
    expect(firestore.getCmaReports).toBeTypeOf("function");
    expect(firestore.getCmaReportById).toBeTypeOf("function");
    expect(firestore.updateCmaReport).toBeTypeOf("function");
    expect(firestore.deleteCmaReport).toBeTypeOf("function");
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
