import { test, expect, type Page } from "@playwright/test";

/**
 * Functional E2E tests for Thina CRM.
 * Run on-demand only: npm run test:e2e
 *
 * Requires E2E_EMAIL and E2E_PASSWORD environment variables
 * for a test user account (email/password Firebase Auth).
 *
 * Example: E2E_EMAIL=test@example.com E2E_PASSWORD=secret npm run test:e2e
 */

const E2E_EMAIL = process.env.E2E_EMAIL || "";
const E2E_PASSWORD = process.env.E2E_PASSWORD || "";

// ─── Helper: sign in via the login page ──────────────────

async function signIn(page: Page) {
  await page.goto("/login");
  await page.waitForSelector("#email", { timeout: 15000 });
  await page.fill("#email", E2E_EMAIL);
  await page.fill("#password", E2E_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
}

// ─── Pre-check ──────────────────────────────────────────

test.beforeAll(() => {
  if (!E2E_EMAIL || !E2E_PASSWORD) {
    throw new Error(
      "E2E_EMAIL and E2E_PASSWORD environment variables are required.\n" +
        "Usage: E2E_EMAIL=you@example.com E2E_PASSWORD=yourpass npm run test:e2e"
    );
  }
});

// ─── Tests ──────────────────────────────────────────────

test.describe("Authentication", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome to Thina");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("can sign in with email/password", async ({ page }) => {
    await signIn(page);
    // Should land on dashboard
    await expect(page.locator("text=Welcome back")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("dashboard loads with KPI cards", async ({ page }) => {
    await expect(page.locator("text=Welcome back")).toBeVisible();
    // Check for key KPI labels
    await expect(page.locator("text=TOTAL LEADS")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=WON DEALS")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pipeline Value" })).toBeVisible();
  });

  test("pipeline forecast section loads", async ({ page }) => {
    await expect(page.locator("text=Pipeline Forecast")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Leads", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("leads page loads with table", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("h1")).toContainText("Leads");
    // Should have table headers or data rows
    await expect(page.locator("table").or(page.getByText("No leads yet"))).toBeVisible({ timeout: 10000 });
  });

  test("can navigate to a lead detail page", async ({ page }) => {
    await page.goto("/leads");
    // Wait for table to render
    const firstRow = page.locator("table tbody tr").first();
    const hasRows = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRows) {
      await firstRow.click();
      // Should show lead detail — NOT "Lead not found"
      await page.waitForURL(/\/leads\//, { timeout: 10000 });
      const notFound = page.locator("text=Lead not found");
      const leadName = page.locator("h1");
      // Either we see a lead name or the detail page content — not "not found"
      await expect(notFound).not.toBeVisible({ timeout: 10000 });
      await expect(leadName).toBeVisible();
    }
  });
});

test.describe("Contacts", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("contacts page loads with table", async ({ page }) => {
    await page.goto("/contacts");
    await expect(page.locator("h1")).toContainText("Contacts");
    await expect(page.locator("table").or(page.getByText("No contacts yet"))).toBeVisible({ timeout: 10000 });
  });

  test("can navigate to a contact detail page", async ({ page }) => {
    await page.goto("/contacts");
    const firstRow = page.locator("table tbody tr").first();
    const hasRows = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRows) {
      await firstRow.click();
      await page.waitForURL(/\/contacts\//, { timeout: 10000 });
      const notFound = page.locator("text=Contact not found");
      await expect(notFound).not.toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("Pipeline", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("pipeline board loads with stage columns", async ({ page }) => {
    await page.goto("/pipeline");
    await expect(page.locator("h1")).toContainText("Pipeline");
    // Check for stage column headers
    await expect(page.getByRole("heading", { name: "New" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Contacted" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Qualified" })).toBeVisible();
  });
});

test.describe("Tasks", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("tasks page loads", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page.locator("h1")).toContainText("Tasks");
    await expect(page.getByRole("paragraph").filter({ hasText: "Pending" })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Reports", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("reports page loads", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.locator("h1")).toContainText("Reports");
    await expect(page.locator("text=Total Leads")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Transactions", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("transactions list page loads with table", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.locator("h1")).toContainText("Transactions");
    await expect(
      page.locator("table").or(page.getByText("No transactions yet"))
    ).toBeVisible({ timeout: 10000 });
  });

  test("can navigate to a transaction detail page", async ({ page }) => {
    await page.goto("/transactions");
    const firstRow = page.locator("table tbody tr").first();
    const hasRows = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRows) {
      await firstRow.click();
      await page.waitForURL(/\/transactions\//, { timeout: 10000 });
      const notFound = page.locator("text=Transaction not found");
      await expect(notFound).not.toBeVisible({ timeout: 10000 });
      // Detail page should show commission calculator and FICA compliance cards
      await expect(page.locator("text=Commission Calculator")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=FICA Compliance")).toBeVisible();
    }
  });

  test("transaction detail shows stage timeline and parties", async ({ page }) => {
    await page.goto("/transactions");
    const firstRow = page.locator("table tbody tr").first();
    const hasRows = await firstRow.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRows) {
      await firstRow.click();
      await page.waitForURL(/\/transactions\//, { timeout: 10000 });
      // Should show parties card with buyer/seller sections
      await expect(page.locator("text=Parties")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=Buyer FICA")).toBeVisible();
      await expect(page.locator("text=Seller FICA")).toBeVisible();
      // Should show sale price and commission rate
      await expect(page.locator("text=Sale Price")).toBeVisible();
      await expect(page.locator("text=Agent Net Commission")).toBeVisible();
    }
  });

  test("transaction pipeline board loads with stage columns", async ({ page }) => {
    await page.goto("/transactions/pipeline");
    await expect(page.locator("h1")).toContainText("Transaction Pipeline");
    // Check for key stage column headers
    await expect(page.getByRole("heading", { name: "OTP Signed" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Bond Applied" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Commission Paid" })).toBeVisible();
  });
});

test.describe("Dashboard — Transaction KPIs", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("dashboard shows transaction KPI cards when transactions exist", async ({ page }) => {
    await expect(page.locator("text=Welcome back")).toBeVisible({ timeout: 15000 });
    // If transactions are seeded, these KPI cards should be visible
    const hasTxKPIs = await page.locator("text=ACTIVE TRANSACTIONS").isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTxKPIs) {
      await expect(page.locator("text=PENDING COMMISSION")).toBeVisible();
      await expect(page.locator("text=EXPECTED INCOME")).toBeVisible();
      await expect(page.locator("text=EARNED COMMISSION")).toBeVisible();
    }
  });
});

test.describe("Health Check API", () => {
  test("GET /api/health returns healthy status", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.firestore.status).toBe("pass");
    expect(body.checks.envVars.status).toBe("pass");
  });
});
