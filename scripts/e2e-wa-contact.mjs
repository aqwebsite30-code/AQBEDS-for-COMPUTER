import { createRequire } from "module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } =
    await import("file:///C:/Users/abdulraheem%20bulbul/AppData/Roaming/npm/node_modules/omniroute/node_modules/playwright/index.mjs"));
}

const BASE = "http://localhost:5199";
const results = { pixel: [], capi: [], leads: [], popups: [], admin: {} };

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

await context.addInitScript(() => {
  window.__fbqCalls = [];
  window.fbq = function () {
    window.__fbqCalls.push(Array.from(arguments));
  };
});

const page = await context.newPage();

page.on("request", (req) => {
  const url = req.url();
  if (url.includes("/api/meta-capi") && req.method() === "POST") {
    try {
      results.capi.push(JSON.parse(req.postData() || "{}"));
    } catch {}
  }
  if (url.includes("/api/admin/whatsapp-lead") && req.method() === "POST") {
    try {
      results.leads.push(JSON.parse(req.postData() || "{}"));
    } catch {}
  }
});
page.on("popup", (p) => {
  results.popups.push(p.url());
  p.close().catch(() => {});
});

async function readPixelCalls() {
  return page.evaluate(() => window.__fbqCalls || []);
}

async function fillDetailsForm() {
  await page.fill("#order-details-name", "Test User");
  await page.fill("#order-details-phone", "07700900123");
  await page.fill("#order-details-address", "12 Test Street");
  await page.fill("#order-details-city", "Leeds");
  await page.fill("#order-details-postcode", "LS1 4AB");
}

// ── Step 1: PDP WhatsApp button ──────────────────────────────────────────────
await page.goto(BASE + "/shop", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector('a[href*="/product/"]', { timeout: 30000 });
const pdpHref = await page.locator('a[href*="/product/"]').first().getAttribute("href");
await page.goto(BASE + pdpHref, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector('button:has-text("Add To Basket")', { timeout: 30000 });
await page.waitForTimeout(3000); // let React hydrate before clicking

// Add to basket (needed later for cart + checkout pages), then close the drawer.
await page.locator('button:has-text("Add To Basket")').first().click();
await page.waitForTimeout(1500);
await page
  .locator('button[aria-label="Close cart"]')
  .first()
  .click({ timeout: 10000 })
  .catch(async () => {
    await page
      .locator('button[aria-label="Shopping basket"]')
      .first()
      .click({ force: true })
      .catch(() => {});
  });
await page.waitForTimeout(800);

// PDP WhatsApp order (does not require the cart).
await page.locator('button:has-text("Order via WhatsApp")').first().click();
await page.waitForSelector("#order-details-name", { timeout: 15000 });
await page.waitForTimeout(500); // hydrate form handlers
await fillDetailsForm();
const pxBeforePdp = (await readPixelCalls()).length;
await page.locator('button:has-text("Continue to WhatsApp")').click();
await page.waitForTimeout(2500);
const pdpPixel = (await readPixelCalls()).slice(pxBeforePdp);

// ── Step 2: Cart page WhatsApp button ───────────────────────────────────────
await page.goto(BASE + "/cart", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector('button:has-text("Order via WhatsApp")', { timeout: 20000 });
await page.waitForTimeout(2000); // hydrate
await page.locator('button:has-text("Order via WhatsApp")').click();
await page.waitForSelector("#order-details-name", { timeout: 15000 });
await page.waitForTimeout(500);
await fillDetailsForm();
const pxBeforeCart = (await readPixelCalls()).length;
const capiBeforeCart = results.capi.length;
await page.locator('button:has-text("Continue to WhatsApp")').click();
await page.waitForTimeout(2500);
const cartPixel = (await readPixelCalls()).slice(pxBeforeCart);

// ── Step 3: Checkout page WhatsApp button ───────────────────────────────────
await page.goto(BASE + "/checkout", { waitUntil: "domcontentloaded", timeout: 60000 });
await page
  .locator('#main-content button:has-text("Order on WhatsApp")')
  .first()
  .waitFor({ timeout: 30000 });
await page.waitForTimeout(2000); // hydrate
await page.fill('input[name="name"]', "Test User");
await page.fill('input[name="phone"]', "07700900123");
await page.fill('textarea[name="addr1"], input[name="addr1"]', "12 Test Street");
await page.fill('input[name="city"]', "Leeds");
await page.fill('input[name="postcode"]', "LS1 4AB");
const pxBeforeCo = (await readPixelCalls()).length;
const capiBeforeCo = results.capi.length;
await page.locator('#main-content button:has-text("Order on WhatsApp")').first().click();
await page.waitForTimeout(2500);
const coPixel = (await readPixelCalls()).slice(pxBeforeCo);

// ── Step 4: Admin analytics — Live + Day ────────────────────────────────────
await page.goto(BASE + "/admin/login", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.fill('input[placeholder="Enter your access key"]', "123");
await page.click('button[type="submit"]');
await page.waitForFunction(() => !!localStorage.getItem("admin_token"), { timeout: 20000 });
await page.waitForURL(/\/admin$/, { timeout: 20000 });
await page.goto(BASE + "/admin/analytics", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(4000);
// Live view: find rows whose type label is "WhatsApp visit".
const liveText = await page.locator("body").innerText();
results.admin.liveHasWhatsAppVisit = liveText.includes("WhatsApp visit");
results.admin.liveHasWhatsappChip = liveText.includes("WhatsApp");
await page.screenshot({
  path: "C:/Users/abdulraheem bulbul/Desktop/Final-code-of-aqbeds-one-master/Final-code-of-aqbeds-one-master/screenshots/wa01-live.png",
  fullPage: false,
});

// Click the "WhatsApp" filter chip (2nd chip in the filter row).
const waChip = page.locator('button:text-is("WhatsApp")').first();
if (await waChip.count()) {
  await waChip.click();
  await page.waitForTimeout(1500);
  const filteredText = await page.locator("body").innerText();
  results.admin.whatsappChipFiltered = filteredText.includes("WhatsApp visit");
  await page.screenshot({
    path: "C:/Users/abdulraheem bulbul/Desktop/Final-code-of-aqbeds-one-master/Final-code-of-aqbeds-one-master/screenshots/wa02-live-filtered.png",
  });
}

results.pixel = { pdp: pdpPixel, cart: cartPixel, checkout: coPixel };
results.capiCount = results.capi.length;
results.leadCount = results.leads.length;
results.leadSources = results.leads.map((l) => l.source_button);
results.capiEventNames = results.capi.map((c) => c.event_name);
results.capiEventIds = results.capi.map((c) => c.event_id);
results.popupsWa = results.popups.filter((u) => u.includes("wa.me")).length;

console.log(JSON.stringify(results, null, 2));
await browser.close();
