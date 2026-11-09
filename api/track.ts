import { PrismaClient } from "@prisma/client";
import {
  formatDeliveryDate,
  getDeliveryInfo,
  isDeliveryDay,
} from "../src/lib/delivery-date";

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

  const token = typeof req.query?.token === "string" ? req.query.token.trim() : "";
  if (!token) {
    jsonResponse(res, 400, { success: false, error: "Token parameter required" });
    return;
  }

  try {
    const order = await prisma.order.findFirst({
      // Checkout links new orders with the order id; older confirmation links use
      // the stored tracking token. Accept either so both keep working.
      where: { OR: [{ trackingToken: token }, { id: token }] },
      select: {
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

    const preferred =
      order.preferredDeliveryDate && isDeliveryDay(order.preferredDeliveryDate)
        ? order.preferredDeliveryDate
        : null;
    const estimatedISO = preferred ?? getDeliveryInfo(order.createdAt).defaultDate.iso;

    jsonResponse(res, 200, {
      success: true,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      firstName: (order.customerName || "").trim().split(/\s+/)[0] || "",
      postcode: partialPostcode(order.customerAddress || ""),
      itemsCount: itemCount(order.items),
      estimatedDeliveryDate: formatDeliveryDate(estimatedISO),
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    jsonResponse(res, 500, { success: false, error: "Internal server error" });
  }
}
