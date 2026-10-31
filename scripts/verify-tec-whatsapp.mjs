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
const TEC = "PRODTEC77";
const out = { capi: [], pixel: [], popups: [], errs: [] };

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
page.on("pageerror", (e) => out.errs.push(String(e).slice(0, 120)));
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

// ── TEST 1: PDP WhatsApp → pixel Contact + CAPI Contact (with tec) ──────────
await page.goto(BASE + "/product/lucca-anton-sofa-bed?fb_test_event_code=" + TEC, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForSelector('button:has-text("Order via WhatsApp")', { timeout: 30000 });
await page.waitForTimeout(3000);
const px0 = (await page.evaluate(() => window.__fbqCalls)).length;
const capi0 = out.capi.length;
await page.locator('button:has-text("Order via WhatsApp")').first().click();
await page.waitForSelector("#order-details-name", { timeout: 15000 });
await page.waitForTimeout(500);
await page.fill("#order-details-name", "TEC Check");
await page.fill("#order-details-phone", "07700900789");
await page.fill("#order-details-address", "5 Verify Lane");
await page.fill("#order-details-city", "York");
await page.fill("#order-details-postcode", "YO1 7HH");
await page.locator('button:has-text("Continue to WhatsApp")').click();
// Wait until the Contact CAPI POST actually leaves the browser (ipify can be slow).
await page
  .waitForRequest(
    (r) =>
      r.url().includes("/api/meta-capi") &&
      r.method() === "POST" &&
      (r.postData() || "").includes("Contact"),
    { timeout: 60000 },
  )
  .catch(() => out.errs.push("Contact CAPI POST not seen in 60s"));
await page.waitForTimeout(1500);

out.test1 = {
  pixel: (await page.evaluate(() => window.__fbqCalls))
    .slice(px0)
    .map((c) => ({ evt: c[1], eventID: c[3] && c[3].eventID })),
  capi: out.capi.slice(capi0),
  waOpened: out.popups.filter((u) => u.includes("whatsapp.com")).length,
};
const allEvt = [...out.test1.pixel.map((p) => p.evt), ...out.test1.capi.map((c) => c.name)];
out.test1.zeroPurchase = !allEvt.includes("Purchase");
out.test1.pixelContact = out.test1.pixel.some((p) => p.evt === "Contact");
out.test1.capiContact = out.test1.capi.some((c) => c.name === "Contact");
out.test1.dedupe = out.test1.capi.some((c) => out.test1.pixel.some((p) => p.eventID === c.id));
out.test1.tecCarried = out.test1.capi.some((c) => c.tec === TEC);

console.log(JSON.stringify(out, null, 2));
await browser.close();
