/**
 * npm run check:dist (after npm run build, with the same BASE_PATH)
 *
 * Verifies the build output before it is published:
 *   - every route has its own index.html (deep links return 200 on GitHub Pages), plus 404.html
 *   - every file the service worker precaches exists (a missing one would break offline install)
 *   - data/*.json in dist is identical to /data (the repository is the source of truth)
 *   - only photos referenced by data/places.json are published
 *   - no build metadata (.vite/) or source maps are published
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { STATIC_ROUTES, dynamicRoutes } from '../src/lib/routes.ts';
import { todayIso } from '../src/lib/dates.ts';
import type { PlacesFile, SessionsFile, TripsFile } from '../src/lib/types.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'data');
const base = (() => {
  const raw = (process.env.BASE_PATH ?? '/').trim() || '/';
  const lead = raw.startsWith('/') ? raw : `/${raw}`;
  return lead.endsWith('/') ? lead : `${lead}/`;
})();
const errors: string[] = [];
const files = (dir: string, prefix = ''): string[] =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((n) => (statSync(path.join(dir, n)).isDirectory() ? files(path.join(dir, n), `${prefix}${n}/`) : [`${prefix}${n}`]))
    : [];

if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error('✖ dist/index.html not found. Run npm run build first.');
  process.exit(1);
}
const read = <T>(rel: string): T => JSON.parse(readFileSync(path.join(DATA, rel), 'utf8')) as T;
const trips = read<TripsFile>('trips.json').trips;
const places = read<PlacesFile>('places.json').places;
const sessions = read<SessionsFile>('speaklog/sessions.json').sessions;

// 1. Route pages
const routes = [...STATIC_ROUTES, ...dynamicRoutes(trips, places, sessions, todayIso())];
for (const r of routes) {
  const file = r.path === '/' ? 'index.html' : `${r.path.slice(1)}/index.html`;
  if (!existsSync(path.join(DIST, file))) errors.push(`missing route page dist/${file}`);
}
for (const f of ['404.html', 'sw.js', 'config.js', 'manifest.webmanifest']) if (!existsSync(path.join(DIST, f))) errors.push(`missing dist/${f}`);
const indexHtml = readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!indexHtml.includes(`src="${base}config.js"`)) errors.push(`index.html does not load ${base}config.js (wrong BASE_PATH?)`);

// 2. Service worker precache
const sw = readFileSync(path.join(DIST, 'sw.js'), 'utf8');
const precacheMatch = /const PRECACHE = (\[.*?\]);/.exec(sw);
const precache = precacheMatch ? (JSON.parse(precacheMatch[1]!) as string[]) : [];
if (!precache.length) errors.push('sw.js has an empty precache list');
for (const url of precache) {
  if (!url.startsWith(base)) errors.push(`sw.js precaches ${url} outside the base path ${base}`);
  else if (!existsSync(path.join(DIST, url.slice(base.length) || 'index.html'))) errors.push(`sw.js precaches ${url}, which is not in dist`);
}

// 3. Published data equals the repository
const dataFiles = files(DATA).filter((f) => f.endsWith('.json'));
for (const f of dataFiles) {
  const out = path.join(DIST, 'data', f);
  if (!existsSync(out)) errors.push(`dist/data/${f} missing`);
  else if (!readFileSync(out).equals(readFileSync(path.join(DATA, f)))) errors.push(`dist/data/${f} differs from data/${f}`);
}

// 4. Only referenced photos are published
const referenced = new Set(places.map((p) => p.photo).filter((p) => p !== 'TODO'));
for (const f of files(path.join(DIST, 'images'), 'images/')) {
  if (path.basename(f).startsWith('.')) continue; // e.g. .gitkeep
  if (!referenced.has(f)) errors.push(`dist/${f} is published but no place uses it`);
}

// 5. No build metadata or source maps
const all = files(DIST);
if (all.some((f) => f.startsWith('.vite/'))) errors.push('dist/.vite/ (build metadata) must not be published');
if (all.some((f) => f.endsWith('.map'))) errors.push('source maps found in dist');

// Size report
const entry = /src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(indexHtml)?.[1];
const css = /href="([^"]*\/assets\/index-[^"]+\.css)"/.exec(indexHtml)?.[1];
const gz = (url?: string) => (url ? (gzipSync(readFileSync(path.join(DIST, url.slice(base.length)))).length / 1024).toFixed(1) : '?');
console.log(`check:dist (base ${base}): ${routes.length} route pages, ${precache.length} precached files, ${dataFiles.length} data files`);
console.log(`  main JS ${gz(entry)} KB gzip · CSS ${gz(css)} KB gzip`);
if (errors.length) {
  for (const e of errors) console.log(`  ✖ ${e}`);
  console.log(`✖ check:dist failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log('✔ check:dist passed.');
