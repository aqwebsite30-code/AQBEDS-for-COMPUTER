// T1 delivery-engine acceptance harness — tests 1–5 of the owner's brief.
// Runs the REAL src/lib/delivery-date.ts (Node 22 type stripping) against a
// frozen set of instants, each offset for Europe/London (BST = UTC+1 until
// 2026-10-25 01:00, then GMT).
//
//   node scripts/test-delivery-engine.mjs
import assert from "node:assert/strict";

const eng = await import(new URL("../src/lib/delivery-date.ts", import.meta.url).href);
const { getDeliveryInfo, isSelectableDeliveryDate, formatDeliveryDate } = eng;

let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  try {
    assert.equal(actual, expected);
    passed++;
    console.log(`  PASS  ${name}`);
  } catch {
    failed++;
    console.log(
      `  FAIL  ${name}\n        expected: ${JSON.stringify(expected)}\n        actual:   ${JSON.stringify(actual)}`,
    );
  }
}

// BST helper: UK was on BST (UTC+1) for all summer 2026 instants.
const bst = (month, day, hour, minute = 0) =>
  new Date(Date.UTC(2026, month - 1, day, hour - 1, minute, 0));
// GMT helper: after clocks fall back 2026-10-25 01:00 BST → GMT (UTC+0).
const gmt = (month, day, hour, minute = 0) =>
  new Date(Date.UTC(2026, month - 1, day, hour, minute, 0));

console.log("\nTEST 1 — Sat 24 Oct 19:00 UK (before cutoff) → next day Sun 25 Oct");
{
  const i = getDeliveryInfo(bst(10, 24, 19, 0));
  check("before cutoff", i.isBeforeCutoff, true);
  check("default date iso", i.defaultDate.iso, "2026-10-25");
  check("default label", i.defaultDate.label, "Sun 25 Oct");
  check("headline exact", i.headline, "⏱ Order within 1h 0m → delivered TOMORROW (Sun 25 Oct)");
  check(
    "static headline exact",
    i.headlineStatic,
    "Order before 8 PM UK → delivered TOMORROW (Sun 25 Oct)",
  );
  check("window line", i.windowLine, "📱 We'll text you a 2-hour delivery window");
  check("selectable", isSelectableDeliveryDate("2026-10-25"), true);
  check("monday not selectable", isSelectableDeliveryDate("2026-10-26"), false);
}

console.log("\nTEST 1b — Sat 24 Oct 17:46 UK (owner's countdown example 2h 14m)");
{
  const i = getDeliveryInfo(bst(10, 24, 17, 46));
  check("countdown", i.cutoffCountdown, "2h 14m");
  check("headline exact", i.headline, "⏱ Order within 2h 14m → delivered TOMORROW (Sun 25 Oct)");
  check("live countdown has seconds", i.cutoffCountdownLive, "2h 14m 0s");
}

console.log("\nTEST 2 — Sat 24 Oct 21:00 UK (after cutoff) → effective Sun 25 → Mon off → Tue 27");
{
  const i = getDeliveryInfo(bst(10, 24, 21, 0));
  check("after cutoff", i.isBeforeCutoff, false);
  check("default date iso", i.defaultDate.iso, "2026-10-27");
  check("default label", i.defaultDate.label, "Tue 27 Oct");
  check("headline exact", i.headline, "Order tonight → arrives Tue 27 Oct");
}

console.log("\nTEST 3 — Sun 25 Oct 09:00 UK (Sunday, RULE C + E)");
{
  const i = getDeliveryInfo(gmt(10, 25, 9, 0));
  check("is sunday", i.isSunday, true);
  check("before cutoff false on sunday", i.isBeforeCutoff, false);
  check(
    "headline exact",
    i.headline,
    "Sunday orders arrive Tuesday or Thursday — Monday is our off day",
  );
  check("default date iso", i.defaultDate.iso, "2026-10-27");
  check("sunday option", i.sundayOption, "Tue or Thu");
  check("monday unselectable", isSelectableDeliveryDate("2026-10-26"), false);
  check("tuesday selectable", isSelectableDeliveryDate("2026-10-27"), true);
  check(
    "before earliest unselectable",
    isSelectableDeliveryDate("2026-10-25", "2026-10-27"),
    false,
  );
  check("2026-11-02 is Monday → unselectable", isSelectableDeliveryDate("2026-11-02"), false);
  check("garbage unselectable", isSelectableDeliveryDate("not-a-date"), false);
}

console.log("\nTEST 4 — Mon 26 Oct 10:00 UK (before cutoff) → Tue 27 Oct");
{
  const i = getDeliveryInfo(bst(10, 26, 10, 0));
  check("before cutoff", i.isBeforeCutoff, true);
  check("default date iso", i.defaultDate.iso, "2026-10-27");
  check("default label", i.defaultDate.label, "Tue 27 Oct");
}

console.log("\nTEST 4b — Mon 26 Oct 21:00 UK (after cutoff) → effective Tue 27 → Wed 28");
{
  const i = getDeliveryInfo(bst(10, 26, 21, 0));
  check("default date iso", i.defaultDate.iso, "2026-10-28");
}

console.log("\nTEST 4c — Fri 23 Oct 19:00 UK (before cutoff) → Sat 24 Oct");
{
  const i = getDeliveryInfo(bst(10, 23, 19, 0));
  check("default date iso", i.defaultDate.iso, "2026-10-24");
}

console.log("\nTEST 5 — bank holidays slide forward (RULE D)");
{
  // Summer bank holiday Mon 31 Aug 2026: Sun 30 Aug order → effective Mon 31 (BH) → Tue 1 Sep.
  const sundayBeforeBH = getDeliveryInfo(bst(8, 30, 12, 0));
  check("sun 30 Aug → Tue 1 Sep (BH Mon slides)", sundayBeforeBH.defaultDate.iso, "2026-09-01");

  // Good Friday Fri 3 Apr 2026: order Thu 2 Apr before cutoff → first delivery day after Thu 2 = Sat 4 (Fri BH, then Easter Mon BH).
  const beforeGoodFriday = getDeliveryInfo(bst(4, 2, 10, 0));
  check(
    "thu 2 Apr → Sat 4 Apr (Good Friday slides)",
    beforeGoodFriday.defaultDate.iso,
    "2026-04-04",
  );

  check("Good Friday unselectable", isSelectableDeliveryDate("2026-04-03"), false);
  check("Easter Monday unselectable", isSelectableDeliveryDate("2026-04-06"), false);
  check("Sat 4 Apr selectable", isSelectableDeliveryDate("2026-04-04"), true);

  // Sat after cutoff on a BH weekend: Sat 4 Apr 21:00 → effective Sun 5 → Easter Mon BH → Tue 7.
  const satAfterCutoffBH = getDeliveryInfo(bst(4, 4, 21, 0));
  check("sat 4 Apr 21:00 → Tue 7 Apr", satAfterCutoffBH.defaultDate.iso, "2026-04-07");
}

console.log("\nTEST 6 — label/format helpers (UTC-safe)");
{
  check("formatDeliveryDate", formatDeliveryDate("2026-12-25"), "Fri 25 Dec");
  const afterCutoff = getDeliveryInfo(bst(10, 24, 21, 0));
  check("after-cutoff static == live headline", afterCutoff.headlineStatic, afterCutoff.headline);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
