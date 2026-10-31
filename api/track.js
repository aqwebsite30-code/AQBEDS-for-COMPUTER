import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALLOWED_EVENTS = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"]);

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

  // Simple rate limit
  const ip = req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "unknown";
  if (rateLimited(ip)) {
    jsonResponse(res, 429, { success: false, error: "Too many requests" });
    return;
  }

  try {
    const { token } = req.query;
    if (!token) {
      jsonResponse(res, 400, { success: false, error: "Token parameter required" });
      return;
    }

    // Fetch order with tracking token
    const order = await prisma.order.findFirst({
      where: { trackingToken: token },
      include: { salesperson: true },
    });

    if (!order) {
      jsonResponse(res, 404, { success: false, error: "Order not found" });
      return;
    }

    // Calculate estimated arrival date (simplified)
    const orderDate = new Date(order.createdAt);
    const estimatedArrival = new Date(orderDate);
    estimatedArrival.setDate(estimatedArrival.getDate() + 2); // Next day + buffer

    // Parse items if needed
    let items = [];
    if (order.items && typeof order.items === "string") {
      try {
        items = JSON.parse(order.items);
      } catch {
        items = [];
      }
    }

    // Format response
    const response = {
      success: true,
      order: {
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        items: items,
        total: order.total,
        status: order.status,
        preferredDeliveryDate: order.preferredDeliveryDate || null,
        estimatedArrival: estimatedArrival.toISOString().split("T")[0],
        createdAt: order.createdAt,
        salesperson: order.salesperson,
      },
    };

    jsonResponse(res, 200, response);
  } catch (error) {
    console.error("Error fetching order:", error);
    jsonResponse(res, 500, { success: false, error: "Internal server error" });
  }
}