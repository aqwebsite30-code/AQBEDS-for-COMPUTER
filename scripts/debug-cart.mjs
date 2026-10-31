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
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + "/shop", { waitUntil: "domcontentloaded" });
await page.waitForSelector('a[href*="/product/"]');
const href = await page.locator('a[href*="/product/"]').first().getAttribute("href");
console.log("PDP:", href);
await page.goto(BASE + href, { waitUntil: "domcontentloaded" });
await page.waitForSelector('button:has-text("Add To Basket")');
await page.waitForTimeout(3000); // let React hydrate before clicking
await page.locator('button:has-text("Add To Basket")').first().click();
await page.waitForTimeout(2000);
const cart = await page.evaluate(() => localStorage.getItem("aq-beds-cart"));
console.log("CART:", cart);
const waBtns = await page.locator('button:has-text("Order via WhatsApp")').count();
console.log("WA buttons on PDP:", waBtns);
await page.goto(BASE + "/cart", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const bodyText = await page.locator("body").innerText();
console.log(
  "CART PAGE contains 'Your basket is empty':",
  bodyText.includes("Your basket is empty"),
);
console.log("CART PAGE contains 'Order via WhatsApp':", bodyText.includes("Order via WhatsApp"));
await page.screenshot({ path: "screenshots/wa-debug-cart.png" });
await browser.close();
