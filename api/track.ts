// Self-contained on purpose: this file runs as a Vercel function, and relative
// imports into src/ are not bundled on the ESM path (the function crashed with
// ERR_MODULE_NOT_FOUND). The client derives the delivery estimate from the same
// engine the site uses, so no delivery policy is duplicated here.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function jsonResponse(res: any, status: number, data: unknown) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

// Best-effort per-instance throttle to blunt abuse (resets with the instance).
const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
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

/** "LS1 4AB" -> "L***" — enough to confirm the order, not to identify anyone. */
function partialPostcode(address: string): string {
  const match = address.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})/i);
  if (!match) return "";
  return `${match[1].charAt(0).toUpperCase()}***`;
}

function itemCount(items: unknown): number {
  if (typeof items !== "string") return 0;
  try {
    const parsed = JSON.parse(items);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum: number, item: any) => sum + (Number(item?.qty) || 0), 0);
  } catch {
    return 0;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "GET") {
    jsonResponse(res, 405, { success: false, error: "Method not allowed" });
    return;
  }

  const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";
  if (rateLimited(String(ip))) {
    jsonResponse(res, 429, { success: false, error: "Too many requests" });
    return;
  }

  const token =
    typeof req.query?.token === "string"
      ? req.query.token.trim()
      : typeof req.query?.reference === "string"
        ? req.query.reference.trim()
        : "";
  if (!token) {
    jsonResponse(res, 400, { success: false, error: "Token parameter required" });
    return;
  }

  try {
    const order = await prisma.order.findFirst({
      // Checkout links new orders with the short reference (AQ-7K2M9P); older
      // confirmation links carry the order id or the stored tracking token.
      // Accept all three so past emails and bookmarks keep working.
      where: {
        OR: [
          { reference: token.toUpperCase() },
          { trackingToken: token },
          { id: token },
        ],
      },
      select: {
        reference: true,
        status: true,
        createdAt: true,
        customerName: true,
        customerAddress: true,
        items: true,
        preferredDeliveryDate: true,
      },
    });

    if (!order) {
      jsonResponse(res, 404, { success: false, error: "Order not found" });
      return;
    }

    jsonResponse(res, 200, {
      success: true,
      reference: order.reference,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      firstName: (order.customerName || "").trim().split(/\s+/)[0] || "",
      postcode: partialPostcode(order.customerAddress || ""),
      itemsCount: itemCount(order.items),
      preferredDeliveryDate: order.preferredDeliveryDate,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    jsonResponse(res, 500, { success: false, error: "Internal server error" });
  }
}
