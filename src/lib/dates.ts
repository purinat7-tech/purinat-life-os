/**
 * Calendar-date helpers. Dates are ISO strings (YYYY-MM-DD) and are handled as
 * whole days (UTC day numbers), so results never depend on the viewer's clock offset.
 */

export const SITE_TIME_ZONE = 'Asia/Bangkok';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** Day number since 1970-01-01. Throws on invalid input. */
export function dayNumber(iso: string): number {
  if (!isIsoDate(iso)) throw new Error(`Invalid ISO date: ${iso}`);
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNumber(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromDayNumber(dayNumber(iso) + days);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

/** Inclusive number of calendar days in a range (8 Oct to 20 Oct = 13). */
export function daysInclusive(start: string, end: string): number {
  return diffDays(start, end) + 1;
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndex(iso: string): number {
  // 1970-01-01 was a Thursday (index 3).
  return (((dayNumber(iso) + 3) % 7) + 7) % 7;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

/** Today's date in the site's time zone (Bangkok by default). */
export function todayIso(now: Date = new Date(), timeZone: string = SITE_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthName(month: number, style: 'short' | 'long' = 'long'): string {
  return (style === 'short' ? MONTHS_SHORT : MONTHS_LONG)[month - 1] ?? '';
}

/** "8 Oct 2026" */
export function formatDate(iso: string): string {
  if (!isIsoDate(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${d} ${monthName(m, 'short')} ${y}`;
}

/** "8–20 Oct 2026", "28 Sep – 3 Oct 2026", "30 Dec 2026 – 2 Jan 2027" */
export function formatRange(start: string, end: string): string {
  if (!isIsoDate(start) || !isIsoDate(end)) return 'Dates TODO';
  const [ys, ms, ds] = start.split('-').map(Number) as [number, number, number];
  const [ye, me, de] = end.split('-').map(Number) as [number, number, number];
  if (start === end) return formatDate(start);
  if (ys === ye && ms === me) return `${ds}–${de} ${monthName(me, 'short')} ${ye}`;
  if (ys === ye) return `${ds} ${monthName(ms, 'short')} – ${de} ${monthName(me, 'short')} ${ye}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/** "2027-05" -> "May 2027" */
export function formatMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  return `${monthName(m)} ${y}`;
}

export function formatShortMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  return `${monthName(m, 'short')} ${String(y).slice(2)}`;
}

/** Shifts a YYYY-MM key by n months. */
export function addMonths(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number) as [number, number];
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}
