import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useCart } from "../features/cart/store/cart";
import { formatGBP, WHATSAPP_NUMBER } from "../lib/utils/format";
import { CheckCircle2, Loader2, MessageSquare, MessageCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sendOrderEmail } from "../lib/email";
import { saveOrder } from "@/lib/orders";
import { getTrackingToken } from "@/hooks/useTracking";
import { toast } from "sonner";
import { trackPixelWithId, generateEventId, getClientTrackingData } from "@/lib/meta-pixel";
import { sendInitiateCheckoutEvent } from "@/lib/meta-capi";
import { trackEvent } from "@/lib/analytics";
import { getDeliveryWindow, type ArrivalWindow } from "@/lib/delivery-date";
import {
  buildOrderMessage,
  missingCustomerFields,
  rowsFromOptionsRecord,
  type CustomerDetails,
} from "@/lib/whatsapp-order";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Checkout — AQ Beds" }, { name: "robots", content: "noindex, follow" }],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/checkout" }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [arrival, setArrival] = useState<ArrivalWindow | null>(null);
  const [secure, setSecure] = useState(false);
  const [waMissing, setWaMissing] = useState<string[]>([]);
  const [placedOrderNo, setPlacedOrderNo] = useState("");
  const purchaseFired = useRef(false);
  const checkoutEventId = useRef<string>("");

  useEffect(() => {
    setArrival(getDeliveryWindow(new Date()));
    setSecure(window.location.protocol === "https:");
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      const contentIds = items.map((i) => String(i.productId)).filter(Boolean);
      const event_id = trackPixelWithId("InitiateCheckout", {
        content_ids: contentIds,
        content_type: "product",
        value: total(),
        currency: "GBP",
        num_items: items.reduce((s, i) => s + i.qty, 0),
      });
      checkoutEventId.current = event_id;
      const trackingData = getClientTrackingData();
      sendInitiateCheckoutEvent({
        event_id,
        content_ids: contentIds,
        content_type: "product",
        value: total(),
        currency: "GBP",
        num_items: items.reduce((s, i) => s + i.qty, 0),
        client_user_agent: navigator.userAgent,
        ...trackingData,
      }).catch(() => {});
      trackEvent("InitiateCheckout", {
        value: total(),
        productName: `${items.length} item(s)`,
      });
    }
  }, []);

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display font-bold text-2xl">Your basket is empty</h1>
        <Link
          to="/"
          className="inline-block mt-6 h-11 px-6 leading-[2.75rem] rounded-2xl bg-cta text-cta-foreground font-semibold"
        >
          Shop Beds
        </Link>
      </div>
    );
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const customer = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      addr1: formData.get("addr1") as string,
      city: formData.get("city") as string,
      postcode: formData.get("postcode") as string,
    };

    const totalAmount = formatGBP(total());
    try {
      // Generate Purchase event_id upfront for deduplication (client + server)
      const purchaseEventId = generateEventId();
      const trackingData = getClientTrackingData();

      // Fire InitiateCheckout CAPI with full customer PII (re-fire on submit for better EMQ)
      const checkoutContentIds = items.map((i) => String(i.productId)).filter(Boolean);
      const checkoutPayload = {
        event_id: checkoutEventId.current || undefined,
        content_ids: checkoutContentIds,
        content_type: "product",
        value: total(),
        currency: "GBP" as const,
        num_items: items.reduce((s, i) => s + i.qty, 0),
        client_user_agent: navigator.userAgent,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_first_name: customer.name.split(/\s+/)[0] || "",
        customer_last_name: customer.name.split(/\s+/).slice(1).join(" ") || "",
        customer_city: customer.city,
        customer_postcode: customer.postcode,
        customer_country: (formData.get("country") as string) || "United Kingdom",
        ...trackingData,
      } as any;
      sendInitiateCheckoutEvent(checkoutPayload).catch(() => {});

      // 1. Save order to database (get order number for confirmation + WhatsApp)
      const trackingToken = getTrackingToken();
      // @ts-ignore
      const orderResult = await saveOrder({
        data: {
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          customerAddress: `${customer.addr1}, ${customer.city}, ${customer.postcode}, ${formData.get("country") || "United Kingdom"}`,
          items: JSON.stringify(
            items.map((i) => ({
              id: i.productId,
              name: i.name,
              qty: i.qty,
              price: i.unitPrice,
              options: i.options,
              image: i.image,
            })),
          ),
          total: total(),
          instructions: (formData.get("instructions") as string) || "",
          trackingToken,
          event_id: purchaseEventId,
          client_user_agent: navigator.userAgent,
          ...trackingData,
        } as any,
      });

      let orderId = "";
      if (orderResult && orderResult.success) {
        orderId = orderResult.orderId ?? "";
      } else {
        console.error("Order save failed:", orderResult?.error);
      }

      // 2. Send Email via Resend
      const emailPayload: any = {
        data: {
          orderId,
          orderNumber: orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "",
          customer: {
            ...customer,
            country: formData.get("country") as string,
            payment: "Cash on delivery",
          },
          items: items.map((i) => ({
            id: i.productId,
            name: i.name,
            qty: i.qty,
            price: i.unitPrice,
            options: i.options,
          })),
          total: totalAmount,
        },
      };
      // @ts-ignore
      const emailResult = await sendOrderEmail(emailPayload);

      if (emailResult && !emailResult.success) {
        console.error("Email sending failed:", emailResult.error);
        toast.error("Email failed to send, but order was placed.");
      }

      // 3. Prepare WhatsApp message with order number (opened manually by customer)
      const orderNumber = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "";
      const waDetails: CustomerDetails = {
        name: customer.name,
        phone: customer.phone,
        address: customer.addr1,
        city: customer.city,
        postcode: customer.postcode,
      };
      const message = buildOrderMessage(
        items.map((i) => ({
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          rows: rowsFromOptionsRecord(i.options),
          url:
            typeof window !== "undefined"
              ? `${window.location.origin}/product/${i.productId}`
              : undefined,
        })),
        waDetails,
        { arrival, orderNo: orderNumber },
      );
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, "")}?text=${encodeURIComponent(message)}`;

      setPlacedOrderNo(orderNumber);
      setWhatsappUrl(waUrl);
      setPlaced(true);
      if (!purchaseFired.current) {
        purchaseFired.current = true;
        if (typeof window !== "undefined" && typeof window.fbq === "function") {
          window.fbq(
            "track",
            "Purchase",
            {
              value: total(),
              currency: "GBP",
              content_ids: items.map((i) => String(i.productId)).filter(Boolean),
              content_type: "product",
              order_id: orderId,
            },
            { eventID: purchaseEventId },
          );
        }
        trackEvent("Purchase", {
          value: total(),
          productName: `${items.length} item(s)`,
        });
      }
      clear();
    } catch (err) {
      console.error("Checkout Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const readCustomer = (form: HTMLFormElement): CustomerDetails => {
    const fd = new FormData(form);
    return {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      address: String(fd.get("addr1") || "").trim(),
      city: String(fd.get("city") || "").trim(),
      postcode: String(fd.get("postcode") || "").trim(),
    };
  };

  const highlightMissing = (missing: (keyof CustomerDetails)[]) => {
    const toInputName = (key: keyof CustomerDetails) => (key === "address" ? "addr1" : key);
    setWaMissing(missing.map(toInputName));
    const first = document.querySelector<HTMLInputElement>(`[name="${toInputName(missing[0])}"]`);
    if (first) {
      first.scrollIntoView({ block: "center", behavior: "smooth" });
      first.focus({ preventScroll: true });
    }
  };

  // Builds the checkout WhatsApp URL from LIVE form values at click time.
  // Returns null (and highlights the missing fields) when any of the five
  // required details are empty — the WhatsApp tab never opens.
  const checkoutWaUrl = (form: HTMLFormElement | null, orderNo?: string): string | null => {
    if (!form) return null;
    const details = readCustomer(form);
    const missing = missingCustomerFields(details);
    if (missing.length > 0) {
      highlightMissing(missing);
      return null;
    }
    setWaMissing([]);
    const message = buildOrderMessage(
      items.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        rows: rowsFromOptionsRecord(i.options),
        url:
          typeof window !== "undefined"
            ? `${window.location.origin}/product/${i.productId}`
            : undefined,
      })),
      details,
      { arrival, orderNo },
    );
    return `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, "")}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-fade-in relative min-h-[600px]">
      <h1 className="font-display font-bold text-3xl sm:text-4xl">Checkout</h1>

      <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_380px] gap-8 mt-8">
        <div className="space-y-8">
          <Card title="Contact">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full name" name="name" required error={waMissing.includes("name")} />
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone" name="phone" required error={waMissing.includes("phone")} />
            </div>
          </Card>
          <Card title="Shipping address">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label="Address line 1"
                name="addr1"
                required
                full
                error={waMissing.includes("addr1")}
              />
              <Field label="City" name="city" required error={waMissing.includes("city")} />
              <Field
                label="Postcode"
                name="postcode"
                required
                error={waMissing.includes("postcode")}
              />
              <Field label="Country" name="country" defaultValue="United Kingdom" required />
            </div>
          </Card>
          <Card title="Payment">
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-2xl border border-cta/30 bg-cta/5 cursor-pointer ring-2 ring-cta/10 shadow-sm transition-all hover:bg-cta/[0.08]">
                <input type="radio" name="pay" defaultChecked className="accent-cta w-4 h-4" />
                <span className="font-medium text-brand">Cash on delivery</span>
              </label>
              {/* Card option removed as requested */}
              <p className="text-xs font-bold text-brand leading-relaxed pt-1">
                No payment now — pay cash to the courier after you inspect your bed
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                At-Door Returns — courier waits while you check
              </p>
            </div>
          </Card>
        </div>

        <aside className="rounded-3xl border border-border bg-card p-6 h-fit space-y-4 sticky top-24 shadow-xl">
          <h2 className="font-display font-bold text-xl">Order Summary</h2>
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
          <div className="rounded-2xl border border-cta/30 bg-cta/5 p-4 space-y-1.5">
            <div className="text-xs font-black uppercase tracking-wider text-brand">
              RISK-FREE ORDERING
            </div>
            <div className="text-sm font-medium text-foreground/85">Pay NOTHING online</div>
            <div className="text-sm font-medium text-foreground/85">
              Inspect the bed at your door
            </div>
            <div className="text-sm font-medium text-foreground/85">
              Pay cash ONLY if you love it
            </div>
            <div className="text-sm font-medium text-foreground/85">Courier waits for your OK</div>
          </div>
          {arrival && (
            <p className="text-center text-sm font-black text-brand rounded-2xl border border-brand/20 bg-brand/[0.06] py-3">
              {arrival.label}
            </p>
          )}
          <p className="text-center text-xs font-bold text-brand/80">Inspect Before You Pay</p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Order"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              const url = checkoutWaUrl((e.currentTarget as HTMLButtonElement).form);
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }}
            className="w-full min-h-[48px] rounded-2xl bg-whatsapp text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
          >
            <MessageCircle className="h-5 w-5" /> Order on WhatsApp
          </button>
          <p className="text-[10px] text-center text-muted-foreground px-4">
            By placing an order you agree to our Terms of Service.
          </p>
          {secure && (
            <p className="text-[10px] text-center text-muted-foreground">Secure SSL Site</p>
          )}
        </aside>
      </form>

      <AnimatePresence>
        {placed && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  damping: 20,
                  stiffness: 300,
                },
              }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-md bg-gradient-to-br from-brand to-brand-accent border border-white/20 rounded-[40px] p-10 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                <CheckCircle2 className="w-40 h-40 text-white" />
              </div>

              <div className="flex flex-col items-center text-center space-y-8 relative z-10">
                <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20 shadow-inner rotate-3">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-display font-bold text-white tracking-tight leading-tight">
                    Order confirmed!
                  </h2>
                  <p className="text-white/70 font-medium px-2">
                    Thank you for choosing AQ Beds. Your premium sleep experience is being prepared.
                  </p>
                  <p className="text-white font-bold text-sm px-2">
                    £0 today. Pay the courier when it arrives.
                  </p>
                </div>

                <div className="w-full h-px bg-white/10" />

                <div className="space-y-4 w-full">
                  <p className="text-white/60 text-sm font-medium italic">
                    You will be notified shortly via WhatsApp.
                  </p>

                  <Link
                    to="/"
                    className="w-full h-14 rounded-2xl bg-white text-brand font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    Return Home
                  </Link>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      const url = checkoutWaUrl(
                        document.querySelector<HTMLFormElement>("form"),
                        placedOrderNo,
                      );
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                      else setPlaced(false);
                    }}
                    className="w-full h-14 rounded-2xl bg-whatsapp text-white font-bold flex items-center justify-center gap-2 hover:bg-whatsapp/90 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Open WhatsApp
                  </a>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-cta/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-brand/10 bg-brand/[0.03] p-6 backdrop-blur-md">
      <h2 className="font-display font-bold text-lg mb-6 text-brand flex items-center gap-2">
        <span className="w-2 h-2 bg-cta rounded-full shadow-[0_0_8px_var(--color-cta)]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  full,
  defaultValue,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  full?: boolean;
  defaultValue?: string;
  error?: boolean;
}) {
  return (
    <label className={`block text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[10px] text-brand/50 font-bold uppercase tracking-widest pl-1">
        {label}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        aria-invalid={error || undefined}
        className={`mt-2 w-full h-12 rounded-xl bg-brand/[0.02] px-4 text-brand text-sm outline-none transition-all font-medium placeholder:text-brand/30 ${
          error
            ? "border-2 border-red-500 ring-4 ring-red-500/20 focus:border-red-500 focus:ring-red-500/30"
            : "border border-brand/10 focus:border-cta/50 focus:ring-4 focus:ring-cta/10"
        }`}
      />
    </label>
  );
}
