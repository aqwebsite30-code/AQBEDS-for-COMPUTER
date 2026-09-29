import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns Policy — AQ Beds" },
      {
        name: "description",
        content:
          "At-Door Returns and Next Day Free Replacement at AQ Beds. Free UK delivery. Cash on delivery available.",
      },
      { property: "og:title", content: "Returns Policy — AQ Beds" },
      {
        property: "og:description",
        content:
          "At-Door Returns and Next Day Free Replacement at AQ Beds. Free UK delivery. Cash on delivery available.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
      { property: "og:url", content: "https://www.aqbeds.com/returns" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Returns Policy — AQ Beds" },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/returns" }],
  }),
  component: Returns,
});

function Returns() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 animate-fade-in">
      <h1 className="font-display font-bold text-4xl">Returns Policy</h1>
      <p className="mt-3 text-muted-foreground">
        We want you to love your AQ Bed. If something isn't right, we're here to help.
      </p>

      <section className="mt-10 space-y-8">
        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">At-Door Returns</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Returns are accepted at the door only — when your order is delivered. Inspect the bed
            before the courier leaves, and if anything is wrong, report it on the spot and we'll
            take it back there and then.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">Next Day Free Replacement</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Next Day Free Replacement: if something is wrong with your order, contact us any time
            and we'll replace it free of charge with next-day delivery — WhatsApp or{" "}
            <a href="mailto:info@aqbeds.com" className="text-brand underline">
              info@aqbeds.com
            </a>
            .
          </p>
        </div>
      </section>

      <div className="mt-12 p-8 rounded-[32px] bg-gradient-to-br from-brand to-brand-accent text-white shadow-luxury text-center">
        <h2 className="font-display font-bold text-2xl">Need help with a return?</h2>
        <p className="mt-2 text-white/70">Our team is ready to assist you.</p>
        <a
          href="/contact"
          className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-white px-8 text-brand font-bold hover:bg-secondary transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}
