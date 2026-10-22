// Does the Meta pixel actually send network beacons? Probe prod (and any
// BASE) for requests leaving to facebook.com after fbevents loads.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } =
    await import("file:///C:/Users/abdulraheem%20bulbul/AppData/Roaming/npm/node_modules/omniroute/node_modules/playwright/index.mjs"));
}
const BASE = process.env.BASE || "https://www.aqbeds.com";
const browser = await chromium.launch({ channel: "chrome", headless: process.env.HEADED !== "1" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const seen = [];
const failed = [];
const logs = [];
const all = [];
let phase = "pre";
const page = await ctx.newPage();
page.on("console", (m) => {
  const txt = m.text();
  if (/fb|pixel|facebook|consent|beacon/i.test(txt)) logs.push(m.type() + ": " + txt.slice(0, 200));
});
page.on("requestfailed", (r) => {
  const u = r.url();
  if (u.includes("facebook")) failed.push(u.split("?")[0] + " :: " + (r.failure() || {}).errorText);
});
page.on("request", (r) => {
  const u = r.url();
  if (u.includes("facebook"))
    seen.push({
      method: r.method(),
      url: u.split("?")[0],
      q: u.includes("?") ? "?" + u.split("?")[1].slice(0, 200) : "",
    });
  all.push({ phase, method: r.method(), url: u.split("?")[0] });
});
await page.goto(BASE + "/product/divan?fb_test_event_code=T1", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
await page.waitForTimeout(6000);
phase = "post";
// Manual track → does dispatch work at all?
await page.evaluate(() => {
  try {
    window.fbq(
      "track",
      "ViewContent",
      { content_name: "probe-manual" },
      { eventID: "probe-uuid-1234" },
    );
  } catch (e) {
    console.log("fbq manual threw: " + e.message);
  }
});
await page.waitForTimeout(6000);
const fbqState = await page.evaluate(() => ({
  hasFbq: typeof window.fbq === "function",
  pixelId: (window.fbq && window.fbq.getPixelId && window.fbq.getPixelId()) || "(no getPixelId)",
  calls: (window.fbq && window.fbq.q && window.fbq.q.length) || 0,
  visibility: document.visibilityState,
  focused: document.hasFocus(),
}));
console.log("BASE:", BASE);
console.log("fbq:", JSON.stringify(fbqState));
console.log(`facebook-ish requests (${seen.length}):`);
seen.forEach((s, i) => console.log(` #${i + 1} ${s.method} ${s.url}\n     ${s.q}`));
console.log("POST-manual-track requests (all domains):");
all.filter((r) => r.phase === "post").forEach((r) => console.log(` ${r.method} ${r.url}`));
if (failed.length) console.log("FAILED:", JSON.stringify(failed, null, 1));
if (logs.length) console.log("console:", JSON.stringify([...new Set(logs)], null, 1));
await browser.close();
