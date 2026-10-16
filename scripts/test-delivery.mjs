import { getDeliveryWindow, londonParts, UK_BANK_HOLIDAYS } from "../src/lib/delivery-date.ts";

let pass = 0;
let fail = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) console.log(`      expected: ${expected}\n      actual:   ${actual}`);
}

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function windowFor(y, mo, d, hourLondon, utcOffsetHours) {
  // Build a Date whose Europe/London wall-clock time is y-mo-d hourLondon.
  const now = new Date(Date.UTC(y, mo - 1, d, hourLondon - utcOffsetHours, 0, 0));
  const parts = londonParts(now);
  check(
    `setup: London wall-clock is ${y}-${mo}-${d} ${hourLondon}:00`,
    `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")} ${String(parts.hour).padStart(2, "0")}`,
    `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(hourLondon).padStart(2, "0")}`,
  );
  return getDeliveryWindow(now);
}

function weekdayOf(isoStr) {
  const [y, m, d] = isoStr.split("-").map(Number);
  return WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

// BST in October 2026 until clocks go back on 25 Oct → offset +1 for these dates.
// ── Required test cases ──
{
  const w = windowFor(2026, 10, 21, 10, 1); // Wed 10:00
  check("Wed 10:00 → Thu–Fri (label)", w.label, "Arrives: 22–23 Oct");
  check("Wed 10:00 → first is Thu", weekdayOf(w.firstISO), "Thu");
  check("Wed 10:00 → second is Fri", weekdayOf(w.secondISO), "Fri");
}
{
  const w = windowFor(2026, 10, 21, 19, 1); // Wed 19:00 (after 18:00 cutoff)
  check("Wed 19:00 → Fri–Mon (label)", w.label, "Arrives: 23–26 Oct");
  check("Wed 19:00 → first is Fri", weekdayOf(w.firstISO), "Fri");
  check("Wed 19:00 → second is Mon", weekdayOf(w.secondISO), "Mon");
}
{
  const w = windowFor(2026, 10, 23, 17, 1); // Fri 17:00 (before cutoff)
  check("Fri 17:00 → Mon–Tue (label)", w.label, "Arrives: 26–27 Oct");
  check("Fri 17:00 → first is Mon", weekdayOf(w.firstISO), "Mon");
  check("Fri 17:00 → second is Tue", weekdayOf(w.secondISO), "Tue");
}
{
  const w = windowFor(2026, 10, 23, 19, 1); // Fri 19:00 (after cutoff)
  check("Fri 19:00 → Tue–Wed (label)", w.label, "Arrives: 27–28 Oct");
  check("Fri 19:00 → first is Tue", weekdayOf(w.firstISO), "Tue");
  check("Fri 19:00 → second is Wed", weekdayOf(w.secondISO), "Wed");
}

// ── Never lands on a weekend or bank holiday (Christmas period hard case) ──
{
  const w = windowFor(2026, 12, 23, 10, 0); // Wed 23 Dec 2026, GMT
  check("Wed 23 Dec 10:00 skips Christmas + substitutes (label)", w.label, "Arrives: 24–30 Dec");
  check(
    "Christmas Day excluded",
    UK_BANK_HOLIDAYS.includes("2026-12-25") && w.secondISO === "2026-12-30",
    true,
  );
}

// ── Hardcoded holiday list sanity: every entry is a weekday ──
for (const d of UK_BANK_HOLIDAYS) {
  const wd = weekdayOf(d);
  check(`holiday ${d} is a weekday (got ${wd})`, wd !== "Sat" && wd !== "Sun", true);
}
check("holiday count (13 for 2026 + 12 for 2027)", UK_BANK_HOLIDAYS.length, 25);

// ── Easter sanity (Good Friday / Easter Monday are Easter-derived) ──
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
