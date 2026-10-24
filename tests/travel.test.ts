import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { DreamsFile, Place, PlacesFile, RacesFile, Trip, TripsFile } from '../src/lib/types.ts';
import { buildMapPoints, buildTimeline, computeTravelStats, computeWrapped, daysUntilDream, placeCountLabel, tripStatus, wrappedYears } from '../src/lib/travel.ts';

const load = <T>(file: string): T => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), 'utf8')) as T;
const trips = load<TripsFile>('trips.json').trips;
const places = load<PlacesFile>('places.json').places;
const dreams = load<DreamsFile>('dreams.json').dreams;
const races = load<RacesFile>('races.json').races;
const TODAY = '2026-10-23';

test('seed data: suggested places are not visits, so no place counts yet', () => {
  assert.equal(places.length, 10, 'Fitzroy Gardens was removed');
  assert.ok(places.every((p) => p.visit_confirmed === false), 'no visit has been confirmed yet');
  const s = computeTravelStats(trips, places, TODAY);
  assert.equal(s.trips, 3, 'Australia + two Japan trips');
  assert.equal(s.countries, 2, 'AU and JP, from the trips themselves');
  assert.equal(s.continents, 2, 'Oceania and Asia');
  assert.equal(s.places, 0, 'suggested places never count');
  assert.equal(s.beaches, 0);
  assert.equal(s.cities, 9, 'the nine Australian areas you listed');
  assert.equal(s.travelDays, 13, '8-20 Oct 2026 inclusive; Japan dates are TODO');
  assert.equal(s.tripsMissingDates, 2);
  assert.equal(s.roadTripKm, null, 'no km recorded, so no number is shown');
});

test('a place counts only after "visit_confirmed": true', () => {
  const confirm = (id: string): Place => ({ ...places.find((p) => p.id === id)!, visit_confirmed: true });
  const withTwo = places.map((p) => (p.id === 'camp-cove' || p.id === 'twelve-apostles' ? confirm(p.id) : p));
  const s = computeTravelStats(trips, withTwo, TODAY);
  assert.equal(s.places, 2);
  assert.equal(s.beaches, 1, 'Camp Cove is tagged beach');
  const { points } = buildMapPoints(trips, withTwo, dreams, TODAY);
  assert.deepEqual(points.filter((p) => p.kind === 'visited').map((p) => p.id).sort(), ['camp-cove', 'twelve-apostles']);
  assert.equal(computeWrapped(2026, trips, withTwo, TODAY).places.length, 2);
  assert.equal(placeCountLabel(withTwo.filter((p) => p.trip_id === 'australia-2026')), '2 places · 8 to confirm');
  assert.equal(placeCountLabel(places), '10 places to confirm');
});

test('races are not an input to stats, map points or Wrapped', () => {
  assert.equal(races.length, 1, 'the Melbourne Marathon is on record (shown only as a journey badge)');
  // The functions have no race parameter at all, so a race cannot leak into them.
  assert.equal(computeTravelStats.length, 3);
  assert.equal(buildMapPoints.length, 4);
  assert.equal(computeWrapped.length, 4);
  const raceNames = new Set(races.map((r) => r.name));
  const { points } = buildMapPoints(trips, places, dreams, TODAY);
  assert.ok(points.every((p) => !raceNames.has(p.name)));
  const w = computeWrapped(2026, trips, places, TODAY);
  assert.ok(w.places.every((p) => !raceNames.has(p.name)));
  assert.equal(w.travelDays, 13, 'race day is an ordinary trip day, nothing is added');
});

test('undated trips are journeys but add no days, and are not planned', () => {
  const japan = trips.find((t) => t.id === 'japan-trip-1')!;
  assert.equal(tripStatus(japan, TODAY), 'undated');
  const aus = trips.find((t) => t.id === 'australia-2026')!;
  assert.equal(tripStatus(aus, TODAY), 'completed');
  assert.equal(tripStatus(aus, '2026-10-10'), 'ongoing');
  assert.equal(tripStatus(aus, '2026-10-01'), 'planned');
});

test('map: no visited markers until confirmed; NEXT dreams planned; other dreams as dreams', () => {
  const { points, notOnMap } = buildMapPoints(trips, places, dreams, TODAY);
  assert.equal(points.filter((p) => p.kind === 'visited').length, 0);
  assert.deepEqual(points.filter((p) => p.kind === 'planned').map((p) => p.id).sort(), ['kazakhstan-2027', 'shanghai-2027']);
  assert.equal(points.filter((p) => p.kind === 'dream').length, 3);
  assert.equal(notOnMap.filter((n) => n.reason === 'not-confirmed').length, 10);
  for (const p of points) assert.ok(p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180, p.id);
});

test('confirmed places with TODO coordinates are listed, not plotted', () => {
  const extra: Place = { ...places[0]!, id: 'x', name: 'No coords yet', visit_confirmed: true, lat: 'TODO', lng: 'TODO' };
  const { points, notOnMap } = buildMapPoints(trips, [...places, extra], [], TODAY);
  assert.equal(points.some((p) => p.id === 'x'), false);
  assert.deepEqual(notOnMap.filter((n) => n.reason === 'no-coordinates').map((n) => n.name), ['No coords yet']);
});

test('timeline: years ascending, dreams after trips, undated journeys last', () => {
  const groups = buildTimeline(trips, places, dreams, TODAY);
  assert.deepEqual(groups.map((g) => g.key), ['2026', '2027', '2028', 'someday', 'undated']);
  assert.deepEqual(groups[1]!.items.map((i) => i.id), ['kazakhstan-2027', 'shanghai-2027'], 'May before an unknown month');
  assert.equal(groups[0]!.items[0]!.detail, '10 places to confirm');
  assert.equal(groups.at(-1)!.items.length, 2);
});

test('wrapped 2026 counts the trip, not unconfirmed places', () => {
  assert.deepEqual(wrappedYears(trips, TODAY), [2026]);
  const w = computeWrapped(2026, trips, places, TODAY);
  assert.equal(w.trips.length, 1);
  assert.equal(w.travelDays, 13);
  assert.deepEqual(w.countries, ['AU']);
  assert.deepEqual(w.months, ['2026-10']);
  assert.equal(w.places.length, 0);
  assert.equal(w.undatedTrips, 2);
});

test('trip spanning New Year splits its days across both years', () => {
  const t: Trip = { id: 'ny', name: 'NY', country_code: 'JP', start_date: '2026-12-30', end_date: '2027-01-02', cities: [], tags: [], summary: 'TODO', hero_place_id: null };
  assert.equal(computeWrapped(2026, [t], [], '2027-02-01').travelDays, 2);
  assert.equal(computeWrapped(2027, [t], [], '2027-02-01').travelDays, 2);
});

test('dream countdown counts to the 1st of the target month', () => {
  const kz = dreams.find((d) => d.id === 'kazakhstan-2027')!;
  assert.equal(daysUntilDream(kz, TODAY), 190);
  assert.equal(daysUntilDream(dreams.find((d) => d.id === 'shanghai-2027')!, TODAY), null, 'no month, no countdown');
});
