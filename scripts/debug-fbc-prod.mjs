// Read-only snapshot: how does Meta's fbevents.js treat a %2B fbclid on PROD?
// (prod still has the OLD seed that writes the raw regex value)
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
const BASE = "https://www.aqbeds.com";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await page.goto(BASE + "/product/divan?fbclid=AbC123%2BxYz", { waitUntil: "domcontentloaded", timeout: 60000 });
for (const wait of [900, 1500, 3000, 5000]) {
  await page.waitForTimeout(wait);
  const snap = await page.evaluate(() => {
    const m = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/);
    return { fbc: m ? m[1] : "(none)", search: window.location.search };
  });
  console.log(`cumulative snapshot:`, JSON.stringify(snap));
}
await browser.close();
