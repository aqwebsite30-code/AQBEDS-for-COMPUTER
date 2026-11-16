import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, MessageSquare, Truck } from "lucide-react";
import { toast } from "sonner";
import { trackGenerateLead } from "@/lib/gtm";

/**
 * The order-confirmed screen. It is the last thing a customer sees, so it must
 * fit: the whole card is capped at the viewport height and scrolls internally,
 * every action is a 48px target, and the fallback block only appears if the
 * WhatsApp tab was actually blocked.
 */
export function OrderConfirmedModal({
  reference,
  token,
  whatsappUrl,
}: {
  reference: string;
  token: string;
  whatsappUrl: string;
}) {
  const [waBlocked, setWaBlocked] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Land at the top of the card, not wherever the page behind was scrolled to.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-brand/40 backdrop-blur-md"
      />
      <div className="relative flex min-h-full items-center justify-center p-3 sm:p-4">
        <motion.div
          ref={panelRef}
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { type: "spring", damping: 20, stiffness: 300 },
          }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          data-testid="order-confirmed"
          className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto overflow-x-hidden overscroll-contain rounded-3xl border border-white/20 bg-gradient-to-br from-brand to-brand-accent p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] sm:rounded-[32px] sm:p-8"
        >
          <div className="pointer-events-none absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <CheckCircle2 className="h-40 w-40 text-white" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
                Order confirmed
              </h2>
              <p className="text-sm font-medium text-white/80 sm:text-base">
                You pay nothing today — cash to the courier on delivery.
              </p>
            </div>

            {reference && (
              <div className="w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                  Your order number
                </p>
                <p
                  className="mt-1 font-display text-2xl font-bold tracking-[0.12em] text-white"
                  data-testid="order-reference"
                >
                  {reference}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  Quote it on WhatsApp or when you track your order. A copy goes to your email.
                </p>
              </div>
            )}

            <div className="w-full space-y-2.5">
              <Link
                to="/"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-bold text-brand shadow-xl transition-all hover:bg-secondary active:scale-[0.98]"
              >
                <ArrowLeft className="h-5 w-5" />
                Return home
              </Link>
              {token && (
                <Link
                  to="/track"
                  search={{ token }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/40 font-bold text-white transition-all hover:bg-white/10"
                >
                  <Truck className="h-5 w-5" />
                  Track your order
                </Link>
              )}
              {/* Pre-built from the order that was just saved — rebuilding it
                  from the page's first <form> picked up the header search box. */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  trackGenerateLead("whatsapp_confirmation");
                  // Try a new tab first; if the browser blocks it, keep the
                  // customer here and reveal the fallback link.
                  const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                  if (popup) event.preventDefault();
                  else setWaBlocked(true);
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-whatsapp font-bold text-white shadow-xl transition-all hover:bg-whatsapp/90 active:scale-[0.98]"
              >
                <MessageSquare className="h-5 w-5" />
                Open WhatsApp
              </a>

              {waBlocked && (
                <div className="w-full rounded-2xl border border-white/20 bg-white/5 p-3 text-left">
                  <p className="text-xs font-semibold text-white/85">
                    WhatsApp did not open. Use this link:
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-xs font-bold text-white underline underline-offset-2"
                  >
                    Open your order message on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        void navigator.clipboard.writeText(whatsappUrl).then(
                          () => toast.success("Order message link copied"),
                          () => setWaBlocked(true),
                        );
                      } else {
                        setWaBlocked(true);
                      }
                    }}
                    className="mt-2 text-xs font-semibold text-white/85 underline underline-offset-2"
                  >
                    Copy order message link
                  </button>
                  <p className="mt-2 text-xs text-white/70">
                    Long-press the link above, or copy it and open it in WhatsApp. Your order is
                    already saved.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Clipped so the decorative glows cannot create a scrollbar. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl sm:rounded-[32px]">
            <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-cta/20 blur-3xl" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
