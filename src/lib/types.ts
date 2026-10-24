/**
 * Data model for PURINAT LIFE OS.
 * The JSON files in /data are the source of truth; /schemas holds the JSON Schemas
 * that `npm run validate:data` and the import tool check against.
 *
 * Convention: the literal string "TODO" marks a value the owner has not supplied yet.
 * It is never treated as data (no stats, no map markers, no scores).
 */

export type Todo = 'TODO';

/** Place categories. These are also the filter chips on the Explore map. */
export const PLACE_CATEGORIES = [
  'nature',
  'landmark',
  'beach',
  'mountain',
  'road-trip',
  'coffee',
  'food',
  'shopping',
  'photography',
  'hiking',
] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export interface Trip {
  id: string;
  name: string;
  country_code: string;
  start_date: string | Todo;
  end_date: string | Todo;
  cities: string[];
  tags: PlaceCategory[];
  summary: string;
  hero_place_id: string | Todo | null;
  road_trip_km?: number | Todo;
}

export interface Place {
  id: string;
  trip_id: string;
  name: string;
  city: string;
  country_code: string;
  /** true only when the owner confirmed the visit; suggested places stay false and never count. */
  visit_confirmed: boolean;
  lat: number | Todo;
  lng: number | Todo;
  coord_source?: string;
  coord_verified?: boolean;
  coord_note?: string;
  visited_date: string | Todo;
  category: PlaceCategory[];
  rating: number | Todo;
  memory: string;
  photo: string;
  photo_alt: string;
  camera?: string;
  lens?: string;
  focal_length_mm?: number;
  best_time?: string;
}

export const DREAM_STATUSES = ['NEXT', 'CONDITIONAL', 'BACKUP', 'DREAM'] as const;
export type DreamStatus = (typeof DREAM_STATUSES)[number];

export interface Dream {
  id: string;
  destination: string;
  country_code: string;
  target_year: number | Todo;
  target_month?: number;
  status: DreamStatus;
  budget_thb_per_person?: number | Todo;
  priority?: number | Todo;
  depends_on?: string;
  backup_of?: string;
  notes: string;
  lat?: number;
  lng?: number;
  coord_source?: string;
  coord_verified?: boolean;
}

/** Races are stored separately and are never part of any travel statistic. */
export interface Race {
  id: string;
  trip_id: string;
  name: string;
  date: string | Todo;
  city: string;
  country_code: string;
  notes: string;
}

export const SESSION_TYPES = [
  'speaking',
  'listening',
  'movie',
  'reading',
  'shadowing',
  'travel-simulation',
  'storytelling',
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const SCENARIOS = [
  'airport',
  'hotel',
  'restaurant',
  'shopping',
  'car-rental',
  'small-talk',
  'storytelling',
  'problem-solving',
] as const;
export type Scenario = (typeof SCENARIOS)[number];

export interface Scores {
  fluency?: number;
  grammar?: number;
  vocabulary?: number;
  communication?: number;
  listening?: number;
}

export interface Correction {
  said: string;
  natural: string;
  tag: string;
}

/** One SPEAKLOG activity ("Session Card"). Scores are 0-5. */
export interface Session {
  id: string;
  date: string;
  type: SessionType;
  duration_min: number;
  topic: string;
  scores?: Scores;
  strength?: string;
  focus?: string;
  corrections?: Correction[];
  new_phrases?: string[];
  coach_note?: string;
  scenario?: Scenario;
  comprehension_pct?: number;
  library_id?: string;
}

export const PHRASE_CATEGORIES = ['travel', 'running', 'photography', 'coffee', 'work', 'small-talk'] as const;
export type PhraseCategory = (typeof PHRASE_CATEGORIES)[number];
export const PHRASE_STATUSES = ['NEW', 'LEARNING', 'MASTERED'] as const;
export type PhraseStatus = (typeof PHRASE_STATUSES)[number];

export interface Phrase {
  id: string;
  phrase: string;
  natural: string;
  situation: string;
  category: PhraseCategory;
  status: PhraseStatus;
  added: string;
  session_id?: string;
}

export interface Rescue {
  id: string;
  date: string;
  wanted_to_say: string;
  my_version: string;
  natural_version: string;
  category?: PhraseCategory;
  note?: string;
}

export const LIBRARY_KINDS = ['movie', 'series', 'podcast', 'youtube'] as const;
export type LibraryKind = (typeof LIBRARY_KINDS)[number];
export const LIBRARY_STATUSES = ['want', 'watching', 'completed', 'rewatch'] as const;
export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];
export const SUBTITLE_MODES = ['none', 'english', 'thai', 'english+thai'] as const;
export type SubtitleMode = (typeof SUBTITLE_MODES)[number];

export interface LibraryItem {
  id: string;
  title: string;
  kind: LibraryKind;
  status: LibraryStatus;
  difficulty: number | Todo;
  subtitle_mode: SubtitleMode;
  comprehension_pct?: number;
  useful_phrases: string[];
  notes: string;
  completed_date?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  topic: string;
  title: string;
  body: string;
}

export const PHASE_NAMES = ['Base', 'Build', 'Trip-Specific', 'Peak', 'Taper'] as const;
export type PhaseName = (typeof PHASE_NAMES)[number];
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface Plan {
  next_trip: {
    name: string;
    dream_id?: string;
    /** Exact first day of the trip, when known. */
    start_date?: string;
    /** YYYY-MM when only the month is known. */
    target_month?: string;
    tentative: boolean;
  };
  phases: {
    is_default: boolean;
    items: { name: PhaseName; weeks: number | null; focus: string }[];
  };
  weekly_goals: {
    is_default: boolean;
    minutes: number;
    speaking_sessions: number;
    listening_minutes: number;
    new_phrases: number;
  };
  weekly_template: {
    is_default: boolean;
    days: { day: Weekday; activity: SessionType | 'rest'; minutes: number; note: string }[];
  };
}

/* File wrappers: every data file is an object with a schema version. */
export interface TripsFile { schema_version: 1; trips: Trip[] }
export interface PlacesFile { schema_version: 1; places: Place[] }
export interface DreamsFile { schema_version: 1; dreams: Dream[] }
export interface RacesFile { schema_version: 1; races: Race[] }
export interface SessionsFile { schema_version: 1; sessions: Session[] }
export interface PhrasesFile { schema_version: 1; phrases: Phrase[] }
export interface RescuesFile { schema_version: 1; rescues: Rescue[] }
export interface LibraryFile { schema_version: 1; library: LibraryItem[] }
export interface JournalFile { schema_version: 1; entries: JournalEntry[] }
export interface PlanFile { schema_version: 1; plan: Plan }

export function isTodo(value: unknown): value is Todo {
  return value === 'TODO';
}

export function isKnownNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
