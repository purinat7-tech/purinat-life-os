/**
 * MapLibre GL JS v6 wrapper. Loaded only on the Explore page.
 *
 * - Style URL / key come from public/config.js (see src/config.ts). Nothing is hard-coded here.
 * - The primary style is fetched first; if it fails (missing key, 401/403 from an origin
 *   restriction, offline), the keyless fallback style is used instead.
 * - Attribution is always shown (AttributionControl, compact).
 * - If WebGL2 is unavailable, the caller shows the accessible list instead.
 *
 * The small interface below describes only the MapLibre API this file uses, so the
 * app's type-check does not depend on the exact upstream type definitions.
 */
import { getMapConfig, styleCandidates } from '../../config.ts';
import type { MapPoint } from '../../lib/travel.ts';
import type { Theme } from '../../theme.ts';
import { href } from '../../base.ts';
// Official Vite setup for MapLibre v6: the worker must be bundled and its URL registered.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

interface LngLatBoundsLike {
  extend(point: [number, number]): LngLatBoundsLike;
}
interface MarkerLike {
  setLngLat(p: [number, number]): MarkerLike;
  addTo(map: MapLike): MarkerLike;
  remove(): void;
  getElement(): HTMLElement;
}
interface PopupLike {
  setLngLat(p: [number, number]): PopupLike;
  setDOMContent(node: Node): PopupLike;
  addTo(map: MapLike): PopupLike;
  remove(): void;
}
interface MapLike {
  addControl(control: unknown, position?: string): void;
  on(event: string, handler: (e: unknown) => void): void;
  once(event: string, handler: (e: unknown) => void): void;
  setStyle(style: unknown): void;
  fitBounds(bounds: LngLatBoundsLike, options?: Record<string, unknown>): void;
  flyTo(options: Record<string, unknown>): void;
  resize(): void;
  remove(): void;
}
interface MapLibreModule {
  Map: new (options: Record<string, unknown>) => MapLike;
  Marker: new (options: Record<string, unknown>) => MarkerLike;
  Popup: new (options: Record<string, unknown>) => PopupLike;
  NavigationControl: new (options: Record<string, unknown>) => unknown;
  AttributionControl: new (options: Record<string, unknown>) => unknown;
  LngLatBounds: new () => LngLatBoundsLike;
  setWorkerUrl?: (url: string) => void;
}

export interface MapHandle {
  setVisible(ids: Set<string>): void;
  setTheme(theme: Theme): void;
  focus(ids: Set<string>): void;
  destroy(): void;
}

export class MapUnavailableError extends Error {}

async function loadStyle(theme: Theme): Promise<{ style: unknown; usedFallback: boolean }> {
  const config = getMapConfig();
  if (!config) throw new MapUnavailableError('Map is not configured (public/config.js is missing).');
  const candidates = styleCandidates(config, theme);
  if (!candidates.length) throw new MapUnavailableError('No map style is configured in public/config.js.');
  let lastError = '';
  for (const [i, candidate] of candidates.entries()) {
    try {
      const res = await fetch(candidate.url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const style = (await res.json()) as { version?: number; sources?: unknown };
      if (style.version !== 8 || !style.sources) throw new Error('not a MapLibre style');
      const primaryConfigured = Boolean(theme === 'dark' ? config.styleUrlDark || config.styleUrl : config.styleUrl);
      return { style, usedFallback: i > 0 || !primaryConfigured };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      // Never log the URL: it may contain the API key.
      console.warn(`Map style ${i + 1}/${candidates.length} failed: ${lastError}`);
    }
  }
  throw new MapUnavailableError(`The map tiles could not be loaded (${lastError}). You may be offline.`);
}

export async function createMap(container: HTMLElement, points: MapPoint[], theme: Theme): Promise<MapHandle & { usedFallback: boolean }> {
  const [{ style, usedFallback }, mod] = await Promise.all([loadStyle(theme), import('maplibre-gl')]);
  const ml = mod as unknown as MapLibreModule;
  ml.setWorkerUrl?.(workerUrl);
  const config = getMapConfig();

  let map: MapLike;
  try {
    map = new ml.Map({
      container,
      style,
      center: [134, -25],
      zoom: 1.6,
      attributionControl: false,
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
  } catch (error) {
    // WebGL2 missing (GPUInitializationError) or blocked by the browser.
    throw new MapUnavailableError(`This browser cannot show the interactive map (${error instanceof Error ? error.name : 'WebGL2 unavailable'}).`);
  }
  // Without a listener MapLibre prints failing tile URLs (with the key) to the console.
  map.on('error', (event) => {
    const message = (event as { error?: { message?: string } }).error?.message ?? 'map error';
    console.warn(`Map: ${message.replace(/([?&](?:key|api_key|access_token)=)[^&\s"]+/gi, '$1***')}`);
  });
  map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new ml.AttributionControl({ compact: true, customAttribution: config?.attribution || undefined }), 'bottom-right');

  let popup: PopupLike | undefined;
  const markers = new Map<string, MarkerLike>();
  for (const p of points) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `marker ${p.kind}`;
    el.setAttribute('aria-label', `${p.name}, ${p.kind}`);
    el.innerHTML = '<span></span>';
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      popup?.remove();
      const box = document.createElement('div');
      box.className = 'popup';
      const title = document.createElement('b');
      title.textContent = p.name;
      const sub = document.createElement('span');
      sub.textContent = `${p.kind === 'visited' ? 'Visited' : p.kind === 'planned' ? 'Planned' : 'Dream'} · ${p.subtitle}`;
      const link = document.createElement('a');
      link.href = href(p.href);
      link.textContent = 'Open →';
      box.append(title, sub, link);
      popup = new ml.Popup({ offset: 16, closeButton: true, maxWidth: '260px' }).setLngLat([p.lng, p.lat]).setDOMContent(box).addTo(map);
    });
    const marker = new ml.Marker({ element: el, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(map);
    markers.set(p.id, marker);
  }

  const fit = (ids: Set<string>, animate: boolean) => {
    const visible = points.filter((p) => ids.has(p.id));
    if (!visible.length) return;
    const bounds = new ml.LngLatBounds();
    for (const p of visible) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, { padding: 56, maxZoom: visible.length === 1 ? 11 : 9, duration: animate ? 600 : 0 });
  };
  map.once('load', () => fit(new Set(points.map((p) => p.id)), false));

  let currentTheme = theme;
  return {
    usedFallback,
    setVisible(ids) {
      for (const [id, m] of markers) m.getElement().hidden = !ids.has(id);
      popup?.remove();
    },
    focus(ids) {
      fit(ids, true);
    },
    setTheme(next) {
      if (next === currentTheme) return;
      currentTheme = next;
      loadStyle(next)
        .then(({ style: s }) => map.setStyle(s))
        .catch(() => undefined);
    },
    destroy() {
      popup?.remove();
      map.remove();
    },
  };
}
