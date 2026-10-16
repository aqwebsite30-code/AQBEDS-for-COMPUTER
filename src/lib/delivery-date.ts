export type ArrivalWindow = {
  label: string;
  firstISO: string;
  secondISO: string;
};

/**
 * Hardcoded UK bank holidays — UNION of England & Wales + Scotland +
 * Northern Ireland (every bank holiday observed by any of the three nations),
 * so no order can land on a bank holiday anywhere in the UK.
 *
 * ⚠️ YEAR ROLL FLAG: covers all of 2026 and all of 2027 only.
 * Extend this list before 1 Jan 2028 (Good Friday/Easter dates move each year).
 */
export const UK_BANK_HOLIDAYS: readonly string[] = [
  // ── 2026 ──
  "2026-01-01", // New Year's Day (Thu) — all nations
  "2026-01-02", // 2 Jan (Fri) — Scotland
  "2026-03-17", // St Patrick's Day (Tue) — Northern Ireland
  "2026-04-03", // Good Friday — all nations
  "2026-04-06", // Easter Monday — England & Wales, Northern Ireland
  "2026-05-04", // Early May bank holiday (Mon) — all nations
  "2026-05-25", // Spring bank holiday (Mon) — all nations
  "2026-07-13", // Battle of the Boyne observed (Mon 12 Jul is Sun) — Northern Ireland
  "2026-08-03", // Summer bank holiday (Mon) — Scotland
  "2026-08-31", // Summer bank holiday (Mon) — England & Wales, Northern Ireland
  "2026-12-25", // Christmas Day (Fri) — all nations
  "2026-12-28", // Boxing Day substitute (26 Sat → Mon) — all nations
  "2026-12-29", // St Stephen's Day substitute (27 Sun → Tue) — Northern Ireland
  // ── 2027 ──
  "2027-01-01", // New Year's Day (Fri) — all nations
  "2027-01-04", // 2 Jan substitute (2 Sat → Mon) — Scotland
  "2027-03-17", // St Patrick's Day (Wed) — Northern Ireland
  "2027-03-26", // Good Friday — all nations
  "2027-03-29", // Easter Monday — England & Wales, Northern Ireland
  "2027-05-03", // Early May bank holiday (Mon) — all nations
  "2027-05-31", // Spring bank holiday (Mon) — all nations
  "2027-07-12", // Battle of the Boyne (Mon) — Northern Ireland
  "2027-08-02", // Summer bank holiday (Mon) — Scotland
  "2027-08-30", // Summer bank holiday (Mon) — England & Wales, Northern Ireland
  "2027-12-27", // Christmas Day substitute (25 Sat → Mon) — all nations
  "2027-12-28", // St Stephen's Day substitute (26 Sun → Tue) — Northern Ireland
];

const HOLIDAYS = new Set<string>(UK_BANK_HOLIDAYS);

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

export type LondonParts = { year: number; month: number; day: number; hour: number };

export function londonParts(now: Date): LondonParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(now)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour,
  };
}

function iso(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function addDays(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

function isWeekend(dateISO: string): boolean {
  const [y, m, d] = dateISO.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 || wd === 6;
}

function isWorkingDay(dateISO: string): boolean {
  return !isWeekend(dateISO) && !HOLIDAYS.has(dateISO);
}

/** First working day strictly after `dateISO` (Mon–Fri, excludes bank holidays). */
function nextWorkingDay(dateISO: string): string {
  let d = dateISO;
  for (let i = 0; i < 40; i++) {
    d = addDays(d, 1);
    if (isWorkingDay(d)) return d;
  }
  return d;
}

/** `n` working days strictly after `dateISO`. */
function addWorkingDays(dateISO: string, n: number): string {
  let d = dateISO;
  for (let i = 0; i < n; i++) d = nextWorkingDay(d);
  return d;
}

function formatRange(firstISO: string, secondISO: string): string {
  const [, fm, fd] = firstISO.split("-").map(Number);
  const [, sm, sd] = secondISO.split("-").map(Number);
  const fMonth = MONTH_SHORT[fm - 1];
  const sMonth = MONTH_SHORT[sm - 1];
  return fm === sm ? `${fd}–${sd} ${fMonth}` : `${fd} ${fMonth}–${sd} ${sMonth}`;
}

/**
 * Delivery window shown above "Place Order".
 *
 * Cutoff 18:00 UK:
 *  - before 18:00 → arrives the next working day;
 *  - at/after 18:00 → arrives the working day after that (next working day + 1).
 * Both displayed dates are consecutive working days; weekends and every UK
 * bank holiday (union of England & Wales, Scotland, Northern Ireland) are
 * excluded — Sat, Sun and bank holidays are never shown.
 */
export function getDeliveryWindow(now: Date): ArrivalWindow {
  const { year, month, day, hour } = londonParts(now);
  const today = iso(year, month, day);
  const earliest = hour < 18 ? nextWorkingDay(today) : addWorkingDays(nextWorkingDay(today), 1);
  const latest = nextWorkingDay(earliest);
  return {
    label: `Arrives: ${formatRange(earliest, latest)}`,
    firstISO: earliest,
    secondISO: latest,
  };
}
