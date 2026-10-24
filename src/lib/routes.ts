/**
 * Route list shared by the client router and the build step that writes one
 * index.html per route (so deep links return 200 on GitHub Pages).
 */

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
}

/**
 * Page module and data files per route pattern. Used by the client (to start fetches early)
 * and by the build (to add <link rel="preload"> / modulepreload to each route's HTML).
 */
const S = 'speaklog/sessions.json';
const ROUTE_ASSETS: { pattern: RegExp; module: string; data: string[] }[] = [
  { pattern: /^\/$/, module: 'src/pages/home.ts', data: [S, 'speaklog/plan.json', 'trips.json', 'places.json', 'dreams.json'] },
  { pattern: /^\/speaklog$/, module: 'src/pages/speaklog/dashboard.ts', data: [S, 'speaklog/library.json', 'speaklog/phrases.json', 'speaklog/plan.json'] },
  { pattern: /^\/speaklog\/activities$/, module: 'src/pages/speaklog/activities.ts', data: [S] },
  { pattern: /^\/speaklog\/activities\/[^/]+$/, module: 'src/pages/speaklog/activity.ts', data: [S] },
  { pattern: /^\/speaklog\/mistakes$/, module: 'src/pages/speaklog/mistakes.ts', data: [S] },
  { pattern: /^\/speaklog\/phrases$/, module: 'src/pages/speaklog/phrases.ts', data: ['speaklog/phrases.json', 'speaklog/rescues.json'] },
  { pattern: /^\/speaklog\/library$/, module: 'src/pages/speaklog/library.ts', data: ['speaklog/library.json'] },
  { pattern: /^\/speaklog\/plan$/, module: 'src/pages/speaklog/plan.ts', data: ['speaklog/plan.json'] },
  { pattern: /^\/speaklog\/readiness$/, module: 'src/pages/speaklog/readiness.ts', data: [S, 'speaklog/plan.json'] },
  { pattern: /^\/speaklog\/journal$/, module: 'src/pages/speaklog/journal.ts', data: ['speaklog/journal.json'] },
  { pattern: /^\/speaklog\/import$/, module: 'src/pages/speaklog/import.ts', data: [S] },
  { pattern: /^\/miles$/, module: 'src/pages/miles/explore.ts', data: ['trips.json', 'places.json', 'dreams.json'] },
  { pattern: /^\/miles\/journeys$/, module: 'src/pages/miles/journeys.ts', data: ['trips.json', 'places.json', 'races.json'] },
  { pattern: /^\/miles\/journeys\/[^/]+$/, module: 'src/pages/miles/journey.ts', data: ['trips.json', 'places.json', 'races.json'] },
  { pattern: /^\/miles\/places$/, module: 'src/pages/miles/places.ts', data: ['places.json'] },
  { pattern: /^\/miles\/places\/[^/]+$/, module: 'src/pages/miles/place.ts', data: ['places.json', 'trips.json'] },
  { pattern: /^\/miles\/timeline$/, module: 'src/pages/miles/timeline.ts', data: ['trips.json', 'places.json', 'dreams.json'] },
  { pattern: /^\/miles\/wrapped(\/\d{4})?$/, module: 'src/pages/miles/wrapped.ts', data: ['trips.json', 'places.json'] },
  { pattern: /^\/dreams$/, module: 'src/pages/dreams.ts', data: ['dreams.json'] },
  { pattern: /^\/about$/, module: 'src/pages/about.ts', data: [] },
];

export function routeAssets(path: string): { module: string; data: string[] } | null {
  const hit = ROUTE_ASSETS.find((r) => r.pattern.test(path));
  return hit ? { module: hit.module, data: hit.data } : null;
}

import type { Place, Session, Trip } from './types.ts';
import { wrappedYears } from './travel.ts';

const SITE = 'PURINAT LIFE OS';

