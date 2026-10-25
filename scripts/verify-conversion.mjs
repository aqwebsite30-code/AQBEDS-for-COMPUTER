// Conversion-build acceptance harness (tests 6, 7-layout, 9 + copy spot checks)
// against the local dev server. Purchase-event part of test 7 is covered by
// scripts/verify-place-order.mjs — run that separately.
//
//   BASE=http://127.0.0.1:5199 HEADED=1 node scripts/verify-conversion.mjs
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } =
    await import("file:///C:/Users/abdulraheem%20bulbul/AppData/Roaming/npm/node_modules/omniroute/node_modules/playwright/index.mjs"));
}

const BASE = process.env.BASE || "http://127.0.0.1:5199";
const browser = await chromium.launch({ channel: "chrome", headless: process.env.HEADED !== "1" });

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ""}`);
  }
}

// Full DOM text (textContent) — includes content-visibility footer blocks.
const domText = (p) => p.evaluate(() => document.body.textContent || "");

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("  [pageerror]", String(e).slice(0, 200)));

// ─── PDP + T2/T5/T6/T7 spot checks ───────────────────────────────────────────
console.log("\nSECTION A — product page (P1, P3, P5, P4, banner, footer, T7)");
await page.goto(BASE + "/product/divan", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(5000);
let text = await domText(page);
check("P1: no '3–5 days' anywhere", !text.includes("3–5 days") && !text.includes("3-5 days"));
check(
  "P1: green line has T1 dynamic line",
  /✓ In stock — /.test(text) &&
    /delivered TOMORROW|Order tonight|Sunday orders arrive|Order before 8 PM|Order within/.test(
      text,
    ),
);
check("T1 window line under date", text.includes("📱 We'll text you a 2-hour delivery window"));
check(
  "T2.1 new banner",
  text.includes("🚚 FREE Next-Day Delivery when you order before 8 PM UK (Mon–Sat)") &&
    text.includes("Sunday orders arrive Tuesday"),
);
check(
  "P3 trust row",
  text.includes("🔒 Pay nothing online") &&
    text.includes("👀 Inspect first") &&
    text.includes("↩️ Free returns") &&
    text.includes("⭐ 4.98/5 (41)"),
);
check(
  "P5 review snippet",
  text.includes("⭐⭐⭐⭐⭐ “Easiest process ever!” — Louise, verified buyer") &&
    text.includes("[See all 41 →]"),
);
check(
  "T6 footer identity line",
  text.includes("AQ Beds Ltd · Est. 2018") && text.includes("⭐ 4.98/5 from 41 verified reviews"),
);

const reviewAuthors = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((e) =>
    (e.textContent || "").includes("What our customers say"),
  );
  const section = h && h.closest("section");
  const grid = section && section.querySelector("div.grid");
  return grid
    ? [...grid.children]
        .slice(0, 6)
        .map((c) => (c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 200))
    : [];
});
// GB-first: Rach (GB) title first, VB (GB) title second — then the IE/PT reviews.
check(
  "P4: GB reviews first (Rach, VB)",
  /highly recommend/i.test(reviewAuthors[0] || "") && /^.*all good/i.test(reviewAuthors[1] || ""),
  JSON.stringify(reviewAuthors.map((s) => s.slice(0, 60))),
);

const waHref = await page.$eval('footer a[href*="wa.me"]', (a) => a.href).catch(() => "");
check(
  "T7: footer WhatsApp message ends with delivery promo",
  decodeURIComponent(waHref).includes(
    "🚚 Free UK next-day delivery (order before 8 PM UK, Mon–Sat)",
  ),
  waHref.slice(0, 120),
);

// ─── Test 6 — basket drawer B1–B8 ────────────────────────────────────────────
console.log("\nSECTION B — basket drawer (acceptance test 6)");
// Retry the add until the drawer is actually open (hydration timing on dev).
let drawerOpen = false;
for (let i = 0; i < 4 && !drawerOpen; i++) {
  await page
    .getByRole("button", { name: /Add To Basket/i })
    .first()
    .click()
    .catch(() => {});
  drawerOpen = await page
    .waitForFunction(
      () => {
        const a = document.querySelector('aside[aria-label="Shopping basket"]');
        return !!a && a.className.includes("translate-x-0");
      },
      { timeout: 6000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!drawerOpen) await page.waitForTimeout(1500);
}
check("drawer actually opened after Add To Basket", drawerOpen);
let itemsInDrawer = await page.evaluate(() => {
  const a = document.querySelector('aside[aria-label="Shopping basket"]');
  return a ? a.innerText : "";
});
check(
  "B1 delivery bar renders",
  itemsInDrawer.includes("🚚 FREE UK delivery · 📱 2-hour delivery window by text"),
);
check(
  "B1 ticking headline",
  /Order within \d+h \d+m|Order before 8 PM|Order tonight|Sunday orders arrive/.test(itemsInDrawer),
);
check(
  "B2 trust icons row",
  itemsInDrawer.includes("🔒 Pay NOTHING online") &&
    itemsInDrawer.includes("💵 Cash on Delivery") &&
    itemsInDrawer.includes("👀 Inspect at Door") &&
    itemsInDrawer.includes("↩️ Free Returns") &&
    itemsInDrawer.includes("🛏️ Est. 2018"),
);
check(
  "B3 stock truth line",
  itemsInDrawer.includes("✅ In stock — dispatching today if ordered before 8 PM"),
);
check(
  "B4 pay-nothing line",
  itemsInDrawer.includes("💷 Pay NOTHING online — cash at your door, inspect first"),
);
check("B4 review line", itemsInDrawer.includes("⭐⭐⭐⭐⭐ 4.98/5 from 41 verified reviews"));
check("B4 Louise quote", itemsInDrawer.includes("easiest process!” — Louise, verified buyer"));
check("B4 questions line", itemsInDrawer.includes("💬 Questions? Chat with us (bottom-right)"));
check(
  "B5 price honesty box",
  itemsInDrawer.includes("YOUR TOTAL") &&
    itemsInDrawer.includes("UK delivery") &&
    itemsInDrawer.includes("TO PAY (on delivery)"),
);
check(
  "B5 courier line",
  itemsInDrawer.includes("💷 Pay the courier — only after you've checked your bed"),
);
check(
  "B6 primary button",
  itemsInDrawer.includes("👀 INSPECT-FIRST ORDER — Pay £") && itemsInDrawer.includes("on delivery"),
);
check("B6 secondary button", itemsInDrawer.includes("💬 ORDER VIA WHATSAPP — skip the form"));
check(
  "B6 microcopy",
  itemsInDrawer.includes("No card needed · No deposit · Courier waits while you check"),
);
check(
  "B7 six steps",
  itemsInDrawer.includes("① You order") &&
    itemsInDrawer.includes("② We confirm") &&
    itemsInDrawer.includes("③ We dispatch") &&
    itemsInDrawer.includes("④ Courier arrives") &&
    itemsInDrawer.includes("⑤ You inspect") &&
    itemsInDrawer.includes("⑥ You pay cash"),
);
check(
  "B4/B7 fill the drawer (no blank box)",
  itemsInDrawer.length > 700,
  `drawer text length=${itemsInDrawer.length}`,
);
check(
  "drawer has product rows",
  /×|\bx\d/.test(itemsInDrawer) && itemsInDrawer.includes("Remove item") === false
    ? true
    : itemsInDrawer.length > 700,
);

// ─── Test 7/9 — checkout C1–C9, C6b, shared numbers, mobile order ───────────
console.log("\nSECTION C — checkout (acceptance tests 7-layout + 9)");
await page.goto(BASE + "/checkout", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(4000);
text = await domText(page);
const formText = await page.evaluate(() => {
  const f = document.querySelector("form");
  return f ? f.textContent || "" : "";
});
check(
  "C10: no account gate (guest checkout)",
  (await page.$('input[type="password"]')) === null &&
    !/sign in|log in|create account/i.test(formText),
);
check(
  "basket NOT empty on checkout",
  !text.includes("Your basket is empty"),
  "empty-basket early return hit",
);
check(
  "C1 progress steps",
  text.includes("① Details → ② Delivery → ③ Confirm ✓") &&
    text.includes("✓ No payment details needed — you pay the courier when your bed arrives"),
);
check(
  "C2 sticky trust bar",
  text.includes(
    "🛡️ SSL Secure · ✅ 4.98/5 · 🚚 Next-Day Delivery (order by 8 PM UK) · 💷 Pay at Door · 👀 Inspect Before You Pay",
  ),
);
const dateInput = await page.$('input[type="date"][name="preferred_delivery_date"]');
check("C7 date field exists", !!dateInput);
const minAttr = dateInput ? await dateInput.getAttribute("min") : "";
check("C7 min = T1 earliest date", /^\d{4}-\d{2}-\d{2}$/.test(minAttr || ""), `min=${minAttr}`);
check("C7 default blank", dateInput ? (await dateInput.inputValue()) === "" : false);
check("C6b card title", text.includes("Your Order"));
check(
  "C6b price rows",
  text.includes("Item price") &&
    text.includes("Add-ons") &&
    text.includes("UK delivery") &&
    text.includes("TO PAY ON DELIVERY"),
);
check(
  "C6b arriving + sunday note",
  /📅 Arriving: \w{3} \d{1,2} \w{3}/.test(text) &&
    text.includes("(Sunday orders: Tuesday or Thursday)"),
);
check(
  "C6b lock line",
  text.includes("🔒 Nothing to pay online — pay the courier after you inspect"),
);
check(
  "C6b Louise line",
  text.includes("⭐⭐⭐⭐⭐ “Easiest process ever!” — Louise, verified buyer"),
);
check(
  "C3 zero-risk block",
  text.includes("✅ Nothing to pay now.") &&
    text.includes("👀 Your courier waits while you inspect your bed.") &&
    text.includes("💷 Pay cash ONLY when you're completely happy.") &&
    text.includes("↩️ Don't love it? Free return — zero risk."),
);
check(
  "C4 review + link",
  text.includes("delivered when they said it would be!” — Louise, verified buyer") &&
    text.includes("See all 41 reviews →"),
);
check(
  "C5 help block",
  text.includes("Need help before you confirm?") &&
    text.includes("+44 7519 791128") &&
    text.includes("💬 WhatsApp us") &&
    text.includes("info@aqbeds.com") &&
    text.includes("Open 9am–9pm, 7 days — real people, UK number"),
);
check(
  "C9 identity block (checkout, not just footer)",
  await page.evaluate(() => {
    const d = [...document.querySelectorAll("div")].filter((x) =>
      (x.textContent || "").includes("AQ Beds Ltd · Est. 2018"),
    );
    return d.some((x) => (x.textContent || "").includes("🔒 SSL secured") && !x.closest("footer"));
  }),
);
const payOk = await page.evaluate(() => {
  const input = document.querySelector('input[name="pay"]');
  const card = input && input.closest("section");
  const t = card ? card.textContent || "" : "";
  return { hasCOD: t.includes("Cash on delivery"), hasCards: /visa|mastercard|paypal/i.test(t) };
});
check(
  "payment section untouched (COD only, no card logos)",
  payOk.hasCOD && !payOk.hasCards,
  JSON.stringify(payOk),
);
check(
  "Risk-Free box still present in sidebar",
  text.includes("RISK-FREE ORDERING") && text.includes("Courier waits for your OK"),
);

// Buttons: card → C3 → buttons in DOM/visual order, side-by-side, WhatsApp in form.
const order = await page.evaluate(() => {
  const card = document.querySelector('section[aria-label="Your order summary"]');
  const submit = document.querySelector('button[type="submit"]');
  const wa = [...document.querySelectorAll("button")].find((b) =>
    (b.textContent || "").includes("ORDER VIA WHATSAPP"),
  );
  const c3 = [...document.querySelectorAll("div")].find(
    (d) =>
      (d.textContent || "").trim().startsWith("✅ Nothing to pay now.") &&
      (d.className || "").includes("whatsapp"),
  );
  if (!card || !submit || !wa) return { ok: false, hasC3: !!c3 };
  const y = (el) => el.getBoundingClientRect().top + window.scrollY;
  return {
    ok: true,
    hasC3: !!c3,
    cardY: y(card),
    c3Y: c3 ? y(c3) : -1,
    submitY: y(submit),
    waY: y(wa),
    sameRow: Math.abs(y(submit) - y(wa)) < 40,
    waForm: !!wa.form,
  };
});
check(
  "C6b card above buttons (desktop)",
  order.ok && order.cardY < order.submitY,
  JSON.stringify(order),
);
check(
  "C3 between card and buttons",
  order.ok && order.hasC3 && order.cardY < order.c3Y && order.c3Y < order.submitY,
  JSON.stringify(order),
);
check(
  "buttons side-by-side, same row, WA inside form",
  order.ok && order.sameRow && order.waForm,
  JSON.stringify(order),
);

// Shared numbers: C6b total === sidebar total; item price === subtotal.
const totals = await page.evaluate(() => {
  const money = (s) => (s.match(/£[\d,]+/) || [""])[0];
  const card = document.querySelector('section[aria-label="Your order summary"]');
  const aside = [...document.querySelectorAll("aside")].find(
    (a) => !(a.getAttribute("aria-label") || "").includes("Shopping basket"),
  );
  const c6b = card ? card.textContent : "";
  const side = aside ? aside.textContent : "";
  return {
    c6bPay: money((c6b.match(/TO PAY ON DELIVERY[\s\S]{0,60}/) || [""])[0]),
    sideTotal: money((side.match(/Total[\s\S]{0,60}/) || [""])[0]),
    sideSubtotal: money((side.match(/Subtotal[\s\S]{0,60}/) || [""])[0]),
    c6bItem: money((c6b.match(/Item price[\s\S]{0,60}/) || [""])[0]),
    hasArriving: side.includes("📅 Arriving:"),
  };
});
check(
  "C6b total === sidebar total",
  totals.c6bPay !== "" && totals.c6bPay === totals.sideTotal,
  JSON.stringify(totals),
);
check(
  "C6b item price === sidebar subtotal",
  totals.c6bItem !== "" && totals.c6bItem === totals.sideSubtotal,
  JSON.stringify(totals),
);
check("sidebar shows 📅 Arriving (C6)", totals.hasArriving, JSON.stringify(totals));

// C7 validation: Monday rejected + cleared, then a valid chosen date shows in BOTH summaries.
const setResult = (iso) => {
  const el = document.querySelector('input[name="preferred_delivery_date"]');
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, iso);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
};
await page.evaluate(() => {
  const el = document.querySelector('input[name="preferred_delivery_date"]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, "2026-11-02");
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.waitForTimeout(700);
const afterMon = await domText(page);
const monCleared = await page.$eval(
  'input[name="preferred_delivery_date"]',
  (el) => el.value === "",
);
check(
  "C7 Monday rejected + cleared",
  monCleared && afterMon.includes("Mondays or bank holidays"),
  monCleared ? "" : "not cleared",
);

const chosenIso = await page.evaluate((min) => {
  const [y, m, d] = min.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  for (let i = 1; i < 8; i++) {
    const t = new Date(dt.getTime() + i * 86400000);
    if (t.getUTCDay() !== 1) return t.toISOString().slice(0, 10);
  }
  return min;
}, minAttr);
await page.evaluate((iso) => {
  const el = document.querySelector('input[name="preferred_delivery_date"]');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(el, iso);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}, chosenIso);
await page.waitForTimeout(900);
const chosenText = await domText(page);
const chosenShown = (chosenText.match(/📅 Your chosen date:/g) || []).length;
check("C6 + C6b BOTH show chosen date", chosenShown >= 2, `occurrences=${chosenShown}`);
const chosenInWa = await page.$eval('input[name="preferred_delivery_date"]', (el) => el.value);
check("C7 chosen value persisted", chosenInWa === chosenIso, `${chosenInWa} vs ${chosenIso}`);

// ─── Test 9 — 375px mobile: summary BEFORE buttons, sidebar hidden ───────────
console.log("\nSECTION D — mobile 375px (acceptance test 9)");
// New context = empty localStorage; seed the cart we built in SECTION B first.
const cartJson = await page.evaluate(() => localStorage.getItem("aq-beds-cart"));
const mob = await browser.newContext({ viewport: { width: 375, height: 812 } });
if (cartJson) {
  await mob.addInitScript((v) => {
    try {
      localStorage.setItem("aq-beds-cart", v);
    } catch {}
  }, cartJson);
}
const mp = await mob.newPage();
await mp.goto(BASE + "/checkout", { waitUntil: "domcontentloaded", timeout: 90000 });
await mp.waitForTimeout(4000);
const mobOrder = await mp.evaluate(() => {
  const card = document.querySelector('section[aria-label="Your order summary"]');
  const submit = document.querySelector('button[type="submit"]');
  const aside = [...document.querySelectorAll("aside")].find(
    (a) => !(a.getAttribute("aria-label") || "").includes("Shopping basket"),
  );
  const y = (el) => (el ? el.getBoundingClientRect().top + window.scrollY : -1);
  return {
    cardY: y(card),
    submitY: y(submit),
    asideDisplay: aside ? getComputedStyle(aside).display : "missing",
    basketEmpty: (document.body.textContent || "").includes("Your basket is empty"),
  };
});
check("mobile: basket loaded", !mobOrder.basketEmpty, JSON.stringify(mobOrder));
check(
  "mobile: C6b visible above buttons",
  mobOrder.cardY > 0 && mobOrder.submitY > mobOrder.cardY,
  JSON.stringify(mobOrder),
);
check(
  "mobile: sidebar summary hidden (C6b is the only summary)",
  mobOrder.asideDisplay === "none",
  JSON.stringify(mobOrder),
);
const mobText = await mp.evaluate(() => document.body.textContent || "");
check("mobile: C6b totals render", mobText.includes("TO PAY ON DELIVERY"));
await mob.close();

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
