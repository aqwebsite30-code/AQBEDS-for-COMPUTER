import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/features/cart/store/cart";
import { CONSENT_EVENT, CONSENT_KEY, loadGtm, loadMetaPixel, updateConsent } from "@/lib/consent";

const COOKIE_CONSENT_KEY = CONSENT_KEY;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  // The sticky mobile basket bar sits at the bottom on phones; lift the consent
  // card above it so neither the card's buttons nor the basket bar overlap.
  const cartCount = useCart((s) => s.count());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    // Grant consent first, then insert the tags it unlocks.
    updateConsent(true);
    loadGtm();
    loadMetaPixel();
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
    setVisible(false);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  const reject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    // Stays denied: no analytics or advertising storage, no pixel.
    updateConsent(false);
    setVisible(false);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={`fixed left-0 right-0 z-50 p-4 sm:bottom-0 sm:p-6 ${
            cartCount > 0 ? "bottom-[76px]" : "bottom-0"
          }`}
        >
          <div className="mx-auto max-w-3xl bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex-1 space-y-1">
              <p className="text-sm text-foreground leading-relaxed">
                Essential cookies keep your basket and checkout working. With your consent we also
                use analytics and advertising cookies to measure our ads. Accept or reject either
                way — the shop works the same.
              </p>
              <Link
                to="/faqs"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Learn more in our Cookie Policy
              </Link>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={reject}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Reject
              </button>
              <button
                onClick={accept}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
