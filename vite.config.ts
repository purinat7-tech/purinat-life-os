import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { HOME_HERO_HTML, STATIC_ROUTES, dynamicRoutes, fullTitle, routeAssets, type RouteMeta } from './src/lib/routes.ts';
import { todayIso } from './src/lib/dates.ts';
import type { PlacesFile, SessionsFile, TripsFile } from './src/lib/types.ts';

/**
 * Base path for GitHub Pages project sites, e.g. BASE_PATH=/purinat-life-os/ (set by the workflow
 * from actions/configure-pages). Locally it defaults to "/".
 */
function basePath(): string {
  const raw = (process.env.BASE_PATH ?? '/').trim() || '/';
  const withLeading = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

const ROOT = path.dirname(fileURLToPath(import.meta.url));
/** LIFEOS_DATA_DIR lets local visual tests point at synthetic fixtures. CI never sets it. */
const DATA_DIR = path.resolve(ROOT, process.env.LIFEOS_DATA_DIR ?? 'data');

function listFiles(dir: string, prefix = ''): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    return statSync(full).isDirectory() ? listFiles(full, rel) : [rel];
  });
}

const readJson = <T>(rel: string): T => JSON.parse(readFileSync(path.join(DATA_DIR, rel), 'utf8')) as T;

/** Serves /data in dev and publishes it as <base>data/ in the build. */
function dataFiles(): Plugin {
  let base = '/';
  return {
    name: 'lifeos-data',
    configResolved(c: ResolvedConfig) {
      base = c.base;
    },
    configureServer(server) {
      server.watcher.add(DATA_DIR);
      server.watcher.on('change', (file) => {
        if (file.startsWith(DATA_DIR)) server.ws.send({ type: 'full-reload' });
      });
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0] ?? '';
        const prefix = `${base}data/`;
        if (!url.startsWith(prefix)) return next();
        const rel = decodeURIComponent(url.slice(prefix.length));
        const file = path.resolve(DATA_DIR, rel);
        if (!file.startsWith(DATA_DIR + path.sep) || !existsSync(file) || !file.endsWith('.json')) return next();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(readFileSync(file));
      });
    },
    generateBundle() {
      for (const rel of listFiles(DATA_DIR).filter((f) => f.endsWith('.json'))) {
        this.emitFile({ type: 'asset', fileName: `data/${rel}`, source: readFileSync(path.join(DATA_DIR, rel)) });
      }
    },
  };
}

function dataRoutes(): RouteMeta[] {
  return dynamicRoutes(
    readJson<TripsFile>('trips.json').trips,
    readJson<PlacesFile>('places.json').places,
    readJson<SessionsFile>('speaklog/sessions.json').sessions,
    todayIso(),
  );
}

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

type ManifestEntry = { file: string; imports?: string[]; isEntry?: boolean };

/**
 * Writes <route>/index.html for every route so deep links return 200 on GitHub Pages, plus 404.html.
 * Each page preloads exactly the data files and page code its route needs, so they download in
 * parallel with the main bundle instead of after it.
 */
function routePages(): Plugin {
  let outDir = 'dist';
  let base = '/';
  return {
    name: 'lifeos-route-pages',
    apply: 'build',
    configResolved(c) {
      outDir = path.resolve(c.root, c.build.outDir);
      base = c.base;
    },
    closeBundle() {
      const indexFile = path.join(outDir, 'index.html');
      if (!existsSync(indexFile)) return;
      const manifestFile = path.join(outDir, '.vite', 'manifest.json');
      const manifest: Record<string, ManifestEntry> = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
      rmSync(path.join(outDir, '.vite'), { recursive: true, force: true }); // build metadata, not for publishing
      const entryFile = Object.values(manifest).find((m) => m.isEntry)?.file;
      const chunkFiles = (key: string, seen = new Set<string>()): string[] => {
        const m = manifest[key];
        if (!m || seen.has(key)) return [];
        seen.add(key);
        return [m.file, ...(m.imports ?? []).flatMap((k) => chunkFiles(k, seen))];
      };
      const shell = readFileSync(indexFile, 'utf8');
      const page = (meta: RouteMeta, extraHead = '') => {
        const assets = routeAssets(meta.path);
        const modules = assets ? [...new Set(chunkFiles(assets.module))].filter((f) => f !== entryFile) : [];
        const preloads = [
          ...(assets?.data ?? []).map((d) => `<link rel="preload" href="${base}data/${d}" as="fetch" crossorigin>`),
          ...modules.map((f) => `<link rel="modulepreload" crossorigin href="${base}${f}">`),
        ].join('\n    ');
        return shell
          .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeAttr(fullTitle(meta.title))}</title>`)
          .replace(/<meta name="description" content="[^"]*"\s*\/?>/, () => `<meta name="description" content="${escapeAttr(meta.description)}" />${extraHead}`)
          .replace('</head>', () => (preloads ? `  ${preloads}\n  </head>` : '</head>'));
      };
      const routes = [...STATIC_ROUTES, ...dataRoutes()];
      for (const meta of routes) {
        const file = meta.path === '/' ? indexFile : path.join(outDir, meta.path.slice(1), 'index.html');
        mkdirSync(path.dirname(file), { recursive: true });
        let htmlOut = page(meta);
        if (meta.path === '/') htmlOut = htmlOut.replace('<div class="wrap page" id="app">', () => `<div class="wrap page" id="app">\n        ${HOME_HERO_HTML}`);
        writeFileSync(file, htmlOut);
      }
      writeFileSync(path.join(outDir, '404.html'), page({ path: '/404', title: 'Page not found', description: 'Page not found.' }, '\n    <meta name="robots" content="noindex" />'));
      console.log(`lifeos-route-pages: wrote ${routes.length} route pages + 404.html`);
    },
  };
}

/** Generates sw.js with the list of hashed assets to precache. */
function serviceWorker(): Plugin {
  let base = '/';
  let publicDir = 'public';
  return {
    name: 'lifeos-sw',
    apply: 'build',
    enforce: 'post',
    configResolved(c) {
      base = c.base;
      publicDir = c.publicDir;
    },
    generateBundle(_options, bundle) {
      // Precache the small app shell only. Large lazy chunks (MapLibre, the Ajv-based import tool)
      // are cached at runtime the first time a visitor opens those pages.
      const sizeOf = (f: string) => {
        const item = bundle[f];
        if (!item) return 0;
        return item.type === 'chunk' ? item.code.length : typeof item.source === 'string' ? item.source.length : item.source.byteLength;
      };
      const assets = Object.keys(bundle).filter(
        (f) => !f.endsWith('.map') && !f.startsWith('data/') && !f.endsWith('.html') && f !== 'sw.js' && !/maplibre/i.test(f) && sizeOf(f) <= 60_000,
      );
      const publicFiles = ['config.js', 'manifest.webmanifest', 'icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'].filter((f) =>
        existsSync(path.join(publicDir, f)),
      );
      const precache = [`${base}index.html`, ...assets.map((f) => base + f), ...publicFiles.map((f) => base + f)];
      const hash = createHash('sha256').update(JSON.stringify(precache));
      for (const f of publicFiles) hash.update(readFileSync(path.join(publicDir, f)));
      const template = readFileSync(path.join(ROOT, 'src/sw-template.js'), 'utf8');
      const source = template
        .replace('__VERSION__', () => hash.digest('hex').slice(0, 12))
        .replace('__BASE__', () => base)
        .replace('[/* __PRECACHE__ */]', () => JSON.stringify(precache));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: basePath(),
  plugins: [dataFiles(), routePages(), serviceWorker()],
  build: {
    manifest: true,
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
