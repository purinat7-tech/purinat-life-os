import { html } from './lib/html.ts';
import { fullTitle, normalizePath } from './lib/routes.ts';
import { todayIso } from './lib/dates.ts';
import { appPath, BASE, href } from './base.ts';
import { prefetchFor } from './data.ts';
import { setNavigator } from './nav.ts';
import { NotFoundError, type PageHandler, type RouteContext, type Section, type View } from './view.ts';
import home from './pages/home.ts';

type Loader = () => Promise<{ default: PageHandler }>;
interface Route {
  pattern: RegExp;
  keys: string[];
  load: Loader;
}

function route(path: string, load: Loader): Route {
  const keys: string[] = [];
  const source = path.replace(/:([a-z]+)/gi, (_m, key: string) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { pattern: new RegExp(`^${source}$`), keys, load };
}

const ROUTES: Route[] = [
  route('/', () => Promise.resolve({ default: home })),
  route('/speaklog', () => import('./pages/speaklog/dashboard.ts')),
  route('/speaklog/activities', () => import('./pages/speaklog/activities.ts')),
  route('/speaklog/activities/:id', () => import('./pages/speaklog/activity.ts')),
  route('/speaklog/mistakes', () => import('./pages/speaklog/mistakes.ts')),
  route('/speaklog/phrases', () => import('./pages/speaklog/phrases.ts')),
  route('/speaklog/library', () => import('./pages/speaklog/library.ts')),
  route('/speaklog/plan', () => import('./pages/speaklog/plan.ts')),
  route('/speaklog/readiness', () => import('./pages/speaklog/readiness.ts')),
  route('/speaklog/journal', () => import('./pages/speaklog/journal.ts')),
  route('/speaklog/import', () => import('./pages/speaklog/import.ts')),
  route('/miles', () => import('./pages/miles/explore.ts')),
  route('/miles/journeys', () => import('./pages/miles/journeys.ts')),
  route('/miles/journeys/:id', () => import('./pages/miles/journey.ts')),
  route('/miles/places', () => import('./pages/miles/places.ts')),
  route('/miles/places/:id', () => import('./pages/miles/place.ts')),
  route('/miles/timeline', () => import('./pages/miles/timeline.ts')),
  route('/miles/wrapped', () => import('./pages/miles/wrapped.ts')),
  route('/miles/wrapped/:year', () => import('./pages/miles/wrapped.ts')),
  route('/dreams', () => import('./pages/dreams.ts')),
  route('/about', () => import('./pages/about.ts')),
];

function match(path: string): { route: Route; params: Record<string, string> } | null {
  for (const r of ROUTES) {
    const m = r.pattern.exec(path);
    if (!m) continue;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => {
      params[k] = decodeURIComponent(m[i + 1] ?? '');
    });
    return { route: r, params };
  }
  return null;
}

const SKELETON = '<div class="skeleton" aria-hidden="true"><div></div><div></div><div></div><div></div></div><p class="sr-only" role="status">Loading…</p>';

function notFoundView(): View {
  return {
    title: 'Page not found',
    section: 'none',
    body: html`<header class="page-head"><div class="eyebrow">404</div><h1 tabindex="-1">Page not found</h1>
      <p class="lead">This page does not exist. It may have been renamed, or the data behind it has not been published yet.</p></header>
      <div class="btn-row"><a class="btn primary" href="${href('/')}">Go home</a><a class="btn" href="${href('/miles')}">Explore MILES</a><a class="btn" href="${href('/speaklog')}">Open SPEAKLOG</a></div>`,
  };
}

function errorView(error: unknown): View {
  const message = error instanceof Error ? error.message : String(error);
  return {
    title: 'Something went wrong',
    section: 'none',
    body: html`<header class="page-head"><div class="eyebrow">Error</div><h1 tabindex="-1">Couldn’t load this page</h1>
      <p class="lead">${message}</p></header>
      <p class="note">If you are offline, reconnect and try again.</p>
      <div class="btn-row mt"><button class="btn primary" type="button" data-action="retry">Try again</button><a class="btn" href="${href('/')}">Go home</a></div>`,
    mount(root) {
      root.querySelector('[data-action="retry"]')?.addEventListener('click', () => location.reload());
    },
  };
}

function setActiveNav(section: Section): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach((a) => {
    if (a.dataset.nav === section) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

let cleanup: (() => void) | undefined;
let token = 0;
/** pathname + search of the page currently rendered; a change of only the hash never re-renders. */
let renderedKey = '';

async function render(opts: { focus: boolean; restoreScroll?: number }): Promise<void> {
  const mine = ++token;
  renderedKey = location.pathname + location.search;
  const path = normalizePath(appPath(location.pathname));
  prefetchFor(path);
  const app = document.getElementById('app');
  if (!app) return;
  const slow = window.setTimeout(() => {
    if (mine === token) app.innerHTML = SKELETON;
  }, 180);

  let view: View;
  try {
    const found = match(path);
    if (!found) throw new NotFoundError(path);
    const mod = await found.route.load();
    const ctx: RouteContext = { path, params: found.params, query: new URLSearchParams(location.search), today: todayIso() };
    view = await mod.default(ctx);
  } catch (error) {
    if (!(error instanceof NotFoundError)) console.error(error);
    view = error instanceof NotFoundError ? notFoundView() : errorView(error);
  } finally {
    window.clearTimeout(slow);
  }
  if (mine !== token) return;

  cleanup?.();
  cleanup = undefined;
  app.innerHTML = view.body.value;
  document.title = fullTitle(view.title);
  setActiveNav(view.section);
  const result = view.mount?.(app);
  if (typeof result === 'function') cleanup = result;

  if (opts.restoreScroll !== undefined) {
    window.scrollTo(0, opts.restoreScroll);
  } else if (location.hash) {
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
  if (opts.focus) app.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
}

function go(to: string, opts: { replace?: boolean } = {}): void {
  history.replaceState({ ...(history.state as object | null), scrollY: window.scrollY }, '');
  if (opts.replace) history.replaceState({}, '', to);
  else history.pushState({}, '', to);
  void render({ focus: !opts.replace, restoreScroll: opts.replace ? window.scrollY : undefined });
}

export function startRouter(): void {
  history.scrollRestoration = 'manual';
  setNavigator(go);

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element | null)?.closest('a');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith(BASE)) return;
    if (/\.[a-z0-9]+$/i.test(url.pathname)) return; // files (data, images) are not routes
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return; // in-page anchor
    event.preventDefault();
    go(url.pathname + url.search + url.hash);
  });

  window.addEventListener('popstate', (event) => {
    if (location.pathname + location.search === renderedKey) {
      // Only the #hash changed (in-page link, skip link, back/forward between anchors): just scroll.
      if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      return;
    }
    const state = event.state as { scrollY?: number } | null;
    void render({ focus: true, restoreScroll: state?.scrollY });
  });

  void render({ focus: false });
}
