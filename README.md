# PURINAT LIFE OS

A personal, public, mobile-first website with two modules:

- **SPEAKLOG**: an English-training log that works like an endurance-training dashboard: activities, weekly volume, skill trends, practice calendar, personal bests, a periodised training plan and trip readiness.
- **MILES**: a travel passport: a world map, journeys, one hero photo per place, a timeline, a Dream Board and a yearly Travel Wrapped.

It is a static site (Vite + TypeScript, no framework, no backend, no database) deployed to GitHub Pages by GitHub Actions. **The JSON files in `/data` are the only source of truth.** Every number on the site is calculated from them; nothing is estimated or randomised, and empty sections say "No data yet".

> ## ⚠️ Never commit sensitive data
> This repository and the website are **public**. Never put these in any file:
> passport numbers, booking references, flight numbers, accommodation addresses, payment details, phone numbers or e-mail addresses.
> Never commit original photos: they contain GPS location, device details and timestamps. Put originals in `photos-src/` (git-ignored) and run `npm run images`, which publishes cleaned copies only.
> `npm run validate:data` blocks e-mails, phone numbers, card numbers and sensitive field names, and warns about text that looks like a flight number, booking reference or passport number. It is a safety net, not a guarantee: check before you commit.

---

## Contents

1. [Run it on your computer](#1-run-it-on-your-computer)
2. [Publish on GitHub Pages](#2-publish-on-github-pages)
3. [Add a trip, a place or a dream](#3-add-a-trip-a-place-or-a-dream)
4. [Add a Session Card](#4-add-a-session-card)
5. [Map setup and API key](#5-map-setup-and-api-key)
6. [Scripts](#6-scripts)
7. [How it is built](#7-how-it-is-built)
8. [Troubleshooting](#8-troubleshooting)
9. [Known limitations](#9-known-limitations)

---

## 1. Run it on your computer

Requirements: **Node.js 22.18 or newer** (Node 24 LTS recommended) and Git.

```bash
npm install          # first time only; creates package-lock.json (commit it)
npm run dev          # http://localhost:5173
npm run check        # lint + type-check + validate data + tests + build + verify build
```

To see how SPEAKLOG looks with data, use the synthetic demo set (never published):

```bash
LIFEOS_DATA_DIR=tests/fixtures/demo-data npm run dev
```

On Windows PowerShell: `$env:LIFEOS_DATA_DIR="tests/fixtures/demo-data"; npm run dev`.

## 2. Publish on GitHub Pages

1. **Create a repository** on GitHub, for example `purinat-life-os`. It must be **public** for free GitHub Pages.
2. **Push this folder** to the `main` branch:
   ```bash
   git init -b main
   git add .
   git commit -m "PURINAT LIFE OS"
   git remote add origin https://github.com/<your-user>/purinat-life-os.git
   git push -u origin main
   ```
3. **Enable Pages:** repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. **Run the workflow:** the push triggers **Actions → Deploy to GitHub Pages**. If the push happened before step 3, open the workflow and click **Run workflow**.
5. **Open the site:** `https://<your-user>.github.io/purinat-life-os/`. The link also appears on the `deploy` job.
6. **Commit the lock file:** after your first local `npm install`, commit `package-lock.json`. CI then uses `npm ci` for repeatable installs.

What the workflow does (`.github/workflows/deploy.yml`):

| Job | Runs on | Steps |
|---|---|---|
| `build` | every push to `main` and every pull request | install → lint → type-check → `validate:data` → tests → build → `check:dist` → upload |
| `deploy` | push to `main` / manual run | publishes to GitHub Pages |
| `lighthouse` | after each deploy | Lighthouse (mobile emulation) on Home, SPEAKLOG and MILES. Fails the job if Performance < 85 or Accessibility < 90 (median of 3 runs). Reports are in the run's artifacts. |

**Base path:** a project site lives at `/<repo>/`. The workflow reads it from `actions/configure-pages` and passes it to the build as `BASE_PATH`, so every link, asset and data file works under it. A user site (`<user>.github.io`) or a custom domain gets `/` automatically.

**Deep links:** the build writes one `index.html` per route (e.g. `speaklog/import/index.html`), so every page URL returns HTTP 200 on GitHub Pages; unknown URLs get `404.html`.

## 3. Add a trip, a place or a dream

Edit the JSON in `/data`, run `npm run validate:data`, commit, push. In VS Code each file gets autocomplete and inline errors from its `"$schema"`.

Use the literal string `"TODO"` for anything you do not know yet. TODO values never count in statistics, never become map markers, and show as "TODO" or "Not rated yet" on the site.

### A trip (`data/trips.json`)

```json
{
  "id": "japan-2019",
  "name": "Japan 2019",
  "country_code": "JP",
  "start_date": "2019-04-02",
  "end_date": "2019-04-10",
  "cities": ["Tokyo", "Kyoto"],
  "tags": ["food", "landmark"],
  "summary": "TODO",
  "hero_place_id": "TODO"
}
```

- The same country visited twice = **two trips** with different ids. The two Japan trips are already there with TODO dates; fill them in, and rename the ids if you like (also update `trip_id` of their places).
- Optional `road_trip_km` (number) feeds the **Road-trip km** stat.
- `hero_place_id` must be the id of a place on that trip.
- **Races** (e.g. the Melbourne Marathon) go in `data/races.json`, never in places. A race appears only as a badge on its journey. It is excluded from every statistic, map count and Wrapped.

### A place (`data/places.json`), with exactly one hero photo

1. Put the original photo in `photos-src/`, named after the place id, e.g. `photos-src/twelve-apostles.jpg`. This folder is git-ignored.
2. Run `npm run images`. It writes `public/images/places/twelve-apostles.webp`: at most 1600 px, WebP, under 300 KB, rotated upright, with **all metadata removed** (EXIF incl. GPS, device, timestamps; XMP; IPTC; ICC). It refuses to write a file if any metadata survives. HEIC is not supported: export as JPEG first.
3. Edit the place:
   ```json
   {
     "id": "twelve-apostles",
     "trip_id": "australia-2026",
     "name": "Twelve Apostles",
     "city": "Port Campbell",
     "country_code": "AU",
     "visit_confirmed": true,
     "lat": -38.66583,
     "lng": 143.10444,
     "coord_source": "https://en.wikipedia.org/wiki/The_Twelve_Apostles_(Victoria)",
     "coord_verified": true,
     "visited_date": "2026-10-13",
     "category": ["nature", "landmark", "photography"],
     "rating": 5,
     "memory": "One short sentence.",
     "photo": "images/places/twelve-apostles.webp",
     "photo_alt": "Limestone stacks in the sea at sunset",
     "camera": "optional", "lens": "optional", "focal_length_mm": 35, "best_time": "Sunset"
   }
   ```
4. `npm run validate:data` fails if the photo is missing, not WebP, over 1600 px, over 300 KB or still has EXIF/XMP. It also fails on invalid or one-sided coordinates, duplicate ids and dates outside the trip.

**Confirmed visits only.** A place counts as a visit only when `"visit_confirmed": true`. Suggested places stay `false`: they are labelled "Not confirmed", get no map marker, and are excluded from every count and from Wrapped. All 10 seed places are suggestions until you confirm them.

Categories (also the map filter chips): `nature, landmark, beach, mountain, road-trip, coffee, food, shopping, photography, hiking`. The stats count coffee shops (`coffee`), restaurants (`food`), hiking spots (`hiking`), beaches (`beach`) and photography spots (`photography`).

The seed coordinates were looked up from Wikipedia, OpenStreetMap and official tourism pages. They are marked `"coord_verified": false` and the validator lists them as warnings until you check them and set `true`. **Henry Lawson Reserve** is the reserve at McMahons Point; its point comes from OpenStreetMap beside the reserve on Henry Lawson Avenue.

### A dream (`data/dreams.json`)

Statuses: `NEXT`, `CONDITIONAL`, `BACKUP`, `DREAM`. Use `depends_on` for a condition (`"Lottery result"`) and `backup_of` for the id of the dream it replaces (`"chamonix-2028"`). Optional: `target_month`, `budget_thb_per_person`, `priority` (1 = highest), `lat`/`lng` for the map marker. NEXT dreams show as planned markers and get a countdown when the month is known.

## 4. Add a Session Card

1. Open **`/speaklog/import`** on the site (or locally).
2. Paste the card JSON. Use one card, or an array of cards:
   ```json
   {
     "id": "2026-10-24-001",
     "date": "2026-10-24",
     "type": "speaking",
     "duration_min": 18,
     "topic": "Australia trip",
     "scores": { "fluency": 3.2, "grammar": 3.5, "vocabulary": 3.4, "communication": 4.0 },
     "strength": "Continuous storytelling",
     "focus": "Past tense consistency",
     "corrections": [{ "said": "I very enjoy Sydney.", "natural": "I really enjoyed Sydney.", "tag": "past-tense" }],
     "new_phrases": ["The highlight of the trip was..."],
     "coach_note": "Try telling longer stories without translating from Thai first."
   }
   ```
3. Click **Validate and preview**. It checks the card against `schemas/session-card.schema.json`, the id/date rule, duplicates and sensitive data, and previews the card.
4. **Copy** or **Download** the merged `sessions.json`, replace `data/speaklog/sessions.json` in the repository, commit and push. The site updates after the workflow finishes.

The import page **never publishes anything**. "Preview on this device" stores the card in your browser's localStorage only, so you can see it on the dashboard with a "Local preview" label; other visitors never see it.

Card rules: scores are **0–5** (charts show ×20 as 0–100) and must come from your own or your coach's assessment. Types: `speaking, listening, movie, reading, shadowing, travel-simulation, storytelling`. A travel simulation needs `"scenario"` (`airport, hotel, restaurant, shopping, car-rental, small-talk, storytelling, problem-solving`) to count toward Trip Readiness. Optional: `comprehension_pct` (listening/movies), `library_id`, `scores.listening`. Pronunciation is not scored.

Other SPEAKLOG files are edited by hand: `phrases.json` (Phrase Bank), `rescues.json` (the Sentence Rescue form on the Phrase Bank page builds the JSON for you), `library.json`, `journal.json` and `plan.json`. In `plan.json`, the next trip is Kazakhstan, May 2027 (tentative). The phases, weekly goals and weekly template are **defaults** marked `"is_default": true`; change them and set it to `false`.

## 5. Map setup and API key

All map settings are in **`public/config.js`**, the only place a tile style URL or key appears.

- **Default, no key:** OpenFreeMap (`positron` light / `dark` styles). It is free, needs no registration and sets no cookies. Attribution ("OpenFreeMap © OpenMapTiles Data from OpenStreetMap") is shown automatically by the map.
- **Optional, MapTiler or another provider:**
  ```js
  styleUrl:     "https://api.maptiler.com/maps/dataviz-v4-light/style.json?key={key}",
  styleUrlDark: "https://api.maptiler.com/maps/dataviz-v4-dark/style.json?key={key}",
  apiKey:       "YOUR_KEY",
  ```
  `{key}` is replaced with `apiKey`. If the keyed style fails (missing key, rejected origin, offline), the map automatically falls back to the keyless style. If no style loads, or the browser lacks WebGL2, Explore shows the accessible place list instead.

### Restrict the key by allowed origin (required)

A key in `config.js` is **public**: anyone can read it in the browser. Lock it to your site:

1. MapTiler Cloud → **API keys** → your key → **Edit**.
2. Under **Allowed HTTP origins**, add one origin per line, without protocol or port:
   ```
   <your-user>.github.io
   ```
   Add `localhost` only while developing, then remove it. Do not add `?` (it allows requests with no Origin header).
3. Save, reload the site, and confirm the map still loads. Open the site from another origin to confirm the key is refused there; the fallback style should appear.
4. Also set a usage limit or alert. Origin checks stop other websites, not scripts that fake headers.

Other providers have the same feature under names like "allowed referrers" or "domain restrictions". MapTiler's Free plan also requires its logo to be shown; see their attribution guide.

## 6. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload (also reloads when `/data` changes) |
| `npm run build` | Production build into `dist/` (set `BASE_PATH=/repo/` to mimic GitHub Pages) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript (app, scripts and tests) |
| `npm run validate:data` | JSON Schema + ids + references + coordinates + photos + sensitive-data checks. Exit 1 on errors. |
| `npm test` | Unit and integration tests (Node's built-in test runner) |
| `npm run images` | Optimise photos from `photos-src/` into `public/images/places/` (needs `sharp`) |
| `npm run check:dist` | Verify the build: route pages, service-worker precache, data copy, no stray photos |
| `npm run check` | All of the above in CI order |

## 7. How it is built

```
.github/workflows/deploy.yml   CI: checks, build, deploy, Lighthouse
data/                          the data (source of truth)
  trips.json places.json dreams.json races.json
  speaklog/ sessions.json phrases.json rescues.json library.json journal.json plan.json
schemas/                       JSON Schemas (draft 2020-12) for every data file + the Session Card
public/
  config.js                    map style URL / key (the only place)
  manifest.webmanifest icons/  PWA
  images/places/               published photos (WebP, cleaned)
scripts/
  validate-data.ts             npm run validate:data
  optimize-images.ts           npm run images
  check-dist.ts                npm run check:dist
  lib/webp.ts lib/images.ts
src/
  main.ts router.ts            app shell, client router (History API, base-path aware)
  lib/                         pure logic: stats, dates, schemas helpers, sensitive-data scan (unit-tested)
  pages/                       one module per page (code-split)
  components/                  UI pieces and hand-rolled SVG/HTML charts
  styles/main.css              design tokens (one accent colour, light + dark)
  sw-template.js               service worker (PWA, offline after first visit)
tests/                         node:test suites + synthetic demo data
vite.config.ts                 publishes /data, writes a page per route with preloads, generates sw.js
```

Design choices: no UI framework and no chart library (charts are small hand-written SVG/HTML). MapLibre GL JS v6 loads only on the Explore page; the import page's validator (Ajv) loads only on the import page. The main bundle is about 15 KB gzipped. Each route's HTML preloads exactly the data and code it needs. System fonts only.

## 8. Troubleshooting

- **"Configure Pages" step fails:** Pages is not enabled, or its source is not "GitHub Actions" (see §2 step 3).
- **Site loads but has no styling, or pages 404:** the base path is wrong. The workflow sets it automatically; for a local test of the Pages build run `BASE_PATH=/purinat-life-os/ npm run build`, then `BASE_PATH=/purinat-life-os/ npm run preview` and open `http://localhost:4173/purinat-life-os/`.
- **Map shows "not available":** offline, the style URL is wrong, the key's allowed origins don't include your domain, or the browser has no WebGL2. The browser console says which style failed (it never prints the key).
- **New data not visible:** wait for the workflow to finish; GitHub Pages caches files for up to 10 minutes.
- **`npm run images` fails on a photo:** HEIC is not supported (export as JPEG). A photo that cannot get under 300 KB even at 1000 px is extremely detailed; crop it.

## 9. Known limitations

- Lighthouse runs in CI after each deploy. Until the first deploy there are no real Lighthouse numbers.
- Data changes need a commit and a deploy (about 1–2 minutes); there is no online editor by design.
- Country names come from the browser; flag emoji show as two letters on Windows desktop.
- Stats count what is in the data. TODO dates, coordinates and categories are skipped, so numbers grow as TODOs are filled in.
