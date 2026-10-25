import { useCart } from "@/features/cart/store/cart";
import { formatGBP } from "@/lib/utils/format";
import { useDeliveryInfo } from "@/hooks/useDeliveryInfo";
import { formatDeliveryDate } from "@/lib/delivery-date";

// C6b RULE: the sticky sidebar (C6) and the final "YOUR ORDER" card render from
// this ONE component, so their numbers can never disagree. Display only — reads
// cart state, never computes a price (hard rule #1: zero price changes).
export function OrderSummary({
  variant,
  preferredDate,
}: {
  variant: "sidebar" | "final";
  preferredDate?: string;
}) {
  const { items, total } = useCart();
  const { info } = useDeliveryInfo();
  const chosenLabel = preferredDate ? formatDeliveryDate(preferredDate) : "";
  const itemLineTotal = (qty: number, unitPrice: number) => qty * unitPrice;

  if (variant === "final") {
    // ── C6b — final order summary, bottom of form, directly above the buttons ──
    return (
      <section
        aria-label="Your order summary"
        className="rounded-3xl border-2 border-brand/25 bg-card p-6 space-y-4 shadow-xl"
      >
        <h2 className="font-display font-black text-lg uppercase tracking-widest text-brand">
          Your Order
        </h2>

        {items.map((i) => (
          <div key={i.lineId} className="flex gap-3 items-start">
            <img
              src={i.image}
              alt={i.name}
              className="h-14 w-14 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0 text-sm">
              <div className="font-bold leading-tight">{i.name}</div>
              <div className="text-xs text-muted-foreground">
                {Object.entries(i.options)
                  .map(([, v]) => v)
                  .join(" · ")}
              </div>
              <div className="text-xs font-semibold mt-0.5">Qty: {i.qty}</div>
            </div>
          </div>
        ))}

        <div className="space-y-1.5 text-sm border-t border-border pt-3">
          {items.length === 1 ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Item price</span>
              <span className="font-semibold">
                {formatGBP(itemLineTotal(items[0].qty, items[0].unitPrice))}
              </span>
            </div>
          ) : (
            items.map((i) => (
              <div key={i.lineId} className="flex justify-between gap-3">
                <span className="text-muted-foreground truncate">{i.name}</span>
                <span className="font-semibold shrink-0">
                  {formatGBP(itemLineTotal(i.qty, i.unitPrice))}
                </span>
              </div>
            ))
          )}
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Add-ons</span>
            <span className="font-semibold text-green-500">FREE</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">UK delivery</span>
            <span className="font-semibold text-green-500">FREE</span>
          </div>
          <div className="flex justify-between gap-3 pt-2 border-t border-border/60">
            <span className="font-black text-brand">TO PAY ON DELIVERY</span>
            <span className="font-display font-black text-lg">{formatGBP(total())}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-brand/20 bg-brand/[0.06] p-3 space-y-1 text-sm">
          <p className="font-bold text-brand">
            {chosenLabel
              ? `📅 Your chosen date: ${chosenLabel}`
              : `📅 Arriving: ${info.defaultDate.label}`}
          </p>
          <p className="text-xs text-muted-foreground">(Sunday orders: Tuesday or Thursday)</p>
          <p className="text-xs font-semibold">
            🔒 Nothing to pay online — pay the courier after you inspect
          </p>
        </div>

        <p className="text-sm font-semibold text-muted-foreground">
          ⭐⭐⭐⭐⭐ “Easiest process ever!” — Louise, verified buyer
        </p>
      </section>
    );
  }

  // ── C6 — sticky sidebar summary (existing rows + T1 arriving / chosen date) ──
  return (
    <>
      <ul className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
        {items.map((i) => (
          <li key={i.lineId} className="flex gap-3 items-center">
            <img
              src={i.image}
              alt={i.name}
              className="h-12 w-12 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 text-sm min-w-0">
              <div className="font-medium truncate">{i.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>x{i.qty}</span>
                <span className="h-1 w-1 bg-muted-foreground/30 rounded-full" />
                <span>{formatGBP(i.unitPrice)} ea</span>
              </div>
            </div>
            <span className="text-sm font-bold shrink-0">{formatGBP(i.unitPrice * i.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-4 mt-2 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatGBP(total())}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Shipping</span>
          <span className="text-green-500 font-medium">Free</span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-border/50">
          <span className="font-display font-bold text-lg">Total</span>
          <span className="font-display font-bold text-2xl text-blue-500">
            {formatGBP(total())}
          </span>
        </div>
      </div>
      <div className="rounded-2xl border border-brand/20 bg-brand/[0.06] p-3 text-center space-y-1">
        <p className="text-sm font-black text-brand">📅 Arriving: {info.defaultDate.label}</p>
        <p className="text-[11px] text-muted-foreground">{info.windowLine}</p>
        {chosenLabel && <p className="text-sm font-bold">📅 Your chosen date: {chosenLabel}</p>}
      </div>
    </>
  );
}
