import { createFileRoute, Link } from "@tanstack/react-router";

const ROWS: { label: string; ottoman: string; divan: string }[] = [
  {
    label: "How the storage works",
    ottoman: "The whole base lifts on gas struts, opening one full-size cavity under the mattress.",
    divan: "Drawers are built into the base — one to four of them, along the sides.",
  },
  {
    label: "What fits inside",
    ottoman:
      "Bulk you rarely touch: duvets, suitcases, seasonal clothes, bedding boxes. One deep space.",
    divan:
      "Everyday items you reach for often: clothes, sheets, the things you would normally keep in a chest of drawers.",
  },
  {
    label: "Space you need around it",
    ottoman:
      "Clear air above the foot of the bed so the base can lift. Nothing needed at the sides, so it suits beds tucked into a corner or an alcove.",
    divan: "Room to pull each drawer out at the side — about the depth of the drawer itself.",
  },
  {
    label: "How you reach things",
    ottoman: "One lift, everything visible at once. You lift the base to get to anything.",
    divan: "Open one drawer at a time, without moving the mattress or the bedding.",
  },
  {
    label: "Look",
    ottoman:
      "Upholstered frame and headboard in crushed or plush velvet — a statement bed with hidden storage.",
    divan:
      "The bedroom classic: a low fabric base with a matching headboard, drawers flush to the floor.",
  },
  {
    label: "Price from",
    ottoman: "£350 (Aurora Ottoman Gas-Lift Bed)",
    divan: "£185 (Divan Bed)",
  },
  {
    label: "Sizes",
    ottoman: "3ft single through 6ft super king, with or without a mattress",
    divan: "3ft single through 6ft super king, with or without a mattress",
  },
  {
    label: "Mattress choices",
    ottoman: "Standard comfort (free), memory foam, orthopaedic, 1000 and 2000 pocket sprung",
    divan: "Standard comfort (free), memory foam, orthopaedic, 1000 and 2000 pocket sprung",
  },
  {
    label: "Assembly",
    ottoman: "Self-assembly with tools included; professional assembly can be added at checkout.",
    divan: "Self-assembly with tools included; professional assembly can be added at checkout.",
  },
];

const PICK_OTTOMAN = [
  "You are storing bulky things — duvets, suitcases, boxes — not daily clothes.",
  "The bed will sit against a wall, in an alcove, or flush to a corner where no drawer could open.",
  "You want one big space rather than organizing across two or four smaller ones.",
  "The room is short on floor space and you cannot spare a chest of drawers.",
];

const PICK_DIVAN = [
  "You want clothes or bedsheets within reach every day without lifting a heavy base.",
  "There is clear space beside the bed for drawers to slide open.",
  "You like the low, tidy divan silhouette more than a big upholstered frame.",
  "Budget matters — divan bases start at £185, roughly £165 under the cheapest ottoman.",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is the real difference between an ottoman bed and a divan bed?",
    a: "An ottoman bed lifts as one piece — the mattress base rises on gas struts to reveal a single full-size cavity underneath. A divan bed keeps its storage in side drawers built into the base. Ottoman gives you one deep space for bulky items; divan gives you one to four drawers you can open one at a time.",
  },
  {
    q: "Which stores more?",
    a: "The ottoman. Because the entire area under the mattress is one cavity, it holds more volume than side drawers, which are limited by the depth of the base. Drawers win on organization and quick access, though.",
  },
  {
    q: "Can an ottoman bed go against a wall?",
    a: "Yes, as long as the foot of the bed has clear space above it for the base to lift. The sides can sit against a wall — that is exactly where a divan's drawers could not open.",
  },
  {
    q: "Do both take the same mattress?",
    a: "Yes. Both are offered in 3ft single to 6ft super king, with the same mattress choices — standard comfort included free, plus memory foam, orthopaedic, 1000 pocket sprung and 2000 pocket sprung.",
  },
  {
    q: "How much do they cost?",
    a: "Divan bases start at £185 and ottoman beds start at £350 at the time of writing. Live prices for every size are on each product page — free UK delivery either way.",
  },
];

