// Isolate the _fbc rewriter: block Meta's fbevents.js and watch the cookie.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = await import(
    "file:///C:/Users/abdulraheem%20bulbul/AppData/Roaming/npm/node_modules/omniroute/node_modules/playwright/index.mjs"
  ));
}
const BASE = "http://localhost:5199";
const browser = await chromium.launch({ channel: "chrome", headless: true });

async function run(blockFbevents) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  if (blockFbevents) {
    await ctx.route("**/connect.facebook.net/**", (r) => r.abort());
  }
  const page = await ctx.newPage();
  await page.goto(BASE + "/product/divan?fbclid=AbC123%2BxYz", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);
  const early = await page.evaluate(() => (document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/) || [])[1] || "(none)");
  await page.waitForTimeout(6000);
  const late = await page.evaluate(() => (document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/) || [])[1] || "(none)");
  console.log(`fbevents ${blockFbevents ? "BLOCKED" : "ALLOWED"}: early=${early} late=${late} lateIsEarly=${early === late}`);
  await ctx.close();
}

await run(true); // block fbevents.js — only OUR seed can write
await run(false); // allow — see if fbevents rewrites

await browser.close();
