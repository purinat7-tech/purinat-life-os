/**
 * Guard against sensitive data in the public JSON.
 * Errors (block publishing): e-mail addresses, phone numbers, payment-card numbers,
 *   and keys that look like passport / booking / flight / address / contact / payment fields.
 * Warnings (please check): text that looks like a flight number, booking reference or passport number.
 * Camera/lens fields, ids, URLs and file paths are not scanned for the warning patterns.
 */

export interface Finding {
  level: 'error' | 'warning';
  path: string;
  message: string;
}

const FORBIDDEN_KEY = /passport|booking|reservation|pnr|flight|ticket|seat|address|phone|mobile|e-?mail|contact|payment|card_?number|credit|iban|bank/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_INTL = /\+\d{1,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}/;
const PHONE_TH = /(?<![\d-])0[689]\d[\s-]?\d{3}[\s-]?\d{4}(?![\d-])|(?<![\d-])0\d[\s-]\d{3}[\s-]\d{4}(?![\d-])/;
const CARD_CANDIDATE = /(?:\d[ -]?){13,19}/g;
const FLIGHT = /\b(?:[A-Z]{2}|[A-Z]\d|\d[A-Z])\s?\d{2,4}\b/;
const PNR = /\b(?=[A-Z0-9]{6}\b)(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6}\b/;
const PASSPORT = /\b[A-Z]{1,2}\d{6,8}\b/;

const SKIP_WARNING_KEYS = new Set(['id', 'camera', 'lens', 'photo', 'coord_source', '$schema', 'trip_id', 'hero_place_id', 'session_id', 'library_id', 'backup_of', 'tag']);
const SKIP_ALL_KEYS = new Set(['$schema', 'coord_source', 'photo']);

function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function scanString(value: string, path: string, key: string, out: Finding[]): void {
  if (SKIP_ALL_KEYS.has(key)) return;
  if (EMAIL.test(value)) out.push({ level: 'error', path, message: 'looks like an e-mail address (contact details must not be published)' });
  if (PHONE_INTL.test(value) || PHONE_TH.test(value)) out.push({ level: 'error', path, message: 'looks like a phone number (contact details must not be published)' });
  for (const m of value.matchAll(CARD_CANDIDATE)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhn(digits)) {
      out.push({ level: 'error', path, message: 'looks like a payment card number' });
      break;
    }
  }
  if (SKIP_WARNING_KEYS.has(key)) return;
  const flight = FLIGHT.exec(value);
  if (flight) out.push({ level: 'warning', path, message: `"${flight[0]}" may be a flight number; remove it if it is one` });
  const pnr = PNR.exec(value);
  if (pnr) out.push({ level: 'warning', path, message: `"${pnr[0]}" may be a booking reference; remove it if it is one` });
  const passport = PASSPORT.exec(value);
  if (passport) out.push({ level: 'warning', path, message: `"${passport[0]}" may be a passport number; remove it if it is one` });
}

export function scanSensitive(value: unknown, path = '$', key = ''): Finding[] {
  const out: Finding[] = [];
  const walk = (v: unknown, p: string, k: string) => {
    if (typeof v === 'string') scanString(v, p, k, out);
    else if (Array.isArray(v)) v.forEach((item, i) => walk(item, `${p}[${i}]`, k));
    else if (v && typeof v === 'object') {
      for (const [childKey, child] of Object.entries(v)) {
        if (FORBIDDEN_KEY.test(childKey)) out.push({ level: 'error', path: `${p}.${childKey}`, message: `field name "${childKey}" suggests sensitive data, which must not be stored` });
        walk(child, `${p}.${childKey}`, childKey);
      }
    }
  };
  walk(value, path, key);
  return out;
}
