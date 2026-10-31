import { createRequire } from "module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } =
    await import("file:///C:/Users/abdulraheem%20bulbul/AppData/Roaming/npm/node_modules/omniroute/node_modules/playwright/index.mjs"));
}
const BASE = "https://www.aqbeds.com";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await page.goto(BASE + "/admin/login", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.fill('input[placeholder="Enter your access key"]', "123");
await page.click('button[type="submit"]');
await page.waitForFunction(() => !!localStorage.getItem("admin_token"), { timeout: 20000 });
await page.waitForURL(/\/admin$/, { timeout: 20000 });

await page.goto(BASE + "/admin/analytics", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(3000);
// Dismiss cookie banner if present.
const accept = page.locator('button:has-text("Accept")');
if (await accept.count())
  await accept
    .first()
    .click()
    .catch(() => {});
// Switch to the Live tab and wait for the feed to finish loading.
await page.locator('button:has-text("Live")').first().click();
await page
  .waitForSelector("text=Loading live feed...", { state: "detached", timeout: 45000 })
  .catch(() => {});
await page.waitForTimeout(2000);

const out = {};
const liveText = await page.locator("body").innerText();
out.liveHasWhatsAppVisit = liveText.includes("WhatsApp visit");
out.liveHasWhatsappChip = liveText.includes("WhatsApp");
out.liveHasPurchaseChip = liveText.includes("Purchases");
await page.screenshot({ path: "screenshots/wa03-live-with-lead.png" });

// Click the WhatsApp filter chip.
const waChip = page.locator('button:text-is("WhatsApp")').first();
if (await waChip.count()) {
  await waChip.click();
  await page.waitForTimeout(1500);
  const t = await page.locator("body").innerText();
  out.filterShowsWhatsAppVisit = t.includes("WhatsApp visit");
  await page.screenshot({ path: "screenshots/wa04-live-filtered.png" });
}

// Day View tab.
await page.locator('button:has-text("Day View")').first().click();
await page.waitForTimeout(5000);
const dayText = await page.locator("body").innerText();
out.dayHasWhatsAppVisit = dayText.includes("WhatsApp Visit") || dayText.includes("WhatsApp visit");
await page.screenshot({ path: "screenshots/wa05-day-view.png" });

console.log(JSON.stringify(out, null, 2));
await browser.close();