/**
 * Static home hero. The build writes it into the root index.html so the largest text paints
 * immediately (LCP); home.ts renders the identical markup, so nothing moves when data arrives.
 */
export const HOME_HERO_HTML =
  '<section class="hero" aria-labelledby="home-title"><h1 id="home-title" tabindex="-1">PURINAT <span>LIFE OS</span></h1><p>Train English like an endurance sport. Collect places like miles.</p></section>';

export const STATIC_ROUTES: RouteMeta[] = [
  { path: '/', title: SITE, description: 'English training log (SPEAKLOG) and travel passport (MILES).' },
  { path: '/speaklog', title: 'SPEAKLOG Dashboard', description: 'English training dashboard: streak, weekly volume, skills and personal bests.' },
  { path: '/speaklog/activities', title: 'Activities · SPEAKLOG', description: 'Every English practice session.' },
  { path: '/speaklog/mistakes', title: 'Mistake Memory · SPEAKLOG', description: 'Recurring error patterns and this week’s focus.' },
  { path: '/speaklog/phrases', title: 'Phrase Bank · SPEAKLOG', description: 'Natural phrases by situation, plus Sentence Rescue.' },
  { path: '/speaklog/library', title: 'Library · SPEAKLOG', description: 'Movies, series, podcasts and videos used for training.' },
  { path: '/speaklog/plan', title: 'Training Plan · SPEAKLOG', description: 'Base, Build, Trip-Specific, Peak and Taper phases.' },
  { path: '/speaklog/readiness', title: 'Trip Readiness · SPEAKLOG', description: 'Readiness per travel scenario.' },
  { path: '/speaklog/journal', title: 'Journal · SPEAKLOG', description: 'Personal English notes by topic.' },
  { path: '/speaklog/import', title: 'Import a Session Card · SPEAKLOG', description: 'Validate a Session Card and get the merged JSON to commit.' },
  { path: '/miles', title: 'Explore · MILES', description: 'Map of visited places, planned trips and dreams.' },
  { path: '/miles/journeys', title: 'Journeys · MILES', description: 'Every trip, one journey at a time.' },
  { path: '/miles/places', title: 'Places · MILES', description: 'One photo per place.' },
  { path: '/miles/timeline', title: 'Timeline · MILES', description: 'Journeys and dreams by year.' },
  { path: '/miles/wrapped', title: 'Travel Wrapped · MILES', description: 'A yearly travel summary.' },
  { path: '/dreams', title: 'Dream Board', description: 'Next trips, dreams, conditions and backups.' },
  { path: '/about', title: 'About', description: 'About this site and how its numbers are calculated.' },
];

export function fullTitle(title: string): string {
  return title === SITE ? SITE : `${title} | ${SITE}`;
}

/** Normalises a path relative to the base: leading slash, no trailing slash (except "/"). */
export function normalizePath(path: string): string {
  let p = path.split(/[?#]/)[0] ?? '/';
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/{2,}/g, '/');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  if (p.endsWith('/index.html')) p = p.slice(0, -'/index.html'.length) || '/';
  return p;
}

/** Routes generated from the data (one page per trip, place, session and Wrapped year). */
export function dynamicRoutes(trips: Trip[], places: Place[], sessions: Session[], today: string): RouteMeta[] {
  return [
    ...trips.map((t) => ({ path: `/miles/journeys/${t.id}`, title: `${t.name} · Journeys`, description: `${t.name}: journey in MILES.` })),
    ...places.map((p) => ({ path: `/miles/places/${p.id}`, title: `${p.name} · Places`, description: `${p.name}, ${p.city}.` })),
    ...sessions.map((s) => ({ path: `/speaklog/activities/${s.id}`, title: `${s.topic} · Activities`, description: `SPEAKLOG session on ${s.date}.` })),
    ...wrappedYears(trips, today).map((y) => ({ path: `/miles/wrapped/${y}`, title: `Travel Wrapped ${y} · MILES`, description: `Travel summary for ${y}.` })),
  ];
}
