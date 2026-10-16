import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
]);

const MAX_STR = 300;

function cap(value, max) {
  if (typeof value !== "string") return "";
  return value.slice(0, max);
}

function jsonResponse(res, status, data) {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

// Best-effort per-instance throttle to blunt abuse (resets with the instance).
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 60000;
  const list = (hits.get(ip) || []).filter((t) => t > windowStart);
  if (list.length >= 120) {
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
    return jsonResponse(res, 405, { error: "Method not allowed" });
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

  const event = parsed && parsed.event;
  if (!event || !ALLOWED_EVENTS.has(event)) {
    res.statusCode = 204;
    return res.end();
  }

  const visitorId = cap(parsed.visitorId, 64) || "unknown";
  const sessionId = cap(parsed.sessionId, 64) || "unknown";
  const value = typeof parsed.value === "number" && isFinite(parsed.value) ? parsed.value : null;

  try {
    await prisma.analyticsEvent.create({
      data: {
        visitorId,
        sessionId,
        event,
        path: cap(parsed.path, MAX_STR) || null,
        referrer: cap(parsed.referrer, MAX_STR) || null,
        productId: cap(parsed.productId, 64) || null,
        productName: cap(parsed.productName, 160) || null,
        value,
        currency: cap(parsed.currency, 8) || "GBP",
        device: cap(parsed.device, 16) || null,
      },
    });
  } catch (err) {
    console.error("[analytics] write failed:", (err && err.message) || err);
  }

  // Always 204, no body — the beacon never needs a reply.
  res.statusCode = 204;
  return res.end();
}
