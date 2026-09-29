import { createFileRoute, Link } from "@tanstack/react-router";

const SIZES = [
  { label: "Small single", imperial: "2 ft 6 in × 6 ft 3 in", cm: "75 × 190 cm", pct: 75 },
  { label: "Single", imperial: "3 ft × 6 ft 3 in", cm: "90 × 190 cm", pct: 90 },
  { label: "Small double", imperial: "4 ft × 6 ft 3 in", cm: "120 × 190 cm", pct: 120 },
  { label: "Double", imperial: "4 ft 6 in × 6 ft 3 in", cm: "135 × 190 cm", pct: 135 },
  { label: "King", imperial: "5 ft × 6 ft 6 in", cm: "150 × 200 cm", pct: 150 },
  { label: "Super king", imperial: "6 ft × 6 ft 6 in", cm: "180 × 200 cm", pct: 180 },
];

const CONFIGURATOR_SIZES: { label: string; matches: string }[] = [
  {
    label: "2ft Small Single",
    matches: "Our smallest size — the product page lists its exact width",
  },
  { label: "3ft Standard Single", matches: "Single · 90 × 190 cm" },
  { label: "4ft Small Double", matches: "Small double · 120 × 190 cm" },
  { label: "4'6ft Standard Double", matches: "Double · 135 × 190 cm" },
  { label: "5ft King Size", matches: "King · 150 × 200 cm" },
  { label: "6ft Super King", matches: "Super king · 180 × 200 cm" },
];

const CHECKLIST = [
  "Measure the room floor to floor, wall to wall, in centimetres — do not trust a floorplan or an estate agent's photo.",
  "Leave about 60 cm between the bed and any wall, wardrobe or drawer so you can walk and make the bed.",
  "Measure the front door, internal doors and the tightest stair turn. Storage beds travel in panels, so the turn matters more than the doorway.",
  "For ottoman beds, check the space above the foot of the bed — the base lifts up and needs clear air above it.",
  "Check the headboard height against radiators, windows and sloping ceilings.",
  "Write down the room size, then compare it with the frame size below before you order.",
];

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "UK Bed Size Guide — cm, ft & Inches | AQ Beds" },
      {
        name: "description",
        content:
          "UK bed and mattress sizes in cm and ft/in, a room-measurement checklist and configurator size labels. Free UK delivery. Cash on delivery available.",
      },
      { property: "og:title", content: "UK Bed Size Guide — cm, ft & Inches | AQ Beds" },
      {
        property: "og:description",
        content:
          "UK bed and mattress sizes in cm and ft/in, plus a room-measurement checklist before you order.",
      },
      {
        property: "og:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
      { property: "og:url", content: "https://www.aqbeds.com/size-guide" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "UK Bed Size Guide — cm, ft & Inches | AQ Beds" },
      {
        name: "twitter:image",
        content: "https://www.aqbeds.com/Home%20page%20images/1000152185-clean.webp",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.aqbeds.com/size-guide" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "UK Bed Size Guide",
          url: "https://www.aqbeds.com/size-guide",
          description:
            "UK bed and mattress sizes in centimetres and feet/inches, with a room-measurement checklist.",
        }),
      },
    ],
  }),
  component: SizeGuidePage,
});

function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 animate-fade-in">
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand/60 mb-3">
        Buying guides
      </p>
      <h1 className="font-display font-black text-4xl sm:text-5xl leading-tight">
        UK bed &amp; mattress size guide
      </h1>
      <p className="mt-5 text-muted-foreground leading-relaxed">
        Size is the number one reason people delay buying a bed online. Measure once, compare the
        numbers below, and pick the same size in step 3 of the configurator — every frame on this
        site lists the sizes it takes.
      </p>

      {/* Visual width chart */}
      <section className="mt-12" aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="font-display font-black text-2xl mb-6">
          How wide each size is
        </h2>
        <div className="space-y-4">
          {SIZES.map((s) => (
            <div key={s.label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-bold">{s.label}</span>
                <span className="text-xs text-muted-foreground font-semibold">
                  {s.cm} · {s.imperial}
                </span>
              </div>
              <div className="h-7 rounded-lg bg-muted overflow-hidden" aria-hidden="true">
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-brand to-brand-accent"
                  style={{ width: `${(s.pct / 180) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Bars are drawn to scale against the widest size (super king, 180 cm).
        </p>
      </section>

      {/* Dimensions table */}
      <section className="mt-14" aria-labelledby="table-heading">
        <h2 id="table-heading" className="font-display font-black text-2xl mb-6">
          Every size in one table
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/60 text-left">
                <th scope="col" className="px-4 py-3 font-bold">
                  Size
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Width × length (ft/in)
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Width × length (cm)
                </th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map((s) => (
                <tr key={s.label} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{s.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.imperial}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Standard UK dimensions. A double mattress on a double frame should measure 135 × 190 cm
          exactly — a few centimetres either way means it is the wrong size.
        </p>
      </section>

      {/* Configurator mapping */}
      <section className="mt-14" aria-labelledby="labels-heading">
        <h2 id="labels-heading" className="font-display font-black text-2xl mb-6">
          What our configurator calls each size
        </h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {CONFIGURATOR_SIZES.map((c) => (
            <li
              key={c.label}
              className="rounded-2xl border border-border bg-card p-4 flex items-baseline justify-between gap-3"
            >
              <span className="text-sm font-bold">{c.label}</span>
              <span className="text-xs text-muted-foreground text-right">{c.matches}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Mattress-included options use a mattress cut to the frame size you pick, so "With
          mattress" and "Without mattress" change the price, never the fit. Bunk beds list their own
          compatible sizes on the product page.
        </p>
        <Link
          to="/shop"
          className="mt-5 inline-flex h-11 items-center rounded-2xl bg-brand text-brand-foreground px-6 text-sm font-black hover:opacity-90 transition-opacity"
        >
          Shop by size
        </Link>
      </section>

      {/* Checklist */}
      <section className="mt-14" aria-labelledby="checklist-heading">
        <h2 id="checklist-heading" className="font-display font-black text-2xl mb-6">
          Measure your room first
        </h2>
        <ol className="space-y-4">
          {CHECKLIST.map((item, i) => (
            <li key={i} className="flex gap-4">
              <span
                className="shrink-0 w-8 h-8 rounded-full bg-brand/10 text-brand font-black text-sm grid place-items-center"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed pt-1">{item}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ-style reassurance */}
      <section className="mt-14 rounded-[32px] border border-brand/10 bg-brand/[0.03] p-8">
        <h2 className="font-display font-black text-xl mb-4">Still not sure?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          Send us your room measurements on WhatsApp and we will tell you which size fits before you
          order. Every bed comes with free UK delivery and Next Day Free Replacement, so a wrong
          guess is never final.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/contact"
            className="inline-flex h-11 items-center rounded-2xl bg-cta text-cta-foreground px-6 text-sm font-black hover:opacity-90 transition-opacity"
          >
            Ask us
          </Link>
          <Link
            to="/faqs"
            className="inline-flex h-11 items-center rounded-2xl border border-border px-6 text-sm font-bold hover:border-brand/40 transition-colors"
          >
            Read the FAQs
          </Link>
        </div>
      </section>
    </div>
  );
}