export const Route = createFileRoute("/guides/ottoman-vs-divan")({
  head: () => ({
    meta: [
      { title: "Ottoman vs Divan Bed — Which Storage Bed Is Right for You? | AQ Beds" },
      {
        name: "description",
        content:
          "Ottoman vs divan: how each storage bed works, what fits inside, real prices from £185, how to choose. Free UK delivery. Cash on delivery available.",
      },
      {
        property: "og:title",
        content: "Ottoman vs Divan Bed — Which Storage Bed Is Right for You? | AQ Beds",
      },
      {
        property: "og:description",
        content:
          "Storage type, space needed, prices from £185 and a simple way to choose between an ottoman and a divan bed.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/all%20products%20img/Divan%20Ottoman%20bed/1.webp",
      },
      {
        property: "og:url",
        content: "https://www.aqbeds.com/guides/ottoman-vs-divan",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Ottoman vs Divan Bed — which storage bed is right?" },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/all%20products%20img/Divan%20Ottoman%20bed/1.webp",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/guides/ottoman-vs-divan" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Ottoman vs divan bed: how to choose a storage bed",
          url: "https://www.aqbeds.com/guides/ottoman-vs-divan",
          publisher: { "@type": "Organization", name: "AQ Beds" },
        }),
      },
    ],
  }),
  component: OttomanVsDivanPage,
});

function OttomanVsDivanPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 animate-fade-in">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand/60 mb-3">
        Buying guides
      </p>
      <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight">
        Ottoman vs divan: which storage bed is right for you?
      </h1>
      <p className="mt-5 text-muted-foreground leading-relaxed">
        Both hide storage under your mattress, and both come in the same UK sizes with the same
        mattress choices. The difference is how you reach what is inside — and that decides which
        one belongs in your room. Here is the honest comparison, with the real prices on this site
        today.
      </p>

      <section className="mt-12" aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="font-display font-black text-2xl mb-6">
          Side by side
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 text-left">
                <th scope="col" className="px-4 py-3 font-bold w-1/4">
                  &nbsp;
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Ottoman bed
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Divan bed
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-3 font-semibold text-left">
                    {r.label}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{r.ottoman}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.divan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Prices shown are the entry price for each style and can change with size, fabric and
          options — check the product page for the live figure.
        </p>
      </section>

      <section className="mt-14 grid sm:grid-cols-2 gap-6" aria-label="How to choose">
        <div className="rounded-[28px] border border-border bg-card p-6">
          <h2 className="font-display font-black text-xl mb-4">Choose an ottoman if…</h2>
          <ul className="space-y-3">
            {PICK_OTTOMAN.map((t) => (
              <li key={t} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="text-brand font-black" aria-hidden="true">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Link
            to="/category/$slug"
            params={{ slug: "ottoman-beds" }}
            className="mt-5 inline-flex h-11 items-center rounded-2xl bg-brand text-brand-foreground px-6 text-sm font-black hover:opacity-90 transition-opacity"
          >
            Shop ottoman beds
          </Link>
        </div>
        <div className="rounded-[28px] border border-border bg-card p-6">
          <h2 className="font-display font-black text-xl mb-4">Choose a divan if…</h2>
          <ul className="space-y-3">
            {PICK_DIVAN.map((t) => (
              <li key={t} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="text-brand font-black" aria-hidden="true">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Link
            to="/category/$slug"
            params={{ slug: "divan-beds" }}
            className="mt-5 inline-flex h-11 items-center rounded-2xl bg-brand text-brand-foreground px-6 text-sm font-black hover:opacity-90 transition-opacity"
          >
            Shop divan beds
          </Link>
        </div>
      </section>

      <section className="mt-14 rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8">
        <h2 className="font-display font-black text-xl mb-4">One more thing to measure</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          Storage is only useful if the bed fits. Measure the room, the doorways and the tightest
          stair turn before you order — and leave about 60 cm beside the bed if you are leaning
          towards drawers.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/size-guide"
            className="inline-flex h-11 items-center rounded-2xl bg-cta text-cta-foreground px-6 text-sm font-black hover:opacity-90 transition-opacity"
          >
            Open the size guide
          </Link>
          <Link
            to="/shop"
            className="inline-flex h-11 items-center rounded-2xl border border-border px-6 text-sm font-bold hover:border-brand/40 transition-colors"
          >
            Browse all beds
          </Link>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-display font-black text-2xl mb-6">
          Quick answers
        </h2>
        <dl className="space-y-6">
          {FAQS.map((f) => (
            <div key={f.q}>
              <dt className="font-bold text-base">{f.q}</dt>
              <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
