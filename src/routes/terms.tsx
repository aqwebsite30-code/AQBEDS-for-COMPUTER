import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Ordering and Delivery Terms | AQ Beds" },
      {
        name: "description",
        content:
          "The terms and conditions of buying from AQ Beds: pricing, payment, delivery, returns, warranties and your legal rights under UK consumer law.",
      },
      { property: "og:title", content: "Terms of Service - AQ Beds" },
      {
        property: "og:description",
        content:
          "Terms and conditions of buying from AQ Beds: pricing, payment, delivery, returns and warranties.",
      },
      { property: "og:url", content: "https://www.aqbeds.com/terms" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Terms of Service - AQ Beds" },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 animate-fade-in">
      <h1 className="font-display font-bold text-4xl">Terms of Service</h1>
      <p className="mt-3 text-muted-foreground">
        Last updated: 1 September 2026. These terms apply when you order from AQ Beds. By placing an
        order you agree to them. Nothing in these terms affects your statutory rights as a consumer.
      </p>

      <section className="mt-10 space-y-6 text-muted-foreground leading-relaxed">
        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">1. About us</h2>
          <p className="mt-3">
            AQ Beds supplies beds, mattresses, sofas and bedroom furniture across the United
            Kingdom. Contact us at{" "}
            <a href="mailto:info@aqbeds.com" className="text-brand underline">
              info@aqbeds.com
            </a>{" "}
            or{" "}
            <a href="tel:+447519791128" className="text-brand underline">
              +44 7519 791128
            </a>
            .
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">2. Orders and pricing</h2>
          <ul className="mt-3 space-y-3 list-disc pl-5">
            <li>All prices are in pounds sterling and include VAT at the current UK rate.</li>
            <li>
              Where a discount is shown, it is applied to our standard price for that item; the
              standard price is the higher figure shown alongside it.
            </li>
            <li>
              An order is an offer to buy. The contract forms when we send you an order confirmation
              email.
            </li>
            <li>
              If we discover a pricing error before dispatch, we will contact you and give you the
              option to pay the correct price or cancel for a full refund.
            </li>
            <li>
              Some beds are made to order. Bespoke sizes, fabrics and personalised items are
              confirmed by message before production begins.
            </li>
          </ul>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">3. Payment</h2>
          <p className="mt-3">
            We accept major debit and credit cards and, where offered at checkout, Cash on Delivery.
            Payment is taken when your order is confirmed. Card details are handled by our payment
            provider and are not stored on our systems.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">4. Delivery</h2>
          <ul className="mt-3 space-y-3 list-disc pl-5">
            <li>
              Delivery is <strong>free on all bed orders</strong> to UK mainland addresses.
            </li>
            <li>
              Made-to-order beds are typically dispatched within <strong>3–5 working days</strong>;
              stock items ship sooner. We will confirm a delivery window with you.
            </li>
            <li>
              Please check access to your room before ordering — measure doorways, stairwells and
              lifts. Our couriers will place items in the room of your choice where access allows.
            </li>
            <li>
              If delivery is delayed for reasons outside our control, we will keep you informed and
              you may cancel for a full refund if it cannot be delivered within a reasonable time.
            </li>
          </ul>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">
            5. Cancellations and returns
          </h2>
          <p className="mt-3">
            You have <strong>30 days from delivery</strong> to return an unused item in its original
            packaging for a full refund, and we arrange collection at no cost to you. You may also
            cancel within 14 days of receiving your order under the Consumer Contracts Regulations.
            Custom and made-to-order items are non-returnable unless faulty. Full details are on our{" "}
            <Link to="/returns" className="text-brand underline">
              Returns Policy
            </Link>
            .
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">6. Warranty</h2>
          <p className="mt-3">
            Bed frames carry a <strong>1-year manufacturer's warranty</strong> against defects in
            materials and workmanship. This is in addition to your statutory rights. The warranty
            does not cover normal wear, damage caused by misuse or incorrect assembly, or
            alterations made by you. Report any fault within 48 hours of discovery with photographs.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">7. Your legal rights</h2>
          <p className="mt-3">
            Goods must be of satisfactory quality, fit for purpose and as described. If they are
            not, you are entitled to a repair, replacement or refund under the Consumer Rights Act
            2015. These terms are governed by the law of England and Wales, and the courts of
            England and Wales have exclusive jurisdiction.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">8. Changes to these terms</h2>
          <p className="mt-3">
            We may update these terms from time to time. The version in force on the date you place
            your order is the one that applies to that order. The current version is always
            published on this page.
          </p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          to="/privacy"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-8 text-white font-bold hover:bg-brand-accent transition-all"
        >
          Privacy Policy
        </Link>
        <Link
          to="/contact"
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-brand/30 px-8 text-brand font-bold hover:bg-brand/10 transition-all"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
