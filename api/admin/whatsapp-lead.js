// WhatsApp order lead capture — admin sales data for /admin/analytics.
//
// IMPORTANT: completely separate from the Meta Pixel + CAPI pipeline. The
// browser fire-and-forgets this beacon at the same moment the deduped Meta
// Purchase fires (same event_id, used here only for dedupe). Always 204, never
// throws — a failure here can never affect the Meta events or the wa.me open.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCES = new Set(["pdp", "checkout", "drawer", "cart"]);
const EVENT_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

const MAX = {
  contents: 4000,
  name: 120,
  phone: 40,
  address: 200,
  city: 80,
  postcode: 20,
  pageUrl: 300,
};

function cap(value, max) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

// Best-effort per-instance throttle to blunt abuse (resets with the instance).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 60000;
  const list = (hits.get(ip) || []).filter((t) => t > windowStart);
  if (list.length >= 60) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end();
  }

  const ip =
    req.headers["x-forwarded-for"] || (req.socket && req.socket.remoteAddress) || "unknown";
  if (rateLimited(String(ip).split(",")[0].trim())) {
    res.statusCode = 204;
    return res.end();
  }

  let parsed;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    res.statusCode = 204;
    return res.end();
  }

  const eventId = parsed && typeof parsed.event_id === "string" ? parsed.event_id : "";
  const source = parsed && typeof parsed.source_button === "string" ? parsed.source_button : "";
  if (!EVENT_ID_RE.test(eventId) || !SOURCES.has(source)) {
    res.statusCode = 204;
    return res.end();
  }

  const value = typeof parsed.value === "number" && isFinite(parsed.value) ? parsed.value : null;
  // Optional aqbeds_vid of the buyer (Live / Day View visitor column).
  const visitorId = cap(parsed && parsed.visitor_id, 64) || null;

  let contents = null;
  try {
    if (Array.isArray(parsed.contents)) {
      const items = parsed.contents.slice(0, 50).map((it) => ({
        id: cap(it && it.id, 64),
        name: cap(it && it.name, 160),
        quantity: it && typeof it.quantity === "number" ? it.quantity : null,
        item_price:
          it && typeof it.item_price === "number" && isFinite(it.item_price) ? it.item_price : null,
      }));
      contents = JSON.stringify(items);
      if (contents.length > MAX.contents) contents = contents.slice(0, MAX.contents);
    }
  } catch {
    contents = null;
  }

  const customer =
    parsed && typeof parsed.customer === "object" && parsed.customer ? parsed.customer : {};

  // T4/C7 — the ONLY new payload field, strictly optional and format-validated.
  const preferredDeliveryDate =
    parsed &&
    typeof parsed.preferred_delivery_date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(parsed.preferred_delivery_date)
      ? parsed.preferred_delivery_date
      : null;

  const baseData = {
    eventId,
    source,
    value,
    currency: "GBP",
    contents,
    customerName: cap(customer.name, MAX.name) || null,
    customerPhone: cap(customer.phone, MAX.phone) || null,
    customerAddress: cap(customer.address, MAX.address) || null,
    customerCity: cap(customer.city, MAX.city) || null,
    customerPostcode: cap(customer.postcode, MAX.postcode) || null,
    pageUrl: cap(parsed.page_url, MAX.pageUrl) || null,
    visitorId,
  };

  try {
    await prisma.whatsAppLead.create({
      data: { ...baseData, ...(preferredDeliveryDate ? { preferredDeliveryDate } : {}) },
    });
  } catch (err) {
    // P2002 = duplicate event_id — same open already recorded (dedupe by design).
    // P2022 = preferredDeliveryDate column not migrated yet — keep the lead and
    // drop only the optional field so lead capture can never break (additive-only).
    if (err && err.code === "P2022") {
      try {
        await prisma.whatsAppLead.create({ data: baseData });
      } catch (retryErr) {
        if (!retryErr || retryErr.code !== "P2002") {
          console.error(
            "[whatsapp-lead] write failed:",
            (retryErr && retryErr.message) || retryErr,
          );
        }
      }
    } else if (!err || err.code !== "P2002") {
      console.error("[whatsapp-lead] write failed:", (err && err.message) || err);
    }
  }

  // Always 204, no body — the beacon never needs a reply.
  res.statusCode = 204;
  return res.end();
}
