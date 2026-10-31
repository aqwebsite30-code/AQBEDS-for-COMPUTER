// What does Meta's fbevents.js ITSELF write for ?fbclid=AbC123%2BxYz on a
// fresh profile? Swallow only OUR seed writes (stack from localhost) so
// fbevents sees a missing cookie and writes its own canonical value.
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
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await ctx.addInitScript(() => {
  window.__allWrites = [];
  const desc = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  Object.defineProperty(Document.prototype, "cookie", {
    get: desc.get,
    set(value) {
      if (String(value).startsWith("_fbc=")) {
        const stack = new Error().stack || "";
        const ours = stack.includes("localhost:5199") || stack.includes("meta-pixel");
        window.__allWrites.push({ ours, v: value.slice(0, 70) });
        if (ours) return; // swallow OUR seed — let fbevents decide on a fresh cookie
      }
      return desc.set.call(this, value);
    },
    configurable: true,
  });
});

await page.goto(BASE + "/product/divan?fbclid=AbC123%2BxYz", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(8000);
const data = await page.evaluate(() => ({
  writes: window.__allWrites,
  final: (document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/) || [])[1] || "(none)",
}));
console.log("writes:");
data.writes.forEach((w, i) => console.log(` #${i + 1} ours=${w.ours} ${w.v}`));
console.log("FINAL cookie (fbevents-only):", data.final);
await browser.close();
