/**
 * MILES statistics. Pure functions over the JSON data.
 *
 * Rules:
 * - Races live in races.json and are never an input to any statistic, map point or Wrapped here.
 * - A place counts as a visit only when "visit_confirmed": true. Suggested places never count.
 * - "TODO" values are skipped (no coordinates -> no marker, no dates -> no travel days).
 * - A trip with TODO dates is still a journey you made (it counts as a trip and a country),
 *   but it adds no travel days and does not appear in a Wrapped year.
 */
import type { Dream, Place, PlaceCategory, Trip } from './types.ts';
import { isKnownNumber, isTodo } from './types.ts';
import { addDays, dayNumber, daysInclusive, fromDayNumber, isIsoDate, monthKey, yearOf } from './dates.ts';
import { CONTINENTS, continentOf } from './countries.ts';

export type TripStatus = 'completed' | 'ongoing' | 'planned' | 'undated';

export function tripStatus(trip: Trip, today: string): TripStatus {
  if (!isIsoDate(trip.start_date) || !isIsoDate(trip.end_date)) return 'undated';
  if (trip.start_date > today) return 'planned';
  if (trip.end_date >= today) return 'ongoing';
  return 'completed';
}

export function countsAsTravelled(trip: Trip, today: string): boolean {
  return tripStatus(trip, today) !== 'planned';
}

/** Calendar days of a trip; an ongoing trip counts up to today. Null when dates are TODO. */
export function tripDays(trip: Trip, today?: string): number | null {
  if (!isIsoDate(trip.start_date) || !isIsoDate(trip.end_date)) return null;
  const end = today && trip.end_date > today && trip.start_date <= today ? today : trip.end_date;
  return daysInclusive(trip.start_date, end);
}

/** Only places the owner explicitly confirmed are visits. */
export function isConfirmedVisit(p: Place): boolean {
  return p.visit_confirmed === true;
}

/** "3 places", "3 places · 2 to confirm", "10 places to confirm", "No places yet". */
export function placeCountLabel(places: Place[]): string {
  const confirmed = places.filter(isConfirmedVisit).length;
  const toConfirm = places.length - confirmed;
  if (!places.length) return 'No places yet';
  if (!confirmed) return `${toConfirm} place${toConfirm === 1 ? '' : 's'} to confirm`;
  return `${confirmed} place${confirmed === 1 ? '' : 's'}${toConfirm ? ` · ${toConfirm} to confirm` : ''}`;
}

export function hasCoords<T extends { lat?: unknown; lng?: unknown }>(p: T): p is T & { lat: number; lng: number } {
  return isKnownNumber(p.lat) && isKnownNumber(p.lng);
}

export interface TravelStats {
  countries: number;
  cities: number;
  places: number;
  continents: number;
  trips: number;
  travelDays: number;
  tripsMissingDates: number;
  roadTripKm: number | null;
  roadTripsMissingKm: number;
  coffee: number;
  restaurants: number;
  hiking: number;
  beaches: number;
  photography: number;
}

/** Confirmed visits on journeys that have happened (or are happening). */
export function placesOfTravelledTrips(trips: Trip[], places: Place[], today: string): Place[] {
  const ids = new Set(trips.filter((t) => countsAsTravelled(t, today)).map((t) => t.id));
  return places.filter((p) => ids.has(p.trip_id) && isConfirmedVisit(p));
}

export function computeTravelStats(trips: Trip[], places: Place[], today: string): TravelStats {
  const travelled = trips.filter((t) => countsAsTravelled(t, today));
  const visited = placesOfTravelledTrips(trips, places, today);

  const countries = new Set<string>([...travelled.map((t) => t.country_code), ...visited.map((p) => p.country_code)]);
  const continents = new Set([...countries].map((c) => continentOf(c)).filter((c) => c !== undefined));
  const cities = new Set(
    travelled.flatMap((t) => t.cities.map((c) => `${t.country_code}:${c.trim().toLowerCase()}`)),
  );

  let travelDays = 0;
  let tripsMissingDates = 0;
  let km = 0;
  let hasKm = false;
  let roadTripsMissingKm = 0;
  for (const t of travelled) {
    const d = tripDays(t, today);
    if (d === null) tripsMissingDates += 1;
    else travelDays += d;
    if (isKnownNumber(t.road_trip_km)) {
      km += t.road_trip_km;
      hasKm = true;
    } else if (t.tags.includes('road-trip')) {
      roadTripsMissingKm += 1;
    }
  }

  const countCategory = (c: PlaceCategory) => visited.filter((p) => p.category.includes(c)).length;
  return {
    countries: countries.size,
    cities: cities.size,
    places: visited.length,
    continents: continents.size,
    trips: travelled.length,
    travelDays,
    tripsMissingDates,
    roadTripKm: hasKm ? Math.round(km) : null,
    roadTripsMissingKm,
    coffee: countCategory('coffee'),
    restaurants: countCategory('food'),
    hiking: countCategory('hiking'),
    beaches: countCategory('beach'),
    photography: countCategory('photography'),
  };
}

