/**
 * Optional local preview for imported Session Cards.
 * Stored in this browser's localStorage only. Nothing is uploaded or published;
 * the public site changes only when the merged JSON is committed to the repository.
 */
import type { Session } from './lib/types.ts';

const KEY = 'lifeos.speaklog.localPreview.v1';

export function getLocalSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is Session =>
        typeof s === 'object' && s !== null && typeof (s as Session).id === 'string' && typeof (s as Session).date === 'string' &&
        typeof (s as Session).duration_min === 'number' && typeof (s as Session).type === 'string',
    );
  } catch {
    return [];
  }
}

export function addLocalSessions(sessions: Session[]): void {
  const byId = new Map(getLocalSessions().map((s) => [s.id, s]));
  for (const s of sessions) byId.set(s.id, s);
  localStorage.setItem(KEY, JSON.stringify([...byId.values()]));
}

export function clearLocalSessions(): void {
  localStorage.removeItem(KEY);
}
