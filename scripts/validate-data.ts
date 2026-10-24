/**
 * npm run validate:data
 *
 * Fails (exit 1) on: schema errors, duplicate ids, broken references, invalid coordinates,
 * missing / oversized / non-WebP / metadata-carrying photos, and likely sensitive data
 * (e-mail, phone, card numbers, sensitive field names).
 * Warns on: TODO photos, unverified coordinates, text that looks like a flight number,
 * booking reference or passport number, and images in public/ that no place uses.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parseWebp } from './lib/webp.ts';
import { scanSensitive, type Finding } from '../src/lib/sensitive.ts';
import { checkSessions } from '../src/lib/session-checks.ts';
import { isCountryCode } from '../src/lib/countries.ts';
import { isIsoDate, todayIso } from '../src/lib/dates.ts';
import { PHASE_NAMES, WEEKDAYS, isKnownNumber, isTodo } from '../src/lib/types.ts';
import type {
  DreamsFile, JournalFile, LibraryFile, PhrasesFile, PlacesFile, PlanFile, RacesFile, RescuesFile, SessionsFile, TripsFile,
} from '../src/lib/types.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.resolve(ROOT, process.env.LIFEOS_DATA_DIR ?? 'data');
const SCHEMAS = path.join(ROOT, 'schemas');
const PUBLIC = path.resolve(ROOT, process.env.LIFEOS_PUBLIC_DIR ?? 'public');
export const MAX_PHOTO_BYTES = 300_000;
export const MAX_PHOTO_PX = 1600;

const FILES = {
  trips: ['trips.json', 'trips.schema.json'],
  places: ['places.json', 'places.schema.json'],
  dreams: ['dreams.json', 'dreams.schema.json'],
  races: ['races.json', 'races.schema.json'],
  sessions: ['speaklog/sessions.json', 'sessions.schema.json'],
  phrases: ['speaklog/phrases.json', 'phrases.schema.json'],
  rescues: ['speaklog/rescues.json', 'rescues.schema.json'],
  library: ['speaklog/library.json', 'library.schema.json'],
  journal: ['speaklog/journal.json', 'journal.schema.json'],
  plan: ['speaklog/plan.json', 'plan.schema.json'],
} as const;
type Key = keyof typeof FILES;

const findings: (Finding & { file: string })[] = [];
const add = (file: string, level: Finding['level'], p: string, message: string) => findings.push({ file, level, path: p, message });

// ---------------------------------------------------------------- schemas
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
for (const f of readdirSync(SCHEMAS).filter((n) => n.endsWith('.schema.json'))) {
  ajv.addSchema(JSON.parse(readFileSync(path.join(SCHEMAS, f), 'utf8')) as object);
}

const COLLECTION: Partial<Record<Key, [string, string]>> = {
  trips: ['trips', 'trips.schema.json#/$defs/trip'],
  places: ['places', 'places.schema.json#/$defs/place'],
  dreams: ['dreams', 'dreams.schema.json#/$defs/dream'],
  races: ['races', 'races.schema.json#/$defs/race'],
  sessions: ['sessions', 'session-card.schema.json'],
  phrases: ['phrases', 'phrases.schema.json#/$defs/phrase'],
  rescues: ['rescues', 'rescues.schema.json#/$defs/rescue'],
  library: ['library', 'library.schema.json#/$defs/item'],
  journal: ['entries', 'journal.schema.json#/$defs/entry'],
};

/** "/places/2/lat" -> "$.places[2].lat" */
const jsonPath = (pointer: string) => `$${pointer.split('/').slice(1).map((seg) => (/^\d+$/.test(seg) ? `[${seg}]` : `.${seg}`)).join('')}`;

/** Ajv reports every failed anyOf branch; keep the useful message (e.g. "must be <= 90"). */
function readableErrors(errors: { instancePath: string; keyword: string; message?: string; params: Record<string, unknown> }[]) {
  const byPath = new Map<string, typeof errors>();
  for (const e of errors) byPath.set(e.instancePath, [...(byPath.get(e.instancePath) ?? []), e]);
  const out: { path: string; message: string }[] = [];
  for (const [p, list] of byPath) {
    const specific = list.filter((e) => e.keyword !== 'anyOf' && !(e.keyword === 'const' && e.params.allowedValue === 'TODO'));
    const chosen = specific.length ? specific : list.filter((e) => e.keyword === 'anyOf').map((e) => ({ ...e, message: 'must be a valid value or "TODO"' }));
    for (const e of chosen) {
      const extra = e.keyword === 'additionalProperties' ? ` "${String(e.params.additionalProperty)}"` : e.keyword === 'enum' ? `: ${(e.params.allowedValues as unknown[]).join(', ')}` : '';
      out.push({ path: jsonPath(p), message: `${e.message ?? 'invalid'}${extra}` });
    }
  }
  return out;
}

