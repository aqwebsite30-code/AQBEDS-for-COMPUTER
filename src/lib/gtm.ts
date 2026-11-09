import { CONSENT_KEY } from "./consent";

/**
 * GA4 ecommerce events on the dataLayer.
 *
 * Consent gates tracking, never the shop: when the visitor has not accepted, the
 * helpers return false and push nothing, so no analytics payload exists before a
 * choice. The schema follows GA4's recommended ecommerce format, so a GA4 tag in
 * the GTM container can read these events without a custom variable for each field.
 */

export type DataLayerItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
};

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function push(event: string, params: Record<string, unknown>): boolean {
  if (!hasAnalyticsConsent()) return false;
  try {
    const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...params });
    return true;
  } catch {
    return false;
  }
}

const sumValue = (items: DataLayerItem[]) =>
  Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;

export function trackViewItem(item: DataLayerItem, currency = "GBP") {
  return push("view_item", { currency, value: sumValue([item]), items: [item] });
}

export function trackAddToCart(items: DataLayerItem[], currency = "GBP") {
  return push("add_to_cart", { currency, value: sumValue(items), items });
}

export function trackBeginCheckout(items: DataLayerItem[], currency = "GBP") {
  return push("begin_checkout", { currency, value: sumValue(items), items });
}

/** Fires once per order; transaction_id is the short reference, never the db id. */
export function trackPurchase(
  transactionId: string,
  items: DataLayerItem[],
  value: number,
  currency = "GBP",
) {
  return push("purchase", {
    transaction_id: transactionId,
    currency,
    value,
    shipping: 0,
    items,
  });
}

export function trackGenerateLead(method = "whatsapp") {
  return push("generate_lead", { method });
}

/** Field name only — never the value the visitor typed. */
export function trackCheckoutError(field: string) {
  return push("checkout_error", { field: field || "unknown" });
}
