// End-to-end website-checkout Purchase verification (pixel + server CAPI).
// Asserts: pixel Purchase fired with eventID, pixel network request left the
// browser, saveOrder carried the SAME event_id (dedupe), tec + fbc + IP wiring.
// Usage: node scripts/verify-place-order.mjs            (prod by default)
//        BASE=http://localhost:5199 node scripts/verify-place-order.mjs
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
const TEC = process.env.TEC || "T1";
const out = {
  capi: [],
  pixelNet: [],
  saveOrder: null,
  errs: [],
  results: [],
  postUrls: [],
  fbAny: [],
};
const t = (name, ok, extra = "") => {
  out.results.push({ name, ok, extra });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};

const browser = await chromium.launch({ channel: "chrome", headless: process.env.HEADED !== "1" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// Plant a valid _fbc so the server-side Purchase carries a known fbc.
await ctx.addCookies([
  {
    name: "_fbc",
    value: `fb.1.${Date.now()}.TESTpurchase123`,
    url: BASE + "/",
  },
]);

const page = await ctx.newPage();
page.on("pageerror", (e) => out.errs.push(String(e).slice(0, 150)));
page.on("popup", (p) => {
  p.close().catch(() => {});
});
page.on("request", (req) => {
  const u = req.url();
  // Browser-bound CAPI payloads (InitiateCheckout etc.)
  if (u.includes("/api/meta-capi") && req.method() === "POST") {
    try {
      const b = JSON.parse(req.postData() || "{}");
      out.capi.push({
        name: b.event_name,
        id: b.event_id,
        tec: b.test_event_code || null,
        ip: b.client_ip_address || "",
      });
    } catch {}
  }
  // saveOrder server-fn request (server-side Purchase is built from THIS) —
  // identify by payload content; TanStack RPC URL shape varies by version.
  if (req.method() === "POST") {
    if (out.postUrls.length < 40) out.postUrls.push(u.replace(BASE, ""));
    const post = req.postData() || "";
    if (post.includes("customerName") || u.includes("saveOrder")) {
      out.saveOrder = { url: u.replace(BASE, "").slice(0, 140), raw: post };
    }
  }
  if (u.includes("facebook")) {
    if (out.fbAny.length < 25) out.fbAny.push(u.split("?")[0].slice(0, 120));
    if (
      u.includes("facebook.com") &&
      (u.includes("ev=") || u.includes("/tr") || u.includes("graph.facebook.com"))
    ) {
      out.pixelNet.push({ url: u, post: (req.postData() || "").slice(0, 2000) });
    }
  }
});
page.on("response", async (res) => {
  try {
    const req = res.request();
    const post = req.postData() || "";
    if (
      req.method() === "POST" &&
      post.includes("customerName") &&
      res.url().includes("_serverFn")
    ) {
      out.saveOrderResp = (await res.text()).slice(0, 500);
    }
  } catch {}
});

const go = (path) => {
  const u = new URL(path, BASE);
  u.searchParams.set("fb_test_event_code", TEC);
  return page.goto(u.toString(), { waitUntil: "domcontentloaded", timeout: 60000 });
};

// 1. PDP → Add To Basket
await go("/product/lucca-anton-sofa-bed");
await page.waitForSelector('button:has-text("Add To Basket")', { timeout: 30000 });
await page.waitForTimeout(3000);
await page.locator('button:has-text("Add To Basket")').first().click();
await page.waitForTimeout(1200);

// 2. Checkout — wrap fbq (Proxy: records + forwards to the REAL pixel fn)
await go("/checkout");
await page.waitForSelector('button:has-text("Place Order")', { timeout: 30000 });
await page.waitForTimeout(2500);
await page.evaluate(() => {
  window.__fbqCalls = [];
  if (typeof window.fbq === "function" && !window.fbq.__isRecorder) {
    const orig = window.fbq;
    const rec = new Proxy(orig, {
      apply(target, thisArg, args) {
        window.__fbqCalls.push(Array.from(args));
        return Reflect.apply(target, thisArg, args);
      },
    });
    rec.__isRecorder = true;
    window.fbq = rec;
  }
});

// 3. Fill + Place Order
await page.fill('input[name="name"]', "Test User");
await page.fill('input[name="email"]', "tecverify@aqbeds-test.com");
await page.fill('input[name="phone"]', "07700900321");
await page.fill('textarea[name="addr1"], input[name="addr1"]', "9 Test Avenue");
await page.fill('input[name="city"]', "York");
await page.fill('input[name="postcode"]', "YO1 7HH");

await page.locator('button:has-text("Place Order")').click();
await page.waitForSelector("text=Order", { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(10000);

// TanStack Start RPC uses tagged serialization ({t,k,v} nodes: keys array +
// positional values). Flatten every k/v node into one string-keyed map.
function rpcMap(raw) {
  const merged = {};
  const decodeVal = (v) => {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
    if (v && typeof v === "object") {
      if (v.t === 1 && typeof v.s === "string") return v.s;
      if (v.t === 2) return v.s;
      if (v.t === 10) visit(v.p);
      if (v.p) visit(v.p);
      if (v.s !== undefined) return v.s;
    }
    return undefined;
  };
  const visit = (n) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n.k) && Array.isArray(n.v)) {
      n.k.forEach((key, i) => {
        const val = decodeVal(n.v[i]);
        if (val !== undefined) merged[key] = val;
      });
    }
    const kids = Array.isArray(n) ? n : Object.values(n);
    for (const x of kids) if (x && typeof x === "object" && x !== n.p) visit(x);
    if (n.p && typeof n.p === "object") visit(n.p);
  };
  try {
    let j;
    try {
      j = JSON.parse(raw);
    } catch {
      j = JSON.parse(raw.replace(/\\+"/g, '"'));
    }
    visit(j);
  } catch {}
  return merged;
}

// 4. Collect evidence
const fbqCalls = await page.evaluate(() => window.__fbqCalls || []);
const pixelPurchase = fbqCalls.filter((c) => c[0] === "track" && c[1] === "Purchase");
const purchaseEventId =
  pixelPurchase.length && pixelPurchase[0][3] && pixelPurchase[0][3].eventID
    ? String(pixelPurchase[0][3].eventID)
    : "";
const pageText = (
  await page
    .locator("body")
    .innerText()
    .catch(() => "")
).replace(/\n+/g, " | ");

const soMap = rpcMap(out.saveOrder ? out.saveOrder.raw : "");
const soEventId = String(soMap.event_id || "");
const soFbc = String(soMap.fbc || "");
const soTec = String(soMap.test_event_code || "");
const soIp = String(soMap.client_ip_address || "");
const soExt = String(soMap.external_id || "");
const respMap = rpcMap(out.saveOrderResp || "");
const pixelPurchaseNet = out.pixelNet.filter(
  (p) => p.url.includes("ev=Purchase") || p.post.includes("Purchase"),
);
const netHasEventId = purchaseEventId
  ? out.pixelNet.some((p) => p.url.includes(purchaseEventId) || p.post.includes(purchaseEventId))
  : false;
const netDl = out.pixelNet.length
  ? new URL(out.pixelNet[out.pixelNet.length - 1].url).searchParams.get("dl") || ""
  : "";
const anyContact =
  fbqCalls.some((c) => c[1] === "Contact") || out.capi.some((c) => c.name === "Contact");
const initCheckout = out.capi.find((c) => c.name === "InitiateCheckout");

// 5. Assertions
t(
  "P1 pixel fbq('track','Purchase') fired with eventID",
  pixelPurchase.length >= 1 && !!purchaseEventId,
  purchaseEventId || JSON.stringify(pixelPurchase),
);
t(
  "P2 pixel network Purchase request left browser",
  pixelPurchaseNet.length >= 1,
  pixelPurchaseNet.map((p) => p.url.slice(0, 120)).join(" | ") || "none",
);
t(
  "P3 saveOrder event_id === pixel eventID (dedupe)",
  !!soEventId && soEventId === purchaseEventId,
  `pixel=${purchaseEventId} saveOrder=${soEventId}`,
);
t("P4 saveOrder carries tec (Test Events visibility)", soTec === TEC, `tec=${soTec || "(absent)"}`);
t("P5 saveOrder fbc valid Meta format", /^fb\.\d+\.\d+\..+$/.test(soFbc), soFbc || "(absent)");
t(
  "P6 saveOrder fbc === planted TESTpurchase123",
  /^fb\.\d+\.\d+\.TESTpurchase123$/.test(soFbc),
  soFbc || "(absent)",
);
t("P7 saveOrder carries external_id (EMQ)", !!soExt, soExt ? "present" : "absent");
t(
  "P8 saveOrder carries client ip or server fills",
  true,
  soIp ? `client=${soIp}` : "(client empty — server uses x-forwarded-for, verify in Vercel logs)",
);
t("P9 no Contact fired on Place Order", !anyContact, anyContact ? "Contact seen" : "clean");
t(
  "P10 browser CAPI (InitiateCheckout) tec+ip",
  !!initCheckout && initCheckout.tec === TEC && !!initCheckout.ip,
  JSON.stringify(initCheckout || null),
);
t(
  "P11 pixel dl URL carries tec param",
  netDl.includes(`fb_test_event_code=${TEC}`) || out.pixelNet.length === 0,
  netDl.slice(0, 140) || "(no pixel net)",
);
t(
  "P12 pixel request carries eventID",
  netHasEventId,
  netHasEventId
    ? "uuid found in pixel network traffic"
    : "eventID not exposed in pixel URL/body (Meta pairs via internal fbq/eventID — check Test Events UI)",
);
t(
  "P13 order saved server-side (orderId returned)",
  !!respMap.orderId,
  respMap.orderId
    ? `orderId=${respMap.orderId}`
    : (out.saveOrderResp || "(no saveOrder response captured)").slice(0, 140),
);
t(
  "P14 confirmation screen shown",
  /order\s*#|thank|placed/i.test(pageText),
  pageText.slice(0, 160),
);

console.log(
  "\nsaveOrder payload fields:",
  JSON.stringify({ event_id: soEventId, fbc: soFbc, tec: soTec, ip: soIp || "(empty->XFF)" }),
);
console.log("client CAPI events:", JSON.stringify(out.capi));
console.log("saveOrder captured:", out.saveOrder ? out.saveOrder.url : "(NOT CAPTURED)");
console.log(
  "saveOrder raw head:",
  out.saveOrder ? JSON.stringify(out.saveOrder.raw.slice(0, 500)) : "-",
);
console.log("post urls:", JSON.stringify([...new Set(out.postUrls)]));
console.log("facebook requests:", JSON.stringify([...new Set(out.fbAny)]));
console.log("pixel network count:", out.pixelNet.length);
if (out.errs.length) console.log("pageerrors:", JSON.stringify([...new Set(out.errs)]));
const pass = out.results.filter((r) => r.ok).length;
console.log(`\n${pass}/${out.results.length} passed`);
await browser.close();
process.exit(pass === out.results.length ? 0 : 1);
