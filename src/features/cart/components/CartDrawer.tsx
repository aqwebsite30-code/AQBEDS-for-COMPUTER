import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { X, Trash2, Minus, Plus } from "lucide-react";
import { useCart, useUI } from "@/features/cart/store/cart";
import { formatGBP } from "@/lib/utils/format";
import { getDeliveryInfo } from "@/lib/delivery-date";
import { useDeliveryInfo } from "@/hooks/useDeliveryInfo";
import { REVIEW_AVG_LABEL, REVIEW_COUNT } from "@/lib/reviews";
import {
  openWhatsAppOrder,
  rowsFromOptionsRecord,
  type CustomerDetails,
} from "@/lib/whatsapp-order";
import { OrderDetailsForm } from "@/components/OrderDetailsForm";

// T3 — "What happens next" mini-map (B7).
const NEXT_STEPS = [
  { n: "①", title: "You order", detail: "60 seconds, no payment" },
  { n: "②", title: "We confirm", detail: "WhatsApp/text within 24h" },
  { n: "③", title: "We dispatch", detail: "tracking sent" },
  { n: "④", title: "Courier arrives", detail: "2-hour window" },
  { n: "⑤", title: "You inspect", detail: "courier waits" },
  { n: "⑥", title: "You pay cash", detail: "only if you love it" },
];