const loaded: Partial<Record<Key, unknown>> = {};
for (const [key, [file, schema]] of Object.entries(FILES) as [Key, readonly [string, string]][]) {
  const full = path.join(DATA, file);
  if (!existsSync(full)) {
    add(file, 'error', '$', 'file is missing');
    continue;
  }
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(full, 'utf8'));
  } catch (error) {
    add(file, 'error', '$', `invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }
  const validate = ajv.getSchema(schema);
  if (!validate) throw new Error(`schema ${schema} not found`);
  for (const f of scanSensitive(json)) add(file, f.level, f.path, f.message);
  if (validate(json)) {
    loaded[key] = json;
    continue;
  }
  for (const e of readableErrors(validate.errors ?? [])) add(file, 'error', e.path, e.message);
  // Keep checking the items that are valid on their own, so one run reports every problem.
  const collection = COLLECTION[key];
  const list = collection && json && typeof json === 'object' ? (json as Record<string, unknown>)[collection[0]] : undefined;
  if (collection && Array.isArray(list)) {
    const itemValid = ajv.getSchema(collection[1]);
    if (!itemValid) throw new Error(`schema ${collection[1]} not found`);
    // Duplicate ids are checked on every item that has an id, valid or not.
    const ids = list.map((item) => (item && typeof item === 'object' ? (item as { id?: unknown }).id : undefined));
    const seen = new Set<unknown>();
    ids.forEach((id, i) => {
      if (typeof id !== 'string') return;
      if (seen.has(id)) add(file, 'error', `$.${collection[0]}[${i}].id`, `duplicate id "${id}"`);
      seen.add(id);
    });
    loaded[key] = { ...(json as object), [collection[0]]: list.filter((item) => itemValid(item)), __partial: true };
  }
}
const today = todayIso();
const trips = (loaded.trips as TripsFile | undefined)?.trips ?? [];
const places = (loaded.places as PlacesFile | undefined)?.places ?? [];
const dreams = (loaded.dreams as DreamsFile | undefined)?.dreams ?? [];
const races = (loaded.races as RacesFile | undefined)?.races ?? [];
const sessions = (loaded.sessions as SessionsFile | undefined)?.sessions ?? [];

// ---------------------------------------------------------------- duplicate ids
function duplicates(file: string, items: { id: string }[], key: string) {
  const fileKey = (Object.entries(FILES) as [Key, readonly [string, string]][]).find(([, [f]]) => f === file)?.[0];
  if (fileKey && (loaded[fileKey] as { __partial?: boolean } | undefined)?.__partial) return; // already checked above
  const seen = new Set<string>();
  items.forEach((item, i) => {
    if (seen.has(item.id)) add(file, 'error', `$.${key}[${i}].id`, `duplicate id "${item.id}"`);
    seen.add(item.id);
  });
}
duplicates('trips.json', trips, 'trips');
duplicates('places.json', places, 'places');
duplicates('dreams.json', dreams, 'dreams');
duplicates('races.json', races, 'races');
duplicates('speaklog/phrases.json', (loaded.phrases as PhrasesFile | undefined)?.phrases ?? [], 'phrases');
duplicates('speaklog/rescues.json', (loaded.rescues as RescuesFile | undefined)?.rescues ?? [], 'rescues');
duplicates('speaklog/library.json', (loaded.library as LibraryFile | undefined)?.library ?? [], 'library');
duplicates('speaklog/journal.json', (loaded.journal as JournalFile | undefined)?.entries ?? [], 'entries');

// ---------------------------------------------------------------- trips
const tripById = new Map(trips.map((t) => [t.id, t]));
trips.forEach((t, i) => {
  const p = `$.trips[${i}]`;
  if (!isCountryCode(t.country_code)) add('trips.json', 'error', `${p}.country_code`, `unknown country code "${t.country_code}"`);
  if (isTodo(t.start_date) !== isTodo(t.end_date)) add('trips.json', 'error', p, 'start_date and end_date must both be dates or both be TODO');
  if (isIsoDate(t.start_date) && isIsoDate(t.end_date) && t.start_date > t.end_date) add('trips.json', 'error', p, 'start_date is after end_date');
  if (t.hero_place_id && !isTodo(t.hero_place_id)) {
    const hero = places.find((pl) => pl.id === t.hero_place_id);
    if (!hero) add('trips.json', 'error', `${p}.hero_place_id`, `no place with id "${t.hero_place_id}"`);
    else if (hero.trip_id !== t.id) add('trips.json', 'error', `${p}.hero_place_id`, `place "${hero.id}" belongs to another trip`);
  }
});

// ---------------------------------------------------------------- places (coordinates + photos)
const usedPhotos = new Map<string, string>();
places.forEach((pl, i) => {
  const p = `$.places[${i}]`;
  const trip = tripById.get(pl.trip_id);
  if (!trip) add('places.json', 'error', `${p}.trip_id`, `no trip with id "${pl.trip_id}"`);
  if (!isCountryCode(pl.country_code)) add('places.json', 'error', `${p}.country_code`, `unknown country code "${pl.country_code}"`);
  if (/\b(marathon|half[- ]marathon|race|10k|21k|42k|ultra)\b/i.test(pl.name)) {
    add('places.json', 'warning', `${p}.name`, 'looks like a race. Races belong in races.json so they are never counted in travel stats');
  }
  if (!pl.visit_confirmed) add('places.json', 'warning', `${p}.visit_confirmed`, `visit to "${pl.name}" is not confirmed; it is shown as a suggestion and not counted`);
  // Coordinates
  const latTodo = isTodo(pl.lat);
  const lngTodo = isTodo(pl.lng);
  if (latTodo !== lngTodo) add('places.json', 'error', p, 'lat and lng must both be numbers or both be TODO');
  if (isKnownNumber(pl.lat) && isKnownNumber(pl.lng)) {
    if (pl.lat === 0 && pl.lng === 0) add('places.json', 'error', p, 'coordinates 0,0 are not a real place');
    if (pl.coord_verified === false) add('places.json', 'warning', p, `coordinates for "${pl.name}" were looked up and are not verified yet`);
  }
  // Dates
  if (trip && isIsoDate(pl.visited_date) && isIsoDate(trip.start_date) && isIsoDate(trip.end_date)) {
    if (pl.visited_date < trip.start_date || pl.visited_date > trip.end_date) {
      add('places.json', 'error', `${p}.visited_date`, `${pl.visited_date} is outside the trip (${trip.start_date} to ${trip.end_date})`);
    }
  }
  // Photo: exactly one per place
  if (isTodo(pl.photo)) {
    add('places.json', 'warning', `${p}.photo`, `photo for "${pl.name}" is TODO`);
    return;
  }
  if (isTodo(pl.photo_alt)) add('places.json', 'error', `${p}.photo_alt`, 'a published photo needs alt text');
  const other = usedPhotos.get(pl.photo);
  if (other) add('places.json', 'warning', `${p}.photo`, `same photo as "${other}"`);
  usedPhotos.set(pl.photo, pl.id);
  const file = path.join(PUBLIC, pl.photo);
  if (!existsSync(file)) {
    add('places.json', 'error', `${p}.photo`, `missing file public/${pl.photo}`);
    return;
  }
  const bytes = readFileSync(file);
  if (bytes.length > MAX_PHOTO_BYTES) add('places.json', 'error', `${p}.photo`, `public/${pl.photo} is ${Math.round(bytes.length / 1000)} KB (max 300 KB). Run npm run images`);
  const info = parseWebp(bytes);
  if (!info) {
    add('places.json', 'error', `${p}.photo`, `public/${pl.photo} is not a WebP file`);
    return;
  }
  if (Math.max(info.width, info.height) > MAX_PHOTO_PX) add('places.json', 'error', `${p}.photo`, `public/${pl.photo} is ${info.width}×${info.height} (max ${MAX_PHOTO_PX} px)`);
  if (info.hasExif || info.hasXmp) add('places.json', 'error', `${p}.photo`, `public/${pl.photo} contains EXIF/XMP metadata (may include GPS). Re-export it with npm run images`);
});

// Images that are published but not used by any place.
const photoDir = path.join(PUBLIC, 'images', 'places');
if (existsSync(photoDir)) {
  for (const name of readdirSync(photoDir)) {
    if (name.startsWith('.') || !statSync(path.join(photoDir, name)).isFile()) continue;
    if (!usedPhotos.has(`images/places/${name}`)) add('public/images/places', 'warning', name, 'not used by any place, but it is still published. Delete it if it should not be public');
  }
}

// ---------------------------------------------------------------- dreams, races
const dreamIds = new Set(dreams.map((d) => d.id));
dreams.forEach((d, i) => {
  const p = `$.dreams[${i}]`;
  if (!isCountryCode(d.country_code)) add('dreams.json', 'error', `${p}.country_code`, `unknown country code "${d.country_code}"`);
  if (d.backup_of && !dreamIds.has(d.backup_of)) add('dreams.json', 'error', `${p}.backup_of`, `no dream with id "${d.backup_of}"`);
  if (d.backup_of === d.id) add('dreams.json', 'error', `${p}.backup_of`, 'a dream cannot be its own backup');
  if (d.status === 'BACKUP' && !d.backup_of) add('dreams.json', 'warning', p, 'status BACKUP without backup_of');
  if (d.status === 'CONDITIONAL' && !d.depends_on) add('dreams.json', 'warning', p, 'status CONDITIONAL without depends_on');
  if ((d.lat === undefined) !== (d.lng === undefined)) add('dreams.json', 'error', p, 'lat and lng must be given together');
  if (d.lat === 0 && d.lng === 0) add('dreams.json', 'error', p, 'coordinates 0,0 are not a real place');
  if (d.coord_verified === false) add('dreams.json', 'warning', p, `coordinates for "${d.destination}" were looked up and are not verified yet`);
});
races.forEach((r, i) => {
  if (!tripById.has(r.trip_id)) add('races.json', 'error', `$.races[${i}].trip_id`, `no trip with id "${r.trip_id}"`);
});

// ---------------------------------------------------------------- SPEAKLOG
for (const f of checkSessions(sessions, [], today, '$.sessions')) {
  // checkSessions reports duplicates within the list; "already exists" cannot happen with an empty list.
  add('speaklog/sessions.json', f.level, f.path, f.message);
}
const sessionIds = new Set(sessions.map((s) => s.id));
const libraryIds = new Set(((loaded.library as LibraryFile | undefined)?.library ?? []).map((l) => l.id));
((loaded.phrases as PhrasesFile | undefined)?.phrases ?? []).forEach((ph, i) => {
  if (ph.session_id && !sessionIds.has(ph.session_id)) add('speaklog/phrases.json', 'error', `$.phrases[${i}].session_id`, `no session with id "${ph.session_id}"`);
});
sessions.forEach((s, i) => {
  if (s.library_id && loaded.library && !libraryIds.has(s.library_id)) add('speaklog/sessions.json', 'error', `$.sessions[${i}].library_id`, `no library item with id "${s.library_id}"`);
});
const plan = (loaded.plan as PlanFile | undefined)?.plan;
if (plan) {
  const names = plan.phases.items.map((x) => x.name).join(',');
  if (names !== PHASE_NAMES.join(',')) add('speaklog/plan.json', 'error', '$.plan.phases.items', `phases must be in this order: ${PHASE_NAMES.join(', ')}`);
  if (plan.phases.items.filter((x) => x.weeks === null).length !== 1) add('speaklog/plan.json', 'error', '$.plan.phases.items', 'exactly one phase (Base) must have "weeks": null');
  const days = plan.weekly_template.days.map((d) => d.day).join(',');
  if (days !== WEEKDAYS.join(',')) add('speaklog/plan.json', 'error', '$.plan.weekly_template.days', 'days must be Mon to Sun, once each');
  if (plan.next_trip.dream_id && !dreamIds.has(plan.next_trip.dream_id)) add('speaklog/plan.json', 'error', '$.plan.next_trip.dream_id', `no dream with id "${plan.next_trip.dream_id}"`);
}

// ---------------------------------------------------------------- report
let todoCount = 0;
const countTodo = (v: unknown): void => {
  if (v === 'TODO') todoCount += 1;
  else if (Array.isArray(v)) v.forEach(countTodo);
  else if (v && typeof v === 'object') Object.values(v).forEach(countTodo);
};
Object.values(loaded).forEach(countTodo);

const errors = findings.filter((f) => f.level === 'error');
const warnings = findings.filter((f) => f.level === 'warning');
const print = (list: typeof findings, label: string, limit = 200) => {
  for (const f of list.slice(0, limit)) console.log(`  ${label} ${f.file} ${f.path}: ${f.message}`);
  if (list.length > limit) console.log(`  … and ${list.length - limit} more`);
};

console.log(`validate:data: ${DATA === path.join(ROOT, 'data') ? 'data/' : DATA}`);
console.log(`  trips ${trips.length} · places ${places.length} · dreams ${dreams.length} · races ${races.length} · sessions ${sessions.length}`);
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  print(warnings, '⚠', Number(process.env.VALIDATE_WARNING_LIMIT ?? 40));
}
if (errors.length) {
  console.log(`\nErrors (${errors.length}):`);
  print(errors, '✖');
}
console.log(`\n${todoCount} field(s) still marked TODO.`);
if (errors.length) {
  console.log(`✖ validate:data failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`✔ validate:data passed (${warnings.length} warning(s)).`);