export type MarkerKind = 'visited' | 'planned' | 'dream';

export interface MapPoint {
  id: string;
  kind: MarkerKind;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  categories: PlaceCategory[];
  tripId?: string;
  href: string;
}

export interface MapPointsResult {
  points: MapPoint[];
  /** Places and dreams that are not on the map, and why. */
  notOnMap: { name: string; reason: 'not-confirmed' | 'no-coordinates' }[];
}

export function buildMapPoints(trips: Trip[], places: Place[], dreams: Dream[], today: string): MapPointsResult {
  const tripById = new Map(trips.map((t) => [t.id, t]));
  const points: MapPoint[] = [];
  const notOnMap: MapPointsResult['notOnMap'] = [];

  for (const p of places) {
    const trip = tripById.get(p.trip_id);
    const kind: MarkerKind = trip && tripStatus(trip, today) === 'planned' ? 'planned' : 'visited';
    // A suggested place is not a visit: it gets no "visited" marker until it is confirmed.
    if (kind === 'visited' && !isConfirmedVisit(p)) {
      notOnMap.push({ name: p.name, reason: 'not-confirmed' });
      continue;
    }
    if (!hasCoords(p)) {
      notOnMap.push({ name: p.name, reason: 'no-coordinates' });
      continue;
    }
    points.push({
      id: p.id,
      kind,
      name: p.name,
      subtitle: [p.city, trip?.name].filter(Boolean).join(' · '),
      lat: p.lat,
      lng: p.lng,
      categories: p.category,
      tripId: p.trip_id,
      href: `/miles/places/${p.id}`,
    });
  }
  for (const d of dreams) {
    const kind: MarkerKind = d.status === 'NEXT' ? 'planned' : 'dream';
    if (!hasCoords(d)) {
      notOnMap.push({ name: d.destination, reason: 'no-coordinates' });
      continue;
    }
    points.push({
      id: d.id,
      kind,
      name: d.destination,
      subtitle: `${d.status}${isKnownNumber(d.target_year) ? ` · ${d.target_year}` : ''}`,
      lat: d.lat,
      lng: d.lng,
      categories: [],
      href: `/dreams#${d.id}`,
    });
  }
  return { points, notOnMap };
}

/* ------------------------------------------------------------------ Timeline */

export interface TimelineItem {
  kind: 'trip' | 'dream';
  id: string;
  title: string;
  countryCode: string;
  when: string;
  sortKey: string;
  future: boolean;
  href: string;
  status?: string;
  detail?: string;
}

export interface TimelineGroup {
  key: string;
  label: string;
  items: TimelineItem[];
}

export function dreamWhen(d: Dream): string {
  if (!isKnownNumber(d.target_year)) return 'Someday';
  if (d.target_month) {
    const month = new Date(Date.UTC(2000, d.target_month - 1, 1)).toLocaleString('en', { month: 'long', timeZone: 'UTC' });
    return `${month} ${d.target_year}`;
  }
  return String(d.target_year);
}

export function buildTimeline(trips: Trip[], places: Place[], dreams: Dream[], today: string): TimelineGroup[] {
  const years = new Map<string, TimelineItem[]>();
  const undated: TimelineItem[] = [];
  const someday: TimelineItem[] = [];

  for (const t of trips) {
    const tripPlaces = places.filter((p) => p.trip_id === t.id);
    const item: TimelineItem = {
      kind: 'trip',
      id: t.id,
      title: t.name,
      countryCode: t.country_code,
      when: '',
      sortKey: '',
      future: false,
      href: `/miles/journeys/${t.id}`,
      detail: tripPlaces.length ? placeCountLabel(tripPlaces) : undefined,
    };
    if (isIsoDate(t.start_date) && isIsoDate(t.end_date)) {
      item.sortKey = t.start_date;
      item.future = t.start_date > today;
      const list = years.get(t.start_date.slice(0, 4)) ?? [];
      list.push(item);
      years.set(t.start_date.slice(0, 4), list);
    } else {
      item.when = 'Dates TODO';
      undated.push(item);
    }
  }
  for (const d of dreams) {
    const item: TimelineItem = {
      kind: 'dream',
      id: d.id,
      title: d.destination,
      countryCode: d.country_code,
      when: dreamWhen(d),
      sortKey: '',
      future: true,
      href: `/dreams#${d.id}`,
      status: d.status,
    };
    if (isKnownNumber(d.target_year)) {
      const month = d.target_month ? String(d.target_month).padStart(2, '0') : '13';
      item.sortKey = `${d.target_year}-${month}`;
      const key = String(d.target_year);
      const list = years.get(key) ?? [];
      list.push(item);
      years.set(key, list);
    } else {
      someday.push(item);
    }
  }

  const groups: TimelineGroup[] = [...years.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, items]) => ({
      key: year,
      label: year,
      items: items.sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.title.localeCompare(b.title)),
    }));
  if (someday.length) groups.push({ key: 'someday', label: 'Someday', items: someday });
  if (undated.length) groups.push({ key: 'undated', label: 'Journeys without dates', items: undated });
  return groups;
}

