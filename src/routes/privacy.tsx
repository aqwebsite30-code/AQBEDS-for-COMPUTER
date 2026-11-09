import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | How AQ Beds Handles Your Data | AQ Beds" },
      {
        name: "description",
        content:
          "How AQ Beds collects, uses and protects your personal data. Read our UK GDPR-compliant privacy policy covering orders, payments, cookies and your rights.",
      },
      { property: "og:title", content: "Privacy Policy - AQ Beds" },
      {
        property: "og:description",
        content:
          "How AQ Beds collects, uses and protects your personal data. UK GDPR-compliant privacy policy.",
      },
      { property: "og:url", content: "https://www.aqbeds.com/privacy" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Privacy Policy - AQ Beds" },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 animate-fade-in">
      <h1 className="font-display font-bold text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-muted-foreground">
        Last updated: 1 September 2026. This policy explains what personal data AQ Beds collects,
        why we collect it, and the rights you have over it under the UK GDPR and the Data Protection
        Act 2018.
      </p>

      <section className="mt-10 space-y-6 text-muted-foreground leading-relaxed">
        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">1. Who we are</h2>
          <p className="mt-3">
            AQ Beds ("we", "us", "our") is a UK-based retailer of beds, mattresses, sofas and
            bedroom furniture. For data protection purposes we are the data controller of your
            personal data. Contact us at{" "}
            <a href="mailto:info@aqbeds.com" className="text-brand underline">
              info@aqbeds.com
            </a>{" "}
            or by phone on{" "}
            <a href="tel:+447519791128" className="text-brand underline">
              +44 7519 791128
            </a>
            .
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">
            2. What data we collect and why
          </h2>
          <ul className="mt-3 space-y-3 list-disc pl-5">
            <li>
              <strong>Order details</strong> — name, delivery and billing address, email and phone
              number, and the items you buy. Needed to take payment, deliver your order and handle
              returns (contract performance).
            </li>
            <li>
              <strong>Payment information</strong> — processed securely by our payment provider. We
              do not store full card numbers on our servers.
            </li>
            <li>
              <strong>Delivery notes</strong> — such as access instructions or preferred delivery
              windows, so our couriers can complete your delivery.
            </li>
            <li>
              <strong>Customer service messages</strong> — emails, WhatsApp and chat transcripts,
              kept so we can resolve your query.
            </li>
            <li>
              <strong>Usage data</strong> — pages viewed, device and browser type, approximate
              location and referral source, collected through cookies and similar technologies to
              improve the site and measure our marketing.
            </li>
          </ul>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">3. Cookies and advertising</h2>
          <p className="mt-3">
            We use essential cookies to run the site (for example, keeping your basket contents).
            With your consent we also use analytics and advertising cookies, including Meta
            (Facebook) pixels, to measure which ads lead to sales and to show you relevant offers.
            You can change your cookie preferences at any time through your browser settings, and
            you can opt out of personalised advertising through the ad industry's tools.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">4. Who we share data with</h2>
          <p className="mt-3">
            We share only what is necessary with: our payment processor; delivery partners who carry
            your order; IT and hosting providers who run our website; and analytics and advertising
            platforms where you have consented. We never sell your personal data.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">5. How long we keep it</h2>
          <p className="mt-3">
            Order and invoice records are kept for <strong>6 years</strong> to meet HMRC and
            accounting requirements. Customer service messages are kept for up to{" "}
            <strong>2 years</strong>. Marketing preferences are kept until you withdraw consent, and
            we review our records regularly to delete what we no longer need.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">6. Your rights</h2>
          <p className="mt-3">You have the right to:</p>
          <ul className="mt-2 space-y-2 list-disc pl-5">
            <li>Request a copy of the personal data we hold about you</li>
            <li>Ask us to correct data that is wrong or incomplete</li>
            <li>Ask us to delete your data, where we have no legal reason to keep it</li>
            <li>Object to or restrict how we use your data</li>
            <li>Withdraw consent for marketing or advertising cookies at any time</li>
            <li>Request that your data be transferred to another provider</li>
          </ul>
          <p className="mt-3">
            To exercise any of these, email{" "}
            <a href="mailto:info@aqbeds.com" className="text-brand underline">
              info@aqbeds.com
            </a>
            . We respond within 30 days. You may also complain to the Information Commissioner's
            Office (ICO) at{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noreferrer"
              className="text-brand underline"
            >
              ico.org.uk
            </a>
            .
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">7. Security and changes</h2>
          <p className="mt-3">
            We use SSL encryption, access controls and reputable payment providers to protect your
            data. No system is completely risk-free, but we review our safeguards regularly. We will
            post any changes to this page here, and where a change is significant we will notify you
            by email.
          </p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          to="/terms"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-8 text-white font-bold hover:bg-brand-accent transition-all"
        >
          Terms of Service
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
