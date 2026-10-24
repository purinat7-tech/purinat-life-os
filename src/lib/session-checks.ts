/**
 * Checks on Session Cards that JSON Schema cannot express.
 * Used by the import tool (browser) and by `npm run validate:data` (Node).
 */
import type { Session } from './types.ts';
import { isIsoDate } from './dates.ts';
import { scanSensitive, type Finding } from './sensitive.ts';

export function checkSessions(cards: Session[], existing: Session[], today: string, basePath = '$'): Finding[] {
  const out: Finding[] = [];
  const existingIds = new Set(existing.map((s) => s.id));
  const seen = new Set<string>();
  cards.forEach((card, i) => {
    const p = `${basePath}[${i}]`;
    if (typeof card.id === 'string' && typeof card.date === 'string' && !card.id.startsWith(`${card.date}-`)) {
      out.push({ level: 'error', path: `${p}.id`, message: `id "${card.id}" must start with the session date (${card.date}-NNN)` });
    }
    if (seen.has(card.id)) out.push({ level: 'error', path: `${p}.id`, message: `duplicate id "${card.id}"` });
    else if (existingIds.has(card.id)) out.push({ level: 'error', path: `${p}.id`, message: `id "${card.id}" already exists in sessions.json` });
    seen.add(card.id);
    if (isIsoDate(card.date) && card.date > today) out.push({ level: 'warning', path: `${p}.date`, message: `date ${card.date} is in the future; it will be hidden until then` });
    if (card.type === 'travel-simulation' && !card.scenario) {
      out.push({ level: 'warning', path: `${p}.scenario`, message: 'travel-simulation without "scenario" will not count toward Trip Readiness' });
    }
    out.push(...scanSensitive(card, p));
  });
  return out;
}

export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/** Suggests the next free id for a date, e.g. 2026-10-23-002. */
export function nextSessionId(date: string, existing: Session[]): string {
  const used = existing.filter((s) => s.id.startsWith(`${date}-`)).map((s) => Number(s.id.slice(11)) || 0);
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${date}-${String(next).padStart(3, '0')}`;
}