/* ------------------------------------------------------------------ Wrapped */

export interface WrappedSummary {
  year: number;
  trips: { trip: Trip; days: number }[];
  countries: string[];
  continents: string[];
  cities: number;
  places: Place[];
  travelDays: number;
  months: string[];
  topCategories: { category: PlaceCategory; count: number }[];
  longestTrip: { trip: Trip; days: number } | null;
  undatedTrips: number;
}

/** Years that have at least one dated trip that has started. Newest first. */
export function wrappedYears(trips: Trip[], today: string): number[] {
  const years = new Set<number>();
  for (const t of trips) {
    if (!isIsoDate(t.start_date) || !isIsoDate(t.end_date) || t.start_date > today) continue;
    const end = t.end_date > today ? today : t.end_date;
    for (let y = yearOf(t.start_date); y <= yearOf(end); y++) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

/** Races are deliberately not a parameter: Wrapped cannot include them. */
export function computeWrapped(year: number, trips: Trip[], places: Place[], today: string): WrappedSummary {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const inYear: { trip: Trip; days: number; from: string; to: string }[] = [];
  for (const t of trips) {
    if (!isIsoDate(t.start_date) || !isIsoDate(t.end_date) || t.start_date > today) continue;
    const from = t.start_date > yearStart ? t.start_date : yearStart;
    let to = t.end_date < yearEnd ? t.end_date : yearEnd;
    if (to > today) to = today;
    if (from > to) continue;
    inYear.push({ trip: t, days: daysInclusive(from, to), from, to });
  }
  const tripIds = new Set(inYear.map((x) => x.trip.id));
  const tripById = new Map(trips.map((t) => [t.id, t]));
  const yearPlaces = places.filter((p) => {
    if (!tripIds.has(p.trip_id) || !isConfirmedVisit(p)) return false;
    if (isIsoDate(p.visited_date)) return yearOf(p.visited_date) === year;
    const trip = tripById.get(p.trip_id);
    return trip !== undefined && isIsoDate(trip.start_date) && yearOf(trip.start_date) === year;
  });

  const months = new Set<string>();
  for (const x of inYear) {
    for (let n = dayNumber(x.from); n <= dayNumber(x.to); n++) months.add(monthKey(fromDayNumber(n)));
  }
  const countries = [...new Set([...inYear.map((x) => x.trip.country_code), ...yearPlaces.map((p) => p.country_code)])];
  const continents = [...new Set(countries.map((c) => continentOf(c)).filter((c) => c !== undefined))].map((c) => CONTINENTS[c]);
  const cities = new Set(inYear.flatMap((x) => x.trip.cities.map((c) => `${x.trip.country_code}:${c.trim().toLowerCase()}`)));

  const catCounts = new Map<PlaceCategory, number>();
  for (const p of yearPlaces) for (const c of p.category) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  const topCategories = [...catCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
    .slice(0, 3);

  const longest = [...inYear].sort((a, b) => b.days - a.days)[0];

  return {
    year,
    trips: inYear.map(({ trip, days }) => ({ trip, days })),
    countries,
    continents,
    cities: cities.size,
    places: yearPlaces,
    travelDays: inYear.reduce((sum, x) => sum + x.days, 0),
    months: [...months].sort(),
    topCategories,
    longestTrip: longest ? { trip: longest.trip, days: longest.days } : null,
    undatedTrips: trips.filter((t) => tripStatus(t, today) === 'undated').length,
  };
}

/* ------------------------------------------------------------------ Dreams */

/** Days until the first day of the dream's target month, or null if unknown/past. */
export function daysUntilDream(d: Dream, today: string): number | null {
  if (!isKnownNumber(d.target_year) || !d.target_month) return null;
  const target = `${d.target_year}-${String(d.target_month).padStart(2, '0')}-01`;
  const days = dayNumber(target) - dayNumber(today);
  return days >= 0 ? days : null;
}

export function formatBudget(value: Dream['budget_thb_per_person']): string {
  if (!isKnownNumber(value)) return isTodo(value) ? 'TODO' : '—';
  return `฿${value.toLocaleString('en-US')} per person`;
}

export function nextDreams(dreams: Dream[]): Dream[] {
  return dreams
    .filter((d) => d.status === 'NEXT')
    .sort((a, b) => {
      const ka = `${isKnownNumber(a.target_year) ? a.target_year : 9999}-${String(a.target_month ?? 13).padStart(2, '0')}`;
      const kb = `${isKnownNumber(b.target_year) ? b.target_year : 9999}-${String(b.target_month ?? 13).padStart(2, '0')}`;
      return ka.localeCompare(kb);
    });
}

export { addDays };
