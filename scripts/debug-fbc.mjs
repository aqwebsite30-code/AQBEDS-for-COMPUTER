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
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

page.on("request", (req) => {
  const u = req.url();
  if (u.includes("facebook") && (u.includes("fbclid") || u.includes("tr?") || u.includes("connect"))) {
    console.log("REQ→Meta:", u.slice(0, 200));
  }
});

const url = BASE + "/product/divan?fb_test_event_code=T1&fbclid=AbC123%2BxYz";
console.log("NAVIGATING:", url);
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

for (const wait of [1000, 2000, 3000]) {
  await page.waitForTimeout(wait);
  const snap = await page.evaluate(() => ({
    href: window.location.href,
    search: window.location.search,
    cookies: document.cookie,
  }));
  console.log(`T+${wait}ms href:`, snap.href);
  console.log(`T+${wait}ms search:`, snap.search);
  console.log(`T+${wait}ms cookies:`, snap.cookies, "\n---");
}

// What does the module-seed produce in isolation?
const seedTest = await page.evaluate(() => {
  const u = new URL("http://localhost:5199/x?fbclid=AbC123%2BxYz");
  return { urlSearchParams: new URLSearchParams(u.search).get("fbclid") };
});
console.log("URLSearchParams decode of AbC123%2BxYz:", JSON.stringify(seedTest));

await browser.close();
