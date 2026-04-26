import { chromium } from "playwright";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
page.on("console", m => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
page.on("requestfailed", r => errors.push("REQFAIL: " + r.url() + " " + r.failure()?.errorText));
try {
  await page.goto("https://thina-crm--thina-crm.europe-west4.hosted.app/login", { waitUntil: "networkidle", timeout: 60000 });
} catch (e) {
  errors.push("GOTO_ERROR: " + e.message);
}
await new Promise(r => setTimeout(r, 5000));
const hasEmail = await page.locator("#email").count();
const h1 = await page.locator("h1").allTextContents();
const bodyText = (await page.locator("body").innerText()).slice(0, 500);
const url = page.url();
console.log("URL:", url);
console.log("hasEmail:", hasEmail);
console.log("h1:", JSON.stringify(h1));
console.log("body:", JSON.stringify(bodyText));
console.log("--- errors ---");
errors.forEach(e => console.log(e));
await browser.close();
