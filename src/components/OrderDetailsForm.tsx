import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import {
  CUSTOMER_FIELDS,
  loadOrderDetails,
  missingCustomerFields,
  saveOrderDetails,
  type CustomerDetails,
} from "@/lib/whatsapp-order";

const PLACEHOLDERS: Record<string, string> = {
  name: "e.g. Sarah Ahmed",
  phone: "07xxx xxxxxx",
  address: "14 Rose Lane, Flat 2",
  city: "e.g. Leeds",
  postcode: "e.g. LS1 4AB",
};

export function OrderDetailsForm({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (details: CustomerDetails) => void;
}) {
  const [values, setValues] = useState<CustomerDetails>({
    name: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
  });
  const [errors, setErrors] = useState<(keyof CustomerDetails)[]>([]);

  useEffect(() => {
    if (open) {
      setValues(loadOrderDetails());
      setErrors([]);
    }
  }, [open]);

  const submit = () => {
    const missing = missingCustomerFields(values);
    if (missing.length > 0) {
      setErrors(missing);
      const first = document.getElementById(`order-details-${missing[0]}`);
      if (first) first.focus();
      return;
    }
    const details: CustomerDetails = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      postcode: values.postcode.trim(),
    };
    saveOrderDetails(details);
    onSubmit(details);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close order details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand/40 backdrop-blur-md cursor-default"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Order details"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 320 }}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-luxury"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display font-bold text-xl">Order details</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  We need this to confirm your delivery
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {CUSTOMER_FIELDS.map((field) => {
                const hasError = errors.includes(field.key);
                return (
                  <label key={field.key} className="block">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand/60 pl-1">
                      {field.label}
                    </span>
                    <input
                      id={`order-details-${field.key}`}
                      type={field.key === "phone" ? "tel" : "text"}
                      inputMode={field.key === "phone" ? "tel" : "text"}
                      value={values[field.key]}
                      placeholder={PLACEHOLDERS[field.key]}
                      aria-invalid={hasError}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, [field.key]: e.target.value }));
                        setErrors((errs) => errs.filter((k) => k !== field.key));
                      }}
                      className={`mt-2 w-full min-h-[48px] rounded-xl border px-4 text-sm font-medium outline-none transition-all ${
                        hasError
                          ? "border-red-500 bg-red-50 ring-2 ring-red-200 focus:ring-red-300"
                          : "border-border bg-background focus:border-brand focus:ring-4 focus:ring-brand/10"
                      }`}
                    />
                    {hasError && (
                      <span className="block mt-1 pl-1 text-[11px] font-semibold text-red-500">
                        Required — needed to confirm your delivery
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={submit}
              className="mt-6 w-full min-h-[52px] rounded-2xl bg-whatsapp text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg"
            >
              <MessageCircle className="h-5 w-5" />
              Continue to WhatsApp
            </button>
            <p className="mt-3 text-[11px] text-muted-foreground text-center">
              Saved on this device — we'll prefill it next time.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