export function CartDrawer() {
  const open = useUI((s) => s.cartOpen);
  const setOpen = useUI((s) => s.setCartOpen);
  const { items, updateQty, remove, subtotal, total } = useCart();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { info, live } = useDeliveryInfo();

  const handleDetailsSubmit = (details: CustomerDetails) => {
    openWhatsAppOrder({
      items: items.map((i) => ({
        id: i.productId,
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        rows: rowsFromOptionsRecord(i.options),
        url:
          typeof window !== "undefined"
            ? `${window.location.origin}/product/${i.productId}`
            : undefined,
      })),
      customer: details,
      arrival: getDeliveryInfo(new Date()),
      source: "drawer",
    });
    setDetailsOpen(false);
    setOpen(false);
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div
        onClick={() => setOpen(false)}
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping basket"
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-background flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display font-bold text-xl">Your Basket</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="min-h-[44px] min-w-[44px] grid place-items-center"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* B1 — delivery bar: top, most prominent, dark brand bg, ticking countdown */}
        <div className="bg-brand text-white px-6 py-4">
          <p className="font-display font-bold text-sm sm:text-base leading-snug">
            {live ? info.headlineLive : info.headlineStatic}
          </p>
          <p className="mt-1 text-xs text-white/85">
            🚚 FREE UK delivery · 📱 2-hour delivery window by text
          </p>
        </div>

        {/* B2 — trust icons row (below bar) */}
        <div className="px-6 py-3 border-b border-border text-[11px] font-bold text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>🔒 Pay NOTHING online</span>
          <span aria-hidden="true">·</span>
          <span>💵 Cash on Delivery</span>
          <span aria-hidden="true">·</span>
          <span>👀 Inspect at Door</span>
          <span aria-hidden="true">·</span>
          <span>↩️ Free Returns</span>
          <span aria-hidden="true">·</span>
          <span>🛏️ Est. 2018</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Your basket is empty.</p>
              <Link
                to="/shop"
                onClick={() => setOpen(false)}
                className="inline-block mt-4 px-5 h-11 leading-[2.75rem] rounded-2xl bg-cta text-cta-foreground font-semibold text-sm"
              >
                Shop Beds
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {items.map((i) => (
                  <li
                    key={i.lineId}
                    className="flex gap-4 p-3 rounded-2xl border border-border bg-card"
                  >
                    <img src={i.image} alt={i.name} className="h-20 w-20 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm leading-tight">{i.name}</h3>
                        <button
                          onClick={() => remove(i.lineId)}
                          aria-label="Remove item"
                          className="min-h-[44px] min-w-[44px] grid place-items-center"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {Object.entries(i.options)
                          .map(([k, v]) => `${v}`)
                          .join(" · ")}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-xl border border-border">
                          <button
                            className="p-2.5"
                            onClick={() => updateQty(i.lineId, i.qty - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-2 text-sm tabular-nums">{i.qty}</span>
                          <button
                            className="p-2.5"
                            onClick={() => updateQty(i.lineId, i.qty + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="font-display font-bold">
                          {formatGBP(i.unitPrice * i.qty)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* B3 — stock truth line under the product line (no fabricated stock numbers) */}
              <p className="mt-3 text-xs font-semibold text-whatsapp">
                ✅ In stock — dispatching today if ordered before 8 PM
              </p>

              {/* B4 — fills the empty space that used to be a blank white box */}
              <div className="mt-4 rounded-2xl border border-border bg-card p-4 space-y-2">
                <p className="text-sm font-bold text-brand">
                  💷 Pay NOTHING online — cash at your door, inspect first
                </p>
                <p className="text-sm font-semibold">
                  ⭐⭐⭐⭐⭐ {REVIEW_AVG_LABEL}/5 from {REVIEW_COUNT} verified reviews
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  “Just got my bed today and it's gorgeous. From start to finish, this was the
                  easiest process!” — Louise, verified buyer
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  💬 Questions? Chat with us (bottom-right)
                </p>
              </div>

              {/* B7 — "What happens next" mini-map: vertical on mobile, horizontal-ish on desktop */}
              <ol className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {NEXT_STEPS.map((s) => (
                  <li
                    key={s.n}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-[11px] leading-tight"
                  >
                    <span className="font-black text-brand">{s.n}</span>{" "}
                    <span className="font-bold">{s.title}</span>
                    <div className="text-muted-foreground">{s.detail}</div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border px-6 py-5 space-y-3 bg-card">
            {/* B5 — price honesty box above totals (display only, alters no price) */}
            <div className="rounded-2xl border border-cta/30 bg-cta/5 p-4 space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-brand">
                YOUR TOTAL
              </div>
              {items.map((i) => (
                <div key={i.lineId} className="flex justify-between gap-3 text-sm">
                  <span className="truncate text-muted-foreground">
                    {i.name} {i.qty > 1 ? `× ${i.qty}` : ""}
                  </span>
                  <span className="font-semibold shrink-0">{formatGBP(i.unitPrice * i.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">UK delivery</span>
                <span className="font-semibold text-green-500">FREE</span>
              </div>
              <div className="flex justify-between text-sm pt-1.5 border-t border-border/60">
                <span className="font-black text-brand">TO PAY (on delivery)</span>
                <span className="font-display font-black">{formatGBP(total())}</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                💷 Pay the courier — only after you've checked your bed
              </p>
            </div>

            <div className="text-sm flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatGBP(subtotal())}</span>
            </div>
            <div className="text-sm flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-display font-bold text-lg">Total</span>
              <span className="font-display font-bold text-2xl text-brand">
                {formatGBP(total())}
              </span>
            </div>

            {/* B6 — dual action buttons, side by side, equal width */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="min-h-12 rounded-2xl bg-cta text-cta-foreground font-black text-[11px] leading-tight px-2 py-2 grid place-items-center text-center hover:opacity-90 transition"
              >
                👀 INSPECT-FIRST ORDER — Pay {formatGBP(total())} on delivery
              </Link>
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="min-h-12 rounded-2xl bg-whatsapp text-whatsapp-foreground font-black text-[11px] leading-tight px-2 py-2 grid place-items-center text-center hover:opacity-90 transition"
              >
                💬 ORDER VIA WHATSAPP — skip the form
              </button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              No card needed · No deposit · Courier waits while you check
            </p>
            <OrderDetailsForm
              open={detailsOpen}
              onClose={() => setDetailsOpen(false)}
              onSubmit={handleDetailsSubmit}
            />
          </footer>
        )}
      </aside>
    </div>
  );
}
