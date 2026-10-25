export const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export const WHATSAPP_NUMBER = "+447519791128";

// T7 — every pre-filled WhatsApp message ends with this delivery promo line.
export const WA_DELIVERY_LINE = "🚚 Free UK next-day delivery (order before 8 PM UK, Mon–Sat)";

/** Appends the T7 delivery promo line once — idempotent (safe on every path). */
export function withDeliveryPromo(message: string): string {
  if (message.includes(WA_DELIVERY_LINE)) return message;
  return `${message}\n\n${WA_DELIVERY_LINE}`;
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(withDeliveryPromo(message))}`;
}
