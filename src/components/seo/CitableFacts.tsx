/**
 * Citable facts block (Phase J6).
 *
 * A short, plain-sentence summary of the facts an AI answer engine can quote
 * without paraphrasing: sizes, materials, delivery window, payment, guarantee,
 * coverage. Server-rendered, so it is present in the raw HTML.
 *
 * Every string here must stay true operationally. Nothing in this file may
 * mention a discount, a gift or a bundle.
 */

export type CitableFact = { label: string; value: string };

export const DELIVERY_FACT =
  "Free UK delivery. Orders confirmed Monday to Saturday before 20:00 UK time are delivered the next day; Sunday orders arrive Tuesday. Monday and UK bank holidays are not delivery days.";

export const PAYMENT_FACT =
  "Cash on delivery only. Nothing is paid online — the item is inspected at the door and paid for then.";

export const GUARANTEE_FACT =
  "Every item is inspected at the door before payment. A fault reported at delivery, or within 24 hours, is replaced free with next-day delivery.";

export const COVERAGE_FACT =
  "Delivered across the UK, including Scotland, Wales and Northern Ireland.";

/**
 * Distinct base size names, e.g. "3ft Standard Single – With Mattress" becomes
 * "3ft Standard Single". Keeps the block short and quotable.
 */
export function sizeNames(sizes: { name: string }[]): string[] {
  const seen = new Set<string>();
  for (const size of sizes) {
    const base = size.name.split("–")[0].trim();
    if (base) seen.add(base);
  }
  return [...seen];
}

/** What the size list on the page says about the mattress. */
export function mattressFact(sizes: { name: string }[]): string | null {
  const withMattress = sizes.some((s) => /with mattress/i.test(s.name));
  const withoutMattress = sizes.some((s) => /no mattress/i.test(s.name));
  if (withMattress && withoutMattress) {
    return "Included on some sizes and optional on others — the size list on this page states which.";
  }
  if (withMattress) return "Included with every size listed.";
  return null;
}

/**
 * Materials wording per category family. Both sentences restate copy that is
 * already published on the category pages and the FAQs; neither invents a
 * material for a model that does not use it.
 */
export function materialsFact(categorySlug: string): string {
  if (categorySlug === "wardrobes" || categorySlug === "sliding-wardrobes") {
    return "Supplied flat-packed with adjustable rails and shelving; the finish options for this model are listed on this page.";
  }
  return "Frames are solid timber and engineered wood, upholstered in velvet or soft-touch fabric; the colour list on this page shows the finishes offered for this model.";
}

export function CitableFacts({
  facts,
  heading = "Key facts",
}: {
  facts: CitableFact[];
  heading?: string;
}) {
  if (!facts.length) return null;

  return (
    <section
      data-testid="citable-facts"
      aria-labelledby="citable-facts-heading"
      className="mt-8 rounded-2xl border border-border bg-card/60 p-5 sm:p-6"
    >
      <h2
        id="citable-facts-heading"
        className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground"
      >
        {heading}
      </h2>
      <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-[11px] font-bold uppercase tracking-widest text-brand">
              {fact.label}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
