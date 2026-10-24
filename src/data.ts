/**
 * Loads the published JSON files from <base>data/. The repository is the source of truth;
 * the only browser-side data is the optional local preview of imported Session Cards.
 */
import type {
  Dream, DreamsFile, JournalEntry, JournalFile, LibraryFile, LibraryItem, Phrase, PhrasesFile, Place, PlacesFile,
  Plan, PlanFile, Race, RacesFile, Rescue, RescuesFile, Session, SessionsFile, Trip, TripsFile,
} from './lib/types.ts';
import { assetUrl } from './base.ts';
import { routeAssets } from './lib/routes.ts';
import { getLocalSessions } from './local-preview.ts';

const cache = new Map<string, Promise<unknown>>();

export function loadDataFile<T>(file: string): Promise<T> {
  let pending = cache.get(file) as Promise<T> | undefined;
  if (!pending) {
    pending = fetch(assetUrl(`data/${file}`)).then(async (res) => {
      if (!res.ok) throw new Error(`Could not load data/${file} (HTTP ${res.status})`);
      return (await res.json()) as T;
    });
    cache.set(file, pending);
    pending.catch(() => cache.delete(file));
  }
  return pending;
}

export const getTrips = async (): Promise<Trip[]> => (await loadDataFile<TripsFile>('trips.json')).trips;
export const getPlaces = async (): Promise<Place[]> => (await loadDataFile<PlacesFile>('places.json')).places;
export const getDreams = async (): Promise<Dream[]> => (await loadDataFile<DreamsFile>('dreams.json')).dreams;
export const getRaces = async (): Promise<Race[]> => (await loadDataFile<RacesFile>('races.json')).races;
export const getPhrases = async (): Promise<Phrase[]> => (await loadDataFile<PhrasesFile>('speaklog/phrases.json')).phrases;
export const getRescues = async (): Promise<Rescue[]> => (await loadDataFile<RescuesFile>('speaklog/rescues.json')).rescues;
export const getLibrary = async (): Promise<LibraryItem[]> => (await loadDataFile<LibraryFile>('speaklog/library.json')).library;
export const getJournal = async (): Promise<JournalEntry[]> => (await loadDataFile<JournalFile>('speaklog/journal.json')).entries;
export const getPlan = async (): Promise<Plan> => (await loadDataFile<PlanFile>('speaklog/plan.json')).plan;
export const getCommittedSessions = async (): Promise<Session[]> => (await loadDataFile<SessionsFile>('speaklog/sessions.json')).sessions;

export interface SessionsResult {
  sessions: Session[];
  /** Ids of sessions that exist only as a local preview in this browser. */
  localIds: Set<string>;
}

/** Committed sessions plus any local previews (never sent anywhere; only on this device). */
export async function getSessions(): Promise<SessionsResult> {
  const committed = await getCommittedSessions();
  const committedIds = new Set(committed.map((s) => s.id));
  const local = getLocalSessions().filter((s) => !committedIds.has(s.id));
  return { sessions: [...committed, ...local], localIds: new Set(local.map((s) => s.id)) };
}

/** Starts the fetches a route needs early, in parallel with the page module download. */
export function prefetchFor(path: string): void {
  for (const f of routeAssets(path)?.data ?? []) void loadDataFile(f).catch(() => undefined);
}
