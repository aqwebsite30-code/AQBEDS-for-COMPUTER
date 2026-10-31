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
const out = { capi: [], popups: [], pixel: [] };

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  window.__fbqCalls = [];
  const stub = function () {
    window.__fbqCalls.push(Array.from(arguments));
  };
  stub.q = [];
  window.fbq = stub;
});
const page = await ctx.newPage();
page.on("request", (req) => {
  if (req.url().includes("/api/meta-capi") && req.method() === "POST") {
    try {
      const b = JSON.parse(req.postData() || "{}");
      out.capi.push({ name: b.event_name, id: b.event_id, tec: b.test_event_code || null });
    } catch {}
  }
});
page.on("popup", (p) => {
  out.popups.push(p.url());
  p.close().catch(() => {});
});

// PDP WhatsApp flow (single button click path — form + submit).
await page.goto(BASE + "/product/lucca-anton-sofa-bed", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForSelector('button:has-text("Order via WhatsApp")', { timeout: 30000 });
await page.waitForTimeout(3000);
await page.locator('button:has-text("Order via WhatsApp")').first().click();
await page.waitForSelector("#order-details-name", { timeout: 15000 });
await page.waitForTimeout(500);
await page.fill("#order-details-name", "Gate Check");
await page.fill("#order-details-phone", "07700900456");
await page.fill("#order-details-address", "1 Test Road");
await page.fill("#order-details-city", "York");
await page.fill("#order-details-postcode", "YO1 7HH");
const before = out.capi.length;
const pxBefore = (await page.evaluate(() => window.__fbqCalls)).length;
await page.locator('button:has-text("Continue to WhatsApp")').click();
await page.waitForTimeout(3000);
const px = await page.evaluate(() => window.__fbqCalls);
out.pixel = px.slice(pxBefore).map((c) => ({ evt: c[1], eventID: c[3] && c[3].eventID }));
out.capiNew = out.capi.slice(before);
out.waOpened = out.popups.filter((u) => u.includes("whatsapp.com")).length;

// No Purchase from this flow?
out.noFakePurchase =
  !out.capiNew.some((c) => c.name === "Purchase") && !out.pixel.some((p) => p.evt === "Purchase");
out.hasContact =
  out.capiNew.some((c) => c.name === "Contact") && out.pixel.some((p) => p.evt === "Contact");
out.dedupeMatch = out.capiNew.some((c) => out.pixel.some((p) => p.eventID === c.id));

console.log(JSON.stringify(out, null, 2));
await browser.close();
