// Find EXACTLY who rewrites _fbc and from where (stack traces).
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
  window.__fbcWrites = [];
  const desc = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  Object.defineProperty(Document.prototype, "cookie", {
    get: desc.get,
    set(value) {
      if (String(value).startsWith("_fbc=")) {
        window.__fbcWrites.push({ v: value.slice(0, 90), stack: (new Error().stack || "").split("\n").slice(1, 6).join(" | ") });
      }
      return desc.set.call(this, value);
    },
    configurable: true,
  });
});

await page.goto(
  BASE + "/product/divan?fbclid=PLAINfbclid123XYZ&fb_test_event_code=T1",
  { waitUntil: "domcontentloaded", timeout: 60000 },
);
const samples = [];
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(500);
  samples.push(
    await page.evaluate(() => {
      const m = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/);
      return `${Date.now() % 100000}: ${m ? m[1] : "(none)"}`;
    }),
  );
}
console.log("cookie timeline:");
samples.forEach((s) => console.log("  " + s));
const writes = await page.evaluate(() => window.__fbcWrites);
console.log(`_fbc writes: ${writes.length}`);
writes.forEach((w, i) => console.log(`\n#${i + 1} value: ${w.v}\n   stack: ${w.stack}`));
await browser.close();
