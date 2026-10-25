import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/delivery")({
  head: () => ({
    meta: [
      { title: "Delivery Information — AQ Beds" },
      {
        name: "description",
        content:
          "Free UK next-day delivery on orders before 8 PM UK, Monday–Saturday. Sunday orders arrive Tuesday or Thursday. 2-hour delivery window by text.",
      },
      { property: "og:title", content: "Delivery Information — AQ Beds" },
      {
        property: "og:description",
        content:
          "Free UK next-day delivery on orders before 8 PM UK, Mon–Sat. Sunday orders arrive Tuesday or Thursday.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
      { property: "og:url", content: "https://www.aqbeds.com/delivery" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Delivery Information — AQ Beds" },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/delivery" }],
  }),
  component: Delivery,
});

function Delivery() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 animate-fade-in">
      <h1 className="font-display font-bold text-4xl">Delivery Information</h1>
      <p className="mt-3 text-muted-foreground">
        We deliver throughout the UK — free of charge, straight to your door.
      </p>

      <section className="mt-10 space-y-8">
        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">Free UK Delivery</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            All orders placed on AQ Beds ship with <strong>free standard delivery</strong> anywhere
            in the UK (including Scotland, Wales, and Northern Ireland). There are no hidden fees —
            the price you see is the price you pay.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">Delivery Timeframes</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Next-day delivery on orders placed before 8 PM UK, Monday–Saturday.
            <br />
            Sunday orders are delivered Tuesday or Thursday (Monday is our off day).
            <br />
            Free UK delivery on every bed. 2-hour delivery window by text.
            <br />
            Bank holidays: delivery slides to the next available day.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">Delivery Areas</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            We deliver to all UK mainland addresses. For <strong>remote areas</strong> (Scottish
            Highlands, Isle of Wight, Isle of Man, Channel Islands, and Northern Ireland offshore),
            delivery may take slightly longer. Please contact us before ordering if you're unsure
            about your postcode.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">Tracking Your Order</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Once your order ships, you will receive a{" "}
            <strong>tracking link via email and SMS</strong>. You can use this to monitor your
            delivery in real time. If you haven't received tracking details within the expected
            timeframe, check your spam folder or contact us.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">Assembly Options</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Most AQ Beds are designed for <strong>easy self-assembly</strong> and come with clear
            instructions and all necessary tools. If you'd prefer a professional to handle it, we
            offer a <strong>white-glove assembly service</strong> in select areas — add it at
            checkout or ask our team for a quote.
          </p>
        </div>

        <div className="rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8 backdrop-blur-md shadow-card">
          <h2 className="font-display font-bold text-xl text-brand">
            What to Expect on Delivery Day
          </h2>
          <ul className="mt-3 text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
            <li>
              You will receive a <strong>2-hour delivery window by text</strong> on the morning of
              delivery.
            </li>
            <li>
              Our driver will bring your order <strong>to the room of your choice</strong> where
              access allows — please measure doorways and stairwells in advance.
            </li>
            <li>
              Our driver will <strong>not remove your old bed</strong> unless pre-arranged. Check
              with us for disposal options.
            </li>
          </ul>
        </div>
      </section>

      <div className="mt-12 p-8 rounded-[32px] bg-gradient-to-br from-brand to-brand-accent text-white shadow-luxury text-center">
        <h2 className="font-display font-bold text-2xl">Questions about delivery?</h2>
        <p className="mt-2 text-white/70">We're happy to help with any specific requirements.</p>
        <a
          href="/contact"
          className="mt-5 inline-flex h-12 items-center justify-center rounded-2xl bg-white px-8 text-brand font-bold hover:bg-secondary transition-all shadow-xl hover:scale-105 active:scale-95"
        >
          Get in Touch
        </a>
      </div>
    </div>
  );
}
