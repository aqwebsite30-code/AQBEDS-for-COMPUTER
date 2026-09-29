// AQ Beds audit verification suite (Phase 1 + Phase 2 + copy regression)
// Run: node scripts/verify-audit.mjs   (dev server must be up on PORT, default 5199)
// Playwright is resolved from the local install or the omniroute global install.
import fs from "node:fs";
import path from "node:path";
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } =
    await import("file:///C:/Users/abdulraheem%20bulbul/AppData/Roaming/npm/node_modules/omniroute/node_modules/playwright/index.mjs"));
}

const BASE = process.env.AQ_BASE || "http://localhost:5199";
const results = [];
const check = (page, name, ok, extra = "") => {
  results.push({ page, name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"} [${page}] ${name}${extra ? " :: " + extra : ""}`);
};

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

async function gotoSafe(pg, url) {
  try {
    await pg.goto(url, { waitUntil: "networkidle", timeout: 20000 });
  } catch {
    try {
      await pg.goto(url, { waitUntil: "load", timeout: 30000 });
    } catch {}
  }
}

async function go(path) {
  await gotoSafe(page, BASE + path);
  await page.waitForTimeout(1200);
}

// ── HOME ──
await go("/");
const homeTitle = await page.title();
check("/", "title has no 50% OFF", !/50%/.test(homeTitle), homeTitle);
const homeBody = await page.locator("body").innerText();
// §4.2 intends ONE site-level aggregate on the homepage testimonials block, derived from
// the shared testimonial data (WP-G: no invented "128 reviews"); per-product badges stay gone
const aggMatches = homeBody.match(/[\d.]+\/5 from \d+ reviews/g) || [];
check(
  "/",
  "§4.2 aggregate in testimonials block",
  aggMatches.length >= 1,
  JSON.stringify(aggMatches),
);
check("/", "aggregate appears exactly once", aggMatches.length === 1, `count=${aggMatches.length}`);
check("/", "no invented '128 reviews'", !/128 reviews/.test(homeBody), "");
check("/", "no 'In stock (24)'", !homeBody.includes("In stock (24)"), "");
check("/", "no fabricated sales ticker", !/just\s+bought a/i.test(homeBody), "");
check(
  "/",
  "H1 present",
  (await page.locator("h1").count()) > 0,
  await page.locator("h1").first().innerText(),
);
check("/", "no 50% OFF in body", !homeBody.includes("50% OFF"), "");
const ANNOUNCE =
  "✦ Free UK Delivery on Every Bed · Next Day Free Replacement · Cash on Delivery Available · Inspect on Delivery ✦";
check("/", "announcement bar canonical", homeBody.includes(ANNOUNCE), "");
const STRIP = [
  "Free UK Delivery",
  "To your door",
  "Cash on Delivery",
  "Pay when it arrives",
  "At-Door Returns",
  "Check it when it arrives",
  "Next Day Free Replacement",
  "Free, the very next day",
];
check(
  "/",
  "hero trust strip: 4 canonical items in order",
  STRIP.every((t) => homeBody.includes(t)) &&
    homeBody.indexOf("To your door") < homeBody.indexOf("Pay when it arrives") &&
    homeBody.indexOf("Pay when it arrives") < homeBody.indexOf("Check it when it arrives") &&
    homeBody.indexOf("Check it when it arrives") < homeBody.indexOf("Free, the very next day"),
  "",
);
const tile = page.locator('img[alt="Panel Line bed"]').first();
const tileSrc = (await tile.count()) ? await tile.getAttribute("src") : null;
check(
  "/",
  "beds tile = Panel Wing Back image",
  (await tile.count()) >= 1 && String(tileSrc).includes("Panel wing back"),
  String(tileSrc),
);
check(
  "/",
  "sale section replacement copy",
  homeBody.includes("Cash on Delivery, and Next Day Free Replacement"),
  "",
);
const homeCanonical = await page
  .locator('link[rel="canonical"]')
  .getAttribute("href")
  .catch(() => null);
check("/", "canonical set", !!homeCanonical, String(homeCanonical));
const ld = await page.locator('script[type="application/ld+json"]').allInnerTexts();
check("/", "JSON-LD has no aqbeds.vercel.app", !ld.join("").includes("aqbeds.vercel.app"), "");

// ── CATEGORY ──
await go("/category/ottoman-beds");
const catBody = await page.locator("body").innerText();
check("/category/ottoman-beds", "pluralisation '1 bed'", !catBody.includes("1 products"), "");
const catH1 = await page.locator("h1").first().innerText();
check("/category/ottoman-beds", "H1 = category name", catH1.trim() === "Ottoman Beds", catH1);
const catDesc = await page
  .locator('meta[name="description"]')
  .getAttribute("content")
  .catch(() => "");
check(
  "/category/ottoman-beds",
  "long meta description",
  catDesc.length > 80,
  `${catDesc.length}ch`,
);

// empty category must be noindexed
await go("/category/mattresses");
const robots = await page
  .locator('meta[name="robots"]')
  .getAttribute("content")
  .catch(() => null);
check(
  "/category/mattresses",
  "noindex on empty category",
  /noindex/.test(robots || ""),
  String(robots),
);

// ── PDP ──
await go("/product/divan-ottoman-bed");
const pdpBody = await page.locator("body").innerText();
check(
  "/product/divan-ottoman-bed",
  "no fake rating badge",
  !/4\.7\s*[★⭐]|128 reviews/i.test(pdpBody),
  "",
);
check("/product/divan-ottoman-bed", "honest stock copy", pdpBody.includes("dispatches"), "");
check("/product/divan-ottoman-bed", "no '(Included) +£'", !/\(Included\)\s*\+£/i.test(pdpBody), "");
const pdpLd = await page.locator('script[type="application/ld+json"]').allInnerTexts();
check(
  "/product/divan-ottoman-bed",
  "Product JSON-LD domain",
  !pdpLd.join("").includes("aqbeds.vercel.app"),
  "",
);
const pdpCanonical = await page
  .locator('link[rel="canonical"]')
  .getAttribute("href")
  .catch(() => null);
check(
  "/product/divan-ottoman-bed",
  "PDP canonical",
  String(pdpCanonical).includes("/product/"),
  String(pdpCanonical),
);
const productLd = pdpLd
  .map((t) => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  })
  .find((j) => j && j["@type"] === "Product");
check(
  "/product/divan-ottoman-bed",
  "Product schema has NO fake aggregateRating",
  !(productLd && productLd.aggregateRating),
  JSON.stringify(productLd?.aggregateRating || null),
);

const pdpHtml = await page.content();
check(
  "/product/divan-ottoman-bed",
  "PDP trust line canonical",
  pdpHtml.includes(
    "🔒 Secure checkout · Pay on delivery available · Free UK delivery · Next Day Free Replacement",
  ),
  "",
);
check(
  "/product/divan-ottoman-bed",
  "PDP description canonical tail",
  pdpHtml.includes(
    "Free UK delivery · Pay on delivery available · Mattress included · Next Day Free Replacement.",
  ),
  "",
);
check(
  "/product/divan-ottoman-bed",
  "PDP meta = keep phrase",
  String(
    await page
      .locator('meta[name="description"]')
      .getAttribute("content")
      .catch(() => ""),
  ).includes("Free UK delivery. Cash on delivery available."),
  "",
);

// sticky mobile bar (mobile viewport)
const m = await ctx.newPage();
await m.setViewportSize({ width: 390, height: 844 });
await gotoSafe(m, BASE + "/product/divan-ottoman-bed");
await m.waitForTimeout(1500);
const sticky = await m.locator('button:has-text("Add To Basket")').count();
check("mobile-pdp", "sticky Add To Basket exists", sticky >= 1, `count=${sticky}`);

// ── SHOP CARDS ──
await go("/shop");
const shopBody = await page.locator("body").innerText();
check("/shop", "no per-card review badge", !/4\.7\s*[★⭐]|128 reviews/i.test(shopBody), "");
check("/shop", "no 'In stock (24)'", !shopBody.includes("In stock (24)"), "");

// ── NEW PAGES ──
for (const p of ["/privacy", "/terms", "/delivery", "/returns", "/faqs", "/shop"]) {
  const r = await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
  const body = await page.locator("body").innerText();
  check(
    p,
    "status 200 + rendered",
    r.status() === 200 && body.length > 200,
    `status=${r.status()} len=${body.length}`,
  );
}
await go("/returns");
const ret = await page.locator("body").innerText();
check("/returns", "At-Door Returns section", ret.includes("At-Door Returns"), "");
check(
  "/returns",
  "Next Day Free Replacement section (full copy)",
  ret.includes(
    "Next Day Free Replacement: if something is wrong with your order, contact us any time and we'll replace it free of charge with next-day delivery",
  ),
  "",
);
check("/returns", "no old 30-day / collection text", !/collection|30[- ]day/i.test(ret), "");
await go("/delivery");
const dlv = await page.locator("body").innerText();
check("/delivery", "no curbside contradiction", !/curbside/i.test(dlv), "");
await go("/faqs");
const faq = await page.locator("body").innerText();
check("/faqs", "no 14-day contradiction", !/within 14 days/i.test(faq), "");
check(
  "/faqs",
  "replacements Q visible with full copy",
  faq.includes("Do you offer replacements?") &&
    faq.includes(
      "Next Day Free Replacement: if something is wrong with your order, contact us any time and we'll replace it free of charge with next-day delivery",
    ),
  "",
);
check(
  "/faqs",
  "At-Door return policy wording",
  faq.includes("Returns are accepted at the door only"),
  "",
);
check("/faqs", "no warranty claims", !/warranty/i.test(faq), "");

// ── FOOTER LINKS ──
await go("/");
const privHref = await page
  .locator('footer a:has-text("Privacy Policy")')
  .getAttribute("href")
  .catch(() => null);
const termsHref = await page
  .locator('footer a:has-text("Terms of Service")')
  .getAttribute("href")
  .catch(() => null);
check("/", "footer -> /privacy", privHref === "/privacy", String(privHref));
check("/", "footer -> /terms", termsHref === "/terms", String(termsHref));
const deadSocial = await page.locator('footer a[href="#"]').count();
check("/", "no dead # social links", deadSocial === 0, `count=${deadSocial}`);
const FOOTER_TRIO = [
  "Next Day Free Replacement",
  "Free, the very next day",
  "At-Door Returns",
  "Inspect before the courier leaves",
  "Free UK Delivery",
  "On every bed",
];
// footer uses content-visibility:auto -> innerText is empty until scrolled; use textContent
const footText = await page.evaluate(() => document.querySelector("footer")?.textContent || "");
check(
  "/",
  "footer trio canonical (3 items)",
  FOOTER_TRIO.every((t) => footText.includes(t)) && !footText.includes("hassle-free"),
  `len=${footText.length}`,
);

// ── NAV ──
const navText = await page
  .locator("nav")
  .first()
  .innerText()
  .catch(() => "");
check("/", "nav has Sofas", /Sofas/i.test(navText), navText.replace(/\n/g, " | ").slice(0, 160));
check("/", "nav has no empty Storage Beds", !/Storage Beds/i.test(navText), "");

// ── H1 uniqueness ──
const h1count = await page.locator("h1").count();
check("/", "exactly one H1", h1count === 1, `count=${h1count}`);

// ==================== PHASE 2 CHECKS ====================
await go("/");
const p2Home = await page.locator("body").innerText();
check("/", "dynamic 'Shop All 7 Categories'", /Shop All 7 Categories/.test(p2Home), "");
const skipLink = await page.locator('a[href="#main-content"]').count();
check("/", "skip link present", skipLink >= 1, `count=${skipLink}`);
const srcsets = await page.locator("img[srcset]").count();
check("/", "srcset images on home", srcsets >= 3, `count=${srcsets}`);
const revHref = await page
  .locator('footer a:has-text("Customer Reviews")')
  .getAttribute("href")
  .catch(() => null);
check("/", "footer -> /reviews", revHref === "/reviews", String(revHref));

await go("/faqs");
const faqLd2 = await page.locator('script[type="application/ld+json"]').allInnerTexts();
let faqPageOk = false;
for (const raw of faqLd2) {
  try {
    const j = JSON.parse(raw);
    if (j && j["@type"] === "FAQPage") faqPageOk = true;
  } catch {}
}
check("/faqs", "FAQPage JSON-LD present", faqPageOk, "");
let faqSchema = null;
for (const raw of faqLd2) {
  try {
    const j = JSON.parse(raw);
    if (j && j["@type"] === "FAQPage") faqSchema = j;
  } catch {}
}
check(
  "/faqs",
  "FAQPage schema matches visible FAQ (names + answers)",
  !!faqSchema &&
    faqSchema.mainEntity.length > 0 &&
    faqSchema.mainEntity.every(
      (q) => faq.includes(q.name) && faq.includes(q.acceptedAnswer.text.slice(0, 80)),
    ) &&
    (await page.locator("h2").count()) >= faqSchema.mainEntity.length,
  faqSchema ? `q=${faqSchema.mainEntity.length}` : "no schema",
);
check(
  "/faqs",
  "replacements Q in schema",
  !!faqSchema && faqSchema.mainEntity.some((q) => q.name === "Do you offer replacements?"),
  "",
);

await go("/category/wardrobes");
const wBody = await page.locator("body").innerText();
check(
  "/category/wardrobes",
  "noun count '1 wardrobe'",
  /1 wardrobe/.test(wBody) && !/1 products/.test(wBody),
  "",
);

await go("/category/sofas");
const sBody = await page.locator("body").innerText();
check(
  "/category/sofas",
  "noun count '15 sofas'",
  /15 sofas/.test(sBody) && !/15 products/.test(sBody),
  "",
);

await go("/shop");
const shopTitle2 = await page.title();
check("/shop", "shop title", /Shop Beds, Sofas/.test(shopTitle2), shopTitle2);
const shopLinks = await page.locator('a[href^="/product/"]').count();
check("/shop", "shop shows 32 products", shopLinks === 32, `count=${shopLinks}`);
const shopBody2 = await page.locator("body").innerText();
check(
  "/shop",
  "sentence-case facet counts",
  /Sofas \(15\)/.test(shopBody2) && /Luxury beds \(12\)/.test(shopBody2),
  "",
);
check(
  "/shop",
  "Size facet split from Mattress",
  /Mattress/i.test(shopBody2) && /No mattress/.test(shopBody2),
  "",
);
check(
  "/shop",
  "size facet has no wardrobe door names",
  !/Door Plain Wardrobe|Sliding Wardrobe$/.test(shopBody2),
  "",
);
const sizeGuideLink = await page.locator('a[href="/size-guide"]').count();
check("/shop", "size guide link on shop", sizeGuideLink >= 1, `count=${sizeGuideLink}`);

for (const p of ["/size-guide", "/reviews", "/about"]) {
  const r = await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const h = await page
    .locator("h1")
    .first()
    .innerText()
    .catch(() => "");
  check(
    p,
    "200 + H1",
    r.status() === 200 && h.trim().length > 0,
    `status=${r.status()} h1=${h.slice(0, 60)}`,
  );
}
await go("/reviews");
const revBody = await page.locator("body").innerText();
check(
  "/reviews",
  "reviews page honest (no verified-purchase claim)",
  !/verified purchase/i.test(revBody),
  "",
);

await go("/");
const emptyAnchors = await page.locator('a[href="#"]').count();
check("/", "no dead # anchors anywhere", emptyAnchors === 0, `count=${emptyAnchors}`);

// ==================== BUYING GUIDE (7.3) ====================
await go("/guides/ottoman-vs-divan");
const gH1 = await page
  .locator("h1")
  .first()
  .innerText()
  .catch(() => "");
check("/guides/ottoman-vs-divan", "200 + H1", gH1.trim().length > 0, gH1.slice(0, 60));
const gLd = await page.locator('script[type="application/ld+json"]').allInnerTexts();
let gFaq = false;
for (const raw of gLd) {
  try {
    const j = JSON.parse(raw);
    if (j && j["@type"] === "FAQPage") gFaq = true;
  } catch {}
}
check("/guides/ottoman-vs-divan", "FAQPage schema", gFaq, "");
const gBody = await page.locator("body").innerText();
check(
  "/guides/ottoman-vs-divan",
  "comparison table rows",
  /Gas-lift|gas struts/i.test(gBody) && /Drawers/i.test(gBody),
  "",
);
const gCats = await page
  .locator('a[href="/category/ottoman-beds"], a[href="/category/divan-beds"]')
  .count();
check("/guides/ottoman-vs-divan", "links to both categories", gCats >= 2, `count=${gCats}`);

await go("/category/ottoman-beds");
const gLink = await page.locator('a[href="/guides/ottoman-vs-divan"]').count();
check("/category/ottoman-beds", "interlink to guide", gLink >= 1, `count=${gLink}`);
await go("/category/divan-beds");
const gLink2 = await page.locator('a[href="/guides/ottoman-vs-divan"]').count();
check("/category/divan-beds", "interlink to guide", gLink2 >= 1, `count=${gLink2}`);

// ==================== PHASE 2 EXTRA CHECKS ====================
// ---- §6.8.2 search quality ----
for (const q of ["velvet", "king size", "sofa"]) {
  await gotoSafe(page, `${BASE}/shop?q=${encodeURIComponent(q)}`);
  await page.waitForTimeout(900);
  const cards = await page.locator('a[href^="/product/"]').count();
  const body = await page.locator("body").innerText();
  const noResults = /No products found/i.test(body);
  check(
    "/shop",
    `search "${q}" returns results`,
    cards > 0,
    `cards=${cards} noResults=${noResults}`,
  );
}

// empty state
await gotoSafe(page, `${BASE}/shop?q=zzzznotarealproduct`);
await page.waitForTimeout(900);
const emptyBody = await page.locator("body").innerText();
check(
  "/shop",
  "empty state wording",
  /No products found/i.test(emptyBody) && /Show all products/i.test(emptyBody),
  "",
);

// ---- §6.8.4 budget slider floor must include the £185 bed ----
await gotoSafe(page, `${BASE}/shop`);
await page.waitForTimeout(800);
const shopBodyX = await page.locator("body").innerText();
check(
  "/shop",
  "budget floor <= £185",
  /£150/.test(shopBodyX),
  shopBodyX.match(/£\d+/g)?.slice(0, 6).join(","),
);

// ---- §6.6 alt text sweep ----
const PAGES = [
  "/",
  "/shop",
  "/category/ottoman-beds",
  "/product/divan-ottoman-bed",
  "/about",
  "/size-guide",
  "/guides/ottoman-vs-divan",
];
for (const p of PAGES) {
  await gotoSafe(page, BASE + p);
  await page.waitForTimeout(800);
  const noAlt = await page.locator("img:not([alt])").count();
  const imgs = await page.locator("img").count();
  const emptyAlt = await page.locator('img[alt=""]').count();
  check(
    p,
    "every img has alt attribute",
    noAlt === 0,
    `no-alt=${noAlt} total=${imgs} decorative-empty=${emptyAlt}`,
  );
}

// ---- keyboard: skip link reachable as first Tab ----
await gotoSafe(page, BASE + "/");
await page.waitForTimeout(600);
await page.keyboard.press("Tab");
const focused = await page.evaluate(() => {
  const el = document.activeElement;
  return {
    tag: el?.tagName,
    text: el?.textContent?.trim(),
    visible: !!el && el.getBoundingClientRect().width > 0,
  };
});
check(
  "/",
  "first Tab = visible skip link",
  focused.text === "Skip to main content" && focused.visible,
  JSON.stringify(focused),
);

// ==================== WP-2 BANNED PHRASE SWEEP ====================
// Patterns are assembled from parts so this file never matches itself.
const BANNED = [
  ["30", "-day returns"].join(""),
  ["1", "-year warranty"].join(""),
  ["hassle", "-free returns"].join(""),
  ["sleep on it, ", "risk-free"].join(""),
  ["frame covered, ", "in writing"].join(""),
];
const SCAN_SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".vercel",
  "coverage",
  ".turbo",
]);
const FLAG_FILES = new Set(["src/routes/terms.tsx"]);
const bannedHits = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SCAN_SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name));
    } else if (entry.isFile()) {
      if (!/\.(m?js|jsx?|tsx?|json|cjs|md|html?|txt|css|csv|xml|yml|yaml)$/i.test(entry.name))
        continue;
      let text;
      try {
        text = fs.readFileSync(path.join(dir, entry.name), "utf8");
      } catch {
        continue;
      }
      if (text.includes("\u0000")) continue;
      const lower = text.toLowerCase();
      const rel = path.relative(process.cwd(), path.join(dir, entry.name)).replaceAll("\\", "/");
      for (const b of BANNED) {
        if (lower.includes(b)) bannedHits.push(`${rel} :: ${b}`);
      }
    }
  }
}
walk(process.cwd());
const failHits = bannedHits.filter((h) => !FLAG_FILES.has(h.split(" ::")[0]));
const flagHits = bannedHits.filter((h) => FLAG_FILES.has(h.split(" ::")[0]));
check(
  "repo",
  "banned phrases: 0 hits outside /terms flag",
  failHits.length === 0,
  failHits.slice(0, 8).join(" | "),
);
for (const f of flagHits) console.log(`FLAG [${f}] legal text - review only, not deleted`);

console.log("\n--- console errors ---");
console.log(errors.length ? errors.slice(0, 12).join("\n") : "(none)");
const fails = results.filter((r) => !r.ok);
console.log(
  `\n=== ${results.length - fails.length}/${results.length} PASS, ${fails.length} FAIL ===`,
);
if (fails.length)
  console.log("FAILURES:\n" + fails.map((f) => ` - [${f.page}] ${f.name} ${f.extra}`).join("\n"));

await browser.close();
process.exit(fails.length ? 1 : 0);
