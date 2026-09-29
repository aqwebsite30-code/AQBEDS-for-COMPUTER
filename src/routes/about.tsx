import { createFileRoute, Link } from "@tanstack/react-router";

const CATEGORIES = [
  {
    name: "Ottoman & storage beds",
    copy: "Gas-lift bases with hidden storage under the mattress.",
    slug: "ottoman-beds",
  },
  {
    name: "Divan beds",
    copy: "Drawer storage, headboard choices, mattress included.",
    slug: "divan-beds",
  },
  {
    name: "Velvet beds",
    copy: "Wingback, sleigh and panel frames in four fabrics.",
    slug: "luxury-beds",
  },
  {
    name: "Sofas & sofa beds",
    copy: "Crushed velvet sofas, corner sets and sofa beds.",
    slug: "sofas",
  },
  {
    name: "Wardrobes",
    copy: "Hinged and sliding wardrobes in the same fabrics as the beds.",
    slug: "wardrobes",
  },
];

const PROMISES = [
  { title: "Free UK delivery", copy: "Every order ships free to your door, nationwide." },
  { title: "At-Door Returns", copy: "Inspect it at the door, before the courier leaves." },
  {
    title: "Next Day Free Replacement",
    copy: "Something wrong? Contact us any time — free, next day.",
  },
  { title: "Pay on delivery", copy: "Inspect the bed before money changes hands." },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About AQ Beds | Handcrafted Beds Since 2018" },
      {
        name: "description",
        content:
          "AQ Beds has sold handcrafted beds direct to UK homes since 2018. Free UK delivery. Cash on delivery available.",
      },
      { property: "og:title", content: "About AQ Beds | Handcrafted Beds Since 2018" },
      {
        property: "og:description",
        content:
          "Handcrafted beds, sofas and wardrobes sold direct since 2018. Free UK delivery. Cash on delivery available.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
      { property: "og:url", content: "https://www.aqbeds.com/about" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "About AQ Beds | Handcrafted Beds Since 2018" },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 animate-fade-in">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand/60 mb-3">Since 2018</p>
      <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight">About AQ Beds</h1>

      {/* 1. Story */}
      <section className="mt-8" aria-labelledby="story">
        <h2 id="story" className="font-display font-black text-2xl mb-4">
          Our story
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          AQ Beds started in 2018 with one idea: sell properly built beds directly, at prices that
          make sense when there is no showroom in the middle. We design the frames, pick the fabrics
          and handle the order ourselves, then ship it free anywhere in the UK. More than 10,000
          customers have slept on one since.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          We design and build premium beds for people who care about how they sleep — and how their
          bedroom looks. Every AQ Bed is engineered for durability, dressed in luxurious fabrics,
          and finished by hand.
        </p>
      </section>

      {/* 2. What we make */}
      <section className="mt-12" aria-labelledby="make">
        <h2 id="make" className="font-display font-black text-2xl mb-5">
          What we make
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className="rounded-2xl border border-border bg-card p-5 hover:border-brand/40 hover:shadow-soft transition-all"
            >
              <h3 className="font-bold text-sm">{c.name}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.copy}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Materials */}
      <section className="mt-12" aria-labelledby="materials">
        <h2 id="materials" className="font-display font-black text-2xl mb-4">
          Materials &amp; craft
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Frames are built from solid timber and high-grade engineered wood, then upholstered in one
          of four fabrics: crushed velvet, plush velvet, chenille and soft matte — sixteen shades in
          total. Mattresses run from a standard comfort foam up to 2000 pocket sprung, with
          orthopaedic options, and every "with mattress" size is cut to the frame you pick.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Storage bases open on a gas-lift mechanism, headboards come in panel, plain, cube and
          chesterfield designs, and divan bases take two or four drawers when you want them.
        </p>
      </section>

      {/* 4. How buying works */}
      <section className="mt-12" aria-labelledby="buying">
        <h2 id="buying" className="font-display font-black text-2xl mb-5">
          How ordering works
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {PROMISES.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-bold text-sm text-brand">{p.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{p.copy}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          Beds and mattresses typically ship within 3 to 7 business days, sofas and upholstery in 5
          to 10, and made-to-order items in 2–4 weeks. Full detail sits on our{" "}
          <Link to="/delivery" className="text-brand underline">
            delivery
          </Link>{" "}
          and{" "}
          <Link to="/returns" className="text-brand underline">
            returns
          </Link>{" "}
          pages.
        </p>
      </section>

      {/* 5. Proof */}
      <section className="mt-12" aria-labelledby="proof">
        <h2 id="proof" className="font-display font-black text-2xl mb-5">
          The proof
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { stat: "10,000+", label: "customers since 2018" },
            { stat: "32", label: "products in the range" },
            { stat: "4", label: "fabric families" },
            { stat: "Next Day", label: "free replacement, any time" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-brand/[0.05] border border-brand/10 p-4">
              <p className="font-display font-black text-xl text-brand">{s.stat}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Read what customers said on the{" "}
          <Link to="/reviews" className="text-brand underline">
            reviews page
          </Link>
          , or start with the{" "}
          <Link to="/shop" className="text-brand underline">
            full range
          </Link>
          .
        </p>
      </section>

      <div className="mt-14 rounded-[32px] bg-gradient-to-br from-brand to-brand-accent text-white p-8 sm:p-10 text-center">
        <h2 className="font-display font-black text-2xl sm:text-3xl">Ready when you are</h2>
        <p className="mt-3 text-white/75 text-sm max-w-md mx-auto">
          Pick your size and fabric online — free UK delivery, At-Door Returns and Next Day Free
          Replacement on every order.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex h-12 items-center rounded-2xl bg-white px-8 text-brand font-black text-sm hover:scale-105 active:scale-95 transition-transform"
        >
          Shop bestsellers
        </Link>
      </div>
    </div>
  );
}
