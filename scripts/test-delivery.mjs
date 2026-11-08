// Delivery engine regression test — runs against the real engine in
// src/lib/delivery-date.ts (Node strips the TypeScript types).
//
// Covers: the 20:00 Europe/London cutoff at 19:59 and 20:01 in both GMT and
// BST, Sunday orders landing on Tuesday, Monday being skipped, and the
// bank-holiday calendar's structural invariants.
import {
  getDeliveryInfo,
  londonParts,
  UK_BANK_HOLIDAYS,
  UK_CUTOFF_HOUR,
} from "../src/lib/delivery-date.ts";

let pass = 0;
let fail = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++;
  else {
    fail++;
    console.log(
      `FAIL  ${name}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`,
    );
  }
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} = ${JSON.stringify(actual)}`);
}

console.log(
  `Device timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone} | cutoff: ${UK_CUTOFF_HOUR}:00 Europe/London\n`,
);

/** A Date whose Europe/London wall clock is y-mo-d hh:mm (BST +1, GMT 0). */
function londonInstant(y, mo, d, hh, mm, offsetHours) {
  return new Date(Date.UTC(y, mo - 1, d, hh - offsetHours, mm, 0));
}

function run(label, y, mo, d, hh, mm, offset) {
  const now = londonInstant(y, mo, d, hh, mm, offset);
  const parts = londonParts(now);
  check(
    `${label} — London wall clock ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    `${parts.year}-${parts.month}-${parts.day} ${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
    `${y}-${mo}-${d} ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
  );
  const info = getDeliveryInfo(now);
  console.log(
    `      -> isBeforeCutoff=${info.isBeforeCutoff} isSunday=${info.isSunday} default=${info.defaultDate.iso} headline="${info.headline}"`,
  );
  return info;
}

// ── GMT (clocks back 25 Oct 2026) — Wed 4 Nov 2026 ──
{
  const before = run("GMT 19:59", 2026, 11, 4, 19, 59, 0);
  check("GMT 19:59 isBeforeCutoff", before.isBeforeCutoff, true);
  check("GMT 19:59 default date", before.defaultDate.iso, "2026-11-05");
  check("GMT 19:59 default is Thursday", before.defaultDate.label, "Thu 5 Nov");
  check("GMT 19:59 headline", /delivered TOMORROW \(Thu 5 Nov\)/.test(before.headline), true);

  const after = run("GMT 20:01", 2026, 11, 4, 20, 1, 0);
  check("GMT 20:01 isBeforeCutoff", after.isBeforeCutoff, false);
  check("GMT 20:01 default date", after.defaultDate.iso, "2026-11-06");
  check("GMT 20:01 default is Friday", after.defaultDate.label, "Fri 6 Nov");
  check("GMT 20:01 headline", after.headline, "Order tonight → arrives Fri 6 Nov");
}

// ── BST (clocks forward 29 Mar 2026) — Wed 8 Jul 2026 ──
// The discriminating pair: 20:01 BST is 19:01 UTC, so a UTC comparison would
// wrongly say "before cutoff". These must fail if the engine stops using London.
{
  const before = run("BST 19:59", 2026, 7, 8, 19, 59, 1);
  check("BST 19:59 isBeforeCutoff", before.isBeforeCutoff, true);
  check("BST 19:59 default date", before.defaultDate.iso, "2026-07-09");
  check("BST 19:59 default is Thursday", before.defaultDate.label, "Thu 9 Jul");

  const after = run("BST 20:01", 2026, 7, 8, 20, 1, 1);
  check("BST 20:01 isBeforeCutoff", after.isBeforeCutoff, false);
  check("BST 20:01 default date", after.defaultDate.iso, "2026-07-10");
  check("BST 20:01 default is Friday", after.defaultDate.label, "Fri 10 Jul");
}

// ── Sunday — 8 Nov 2026 12:00 GMT ──
{
  const sun = run("Sunday 12:00", 2026, 11, 8, 12, 0, 0);
  check("Sunday isSunday", sun.isSunday, true);
  check("Sunday isBeforeCutoff never true", sun.isBeforeCutoff, false);
  check("Sunday default date", sun.defaultDate.iso, "2026-11-10");
  check("Sunday default is Tuesday", sun.defaultDate.label, "Tue 10 Nov");
  check("Sunday headline", sun.headline, "Sunday orders arrive Tuesday");
  check("Sunday headlineLive", sun.headlineLive, "Sunday orders arrive Tuesday");
}

// ── Monday is the weekly off day ──
{
  const tue = run("Tuesday 10:00", 2026, 11, 10, 10, 0, 0);
  check("Tuesday order skips next Monday", tue.defaultDate.iso, "2026-11-11");

  const sat = run("Saturday 12:00", 2026, 11, 7, 12, 0, 0);
  check("Saturday before cutoff lands Sunday", sat.defaultDate.iso, "2026-11-08");
}

// ── Bank holiday calendar invariants ──
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function weekdayOf(isoStr) {
  const [y, m, d] = isoStr.split("-").map(Number);
  return WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

check("holiday count (13 for 2026 + 12 for 2027)", UK_BANK_HOLIDAYS.length, 25);
for (const d of UK_BANK_HOLIDAYS) {
  const wd = weekdayOf(d);
  check(`holiday ${d} is a weekday (got ${wd})`, wd !== "Sat" && wd !== "Sun", true);
}

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

const e26 = easterSunday(2026);
check("Easter 2026 = 5 Apr", `${e26.month}/${e26.day}`, "4/5");
const e27 = easterSunday(2027);
check("Easter 2027 = 28 Mar", `${e27.month}/${e27.day}`, "3/28");
check("Good Friday 2026 hardcoded", weekdayOf("2026-04-03"), "Fri");
check("Easter Monday 2026 hardcoded", weekdayOf("2026-04-06"), "Mon");
check("Good Friday 2027 hardcoded", weekdayOf("2027-03-26"), "Fri");
check("Easter Monday 2027 hardcoded", weekdayOf("2027-03-29"), "Mon");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
