---
name: testing
description: "Run and write tests for Thina CRM. Use when writing Vitest unit tests, Playwright E2E tests, running test suites, or debugging test failures. Covers test patterns, mocking Firebase, and E2E auth flow."
---
# Testing Skill — Thina CRM

## When to Use
- Writing new unit tests (Vitest)
- Writing new E2E tests (Playwright)
- Running test suites or debugging failures
- Adding test coverage for new features

## Test Stack
- **Unit tests:** Vitest + @vitejs/plugin-react
- **E2E tests:** Playwright (Chromium)
- **Commands:** `npm run test` (unit), `npm run test:e2e` (E2E)

## Unit Tests (Vitest)

### Configuration
- Config: `vitest.config.ts` — environment: node, path alias `@/` → `src/`
- Test files: `src/lib/__tests__/*.test.ts`
- Globals enabled: `describe`, `it`, `expect` available without imports

### Pattern
```typescript
import { describe, it, expect } from "vitest";

describe("functionName", () => {
  it("should do something specific", () => {
    const result = functionName(input);
    expect(result).toBe(expected);
  });
});
```

### What to Test
- Pure functions in `src/lib/` (scoring, utils, rate-limit, schemas)
- Zod schema validation (valid + invalid inputs)
- Commission calculations
- Rate limiter behavior (allowed, blocked, window reset)

### Mocking Firebase
Unit tests should NOT call real Firebase. Mock the SDK:
```typescript
vi.mock("@/lib/firebase", () => ({
  getFirebaseDb: vi.fn(),
  getFirebaseAuth: vi.fn(),
}));
```

## E2E Tests (Playwright)

### Configuration
- Config: `playwright.config.ts`
- Test files: `e2e/*.spec.ts`
- Base URL: live deployment (override with `DEPLOY_URL=http://localhost:3000`)
- Sequential execution (not parallel) — tests share auth state
- Timeout: 60s per test, 30s expect timeout
- Screenshots on failure, trace on first retry

### Test User
- Email: `e2e-test@thina-crm.test`
- Password: `E2eTestPass123!`

### Auth Pattern
```typescript
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill('[name="email"]', "e2e-test@thina-crm.test");
  await page.fill('[name="password"]', "E2eTestPass123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
});
```

### E2E Test Pattern
```typescript
test("should display lead list", async ({ page }) => {
  await page.goto("/leads");
  await expect(page.locator("h1")).toContainText("Leads");
  // Check table is visible
  await expect(page.locator("table")).toBeVisible();
});
```

### What to Test (E2E)
- Page navigation and rendering
- CRUD operations via the UI (create, view, edit, delete)
- Form validation and error states
- Auth flow (login, logout, protected routes)
- Dashboard data loading

## Running Tests
```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# E2E tests (against live deployment)
npm run test:e2e

# E2E tests against local dev server
DEPLOY_URL=http://localhost:3000 npm run test:e2e
```

## Current Test Counts
- Unit tests: 91 (Vitest)
- E2E tests: 89 (Playwright)
- Total: 180
