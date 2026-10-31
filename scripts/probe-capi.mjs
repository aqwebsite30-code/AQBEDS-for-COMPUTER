import { createRequire } from "module";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } =
    await import("file:///C:/Users/abdulraheem%20bulbul/AppData/Roaming/npm/node_modules/omniroute/node_modules/playwright/index.mjs"));
}
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const p = await (await b.newContext()).newPage();
  const reqs = [];
  const consoles = [];
  p.on("request", (r) => {
    if (r.url().includes("meta-capi") || r.url().includes("ipify"))
      reqs.push({ u: r.url().slice(0, 70), m: r.method() });
  });
  p.on("console", (m) => {
    const t = m.text();
    if (t.includes("[CAPI]") || t.includes("ipify")) consoles.push(t.slice(0, 120));
  });
  await p.goto("https://www.aqbeds.com/?fb_test_event_code=PRODTEC77", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await p.waitForTimeout(25000);
  const ipTime = await p.evaluate(async () => {
    const t = Date.now();
    try {
      const r = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(15000),
      });
      const j = await r.json();
      return { ms: Date.now() - t, ip: j.ip };
    } catch (e) {
      return "FAIL:" + e.message;
    }
  });
  const fbc = await p.evaluate(() => document.cookie);
  console.log(JSON.stringify({ reqs, consoles, ipTime, hasFbc: fbc.includes("_fbc") }, null, 2));
  await b.close();
})();
