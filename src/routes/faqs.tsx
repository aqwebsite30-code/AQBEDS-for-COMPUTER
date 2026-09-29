import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/faqs")({
  head: () => ({
    meta: [
      { title: "FAQs — AQ Beds" },
      { name: "description", content: "Frequently asked questions about AQ Beds." },
      { property: "og:title", content: "FAQs — AQ Beds" },
      {
        property: "og:description",
        content:
          "Frequently asked questions about AQ Beds delivery, returns, materials, payments and more.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
      { property: "og:url", content: "https://www.aqbeds.com/faqs" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FAQs — AQ Beds" },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/faqs" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }),
      },
    ],
  }),
  component: FAQsPage,
});

const faqs = [
  {
    question: "Do you offer free delivery?",
    answer:
      "Yes, we offer free delivery on all beds nationwide. Fast, reliable, and secure directly to your door.",
  },
  {
    question: "What is your return policy?",
    answer:
      "Returns are accepted at the door only — when your order is delivered. Inspect the bed before the courier leaves, and if anything is wrong, report it on the spot and we'll take it back there and then.",
  },
  {
    question: "Do you offer replacements?",
    answer:
      "Next Day Free Replacement: if something is wrong with your order, contact us any time and we'll replace it free of charge with next-day delivery — WhatsApp or info@aqbeds.com.",
  },
  {
    question: "Do you offer cash on delivery?",
    answer:
      "Yes, we offer Cash on Delivery so you can inspect your bed before completing payment. Stress-free and convenient!",
  },
  {
    question: "How long does shipping normally take?",
    answer:
      "Beds and mattresses typically ship within 3 to 7 business days. Sofas and upholstery take 5 to 10 business days. Made-to-order items may take 2–4 weeks.",
  },
  {
    question: "What materials are used in AQ Beds?",
    answer:
      "Frames are built from solid timber and high-grade engineered wood, upholstered in crushed velvet, plush velvet, chenille or soft matte. Mattresses range from a standard comfort foam up to 2000 pocket sprung, with orthopaedic options available.",
  },
  {
    question: "Do you offer assembly or installation services?",
    answer:
      "Most beds are designed for easy self-assembly and come with all the tools and instructions you need. Professional assembly can be added on the product page before you add to basket, or ask us for a quote on WhatsApp.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Cash on Delivery across the UK — you check the bed before you pay, and pay the driver. Online card payment is not switched on yet; message us on WhatsApp if you would like to pay in advance.",
  },
  {
    question: "How do I track my delivery?",
    answer:
      "Every order gets a confirmation email with your order number. Reply to that email or message us on WhatsApp with the number and we'll give you the current delivery window.",
  },
  {
    question: "What happens if my bed arrives damaged?",
    answer:
      "If your bed arrives damaged or faulty, contact us within 48 hours with photos of the issue. We will arrange a free replacement or full refund — whichever you prefer.",
  },
  {
    question: "Can I change or cancel my order?",
    answer:
      "You can change or cancel your order within 24 hours of placing it — just get in touch.",
  },
];

function FAQsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 animate-fade-in relative min-h-[60vh]">
      <div className="mb-12 text-center text-brand">
        <h1 className="font-display font-bold text-4xl sm:text-5xl">Frequently Asked Questions</h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Everything you need to know about AQ Beds.
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card hover:shadow-luxury transition-all duration-300 group"
          >
            <h2 className="font-display font-bold text-xl text-brand flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-cta rounded-full shrink-0 shadow-[0_0_10px_var(--color-cta)]" />
              {faq.question}
            </h2>
            <p className="mt-4 text-brand/70 pl-5 border-l-2 border-brand/10 ml-1.5 leading-relaxed font-medium">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center p-12 rounded-[40px] bg-gradient-to-br from-brand to-brand-accent text-white shadow-luxury">
        <h2 className="font-display font-bold text-3xl mb-4">Still have questions?</h2>
        <p className="text-white/70 mb-8 max-w-md mx-auto">
          Our team is here to help you find the perfect bed for your home.
        </p>
        <a
          href="/contact"
          className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-10 text-brand font-bold hover:bg-secondary transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
