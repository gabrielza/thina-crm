import { defineConfig } from "@playwright/test";

/**
 * Playwright config for on-demand functional/UI testing.
 * NOT part of CI — run manually with: npm run test:e2e
 *
 * By default tests against the live deployment.
 * Override with: DEPLOY_URL=http://localhost:3000 npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  expect: { timeout: 30000 },
  fullyParallel: false, // sequential — tests may depend on auth state
  retries: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.DEPLOY_URL || "https://thina-crm--thina-crm.europe-west4.hosted.app",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
