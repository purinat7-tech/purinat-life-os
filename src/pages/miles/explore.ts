import { html, type SafeHtml } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getDreams, getPlaces, getTrips } from '../../data.ts';
import { buildMapPoints, computeTravelStats, type MarkerKind } from '../../lib/travel.ts';
import { PLACE_CATEGORIES, type PlaceCategory } from '../../lib/types.ts';
import { humanizeTag } from '../../lib/speaklog.ts';
import { href } from '../../base.ts';
import { milesHead, section, tile } from '../../components/ui.ts';
import { currentTheme, onThemeChange } from '../../theme.ts';
import type { MapHandle } from './map.ts';

const KIND_LABEL: Record<MarkerKind, string> = { visited: 'Visited', planned: 'Planned', dream: 'Dream' };

const page: PageHandler = async ({ today, query }) => {
  const [trips, places, dreams] = await Promise.all([getTrips(), getPlaces(), getDreams()]);
  const stats = computeTravelStats(trips, places, today);
  const { points, notOnMap } = buildMapPoints(trips, places, dreams, today);
  const unconfirmed = notOnMap.filter((n) => n.reason === 'not-confirmed').map((n) => n.name);
  const noCoords = notOnMap.filter((n) => n.reason === 'no-coordinates').map((n) => n.name);
  const tripFilter = query.get('trip');
  const usedCategories = PLACE_CATEGORIES.filter((c) => points.some((p) => p.categories.includes(c)));
  const kinds: MarkerKind[] = ['visited', 'planned', 'dream'];

  const statTiles: SafeHtml = html`<div class="tiles six">
    ${tile('Countries', stats.countries)}
    ${tile('Cities', stats.cities, { sub: 'towns and areas' })}
    ${tile('Places', stats.places)}
    ${tile('Continents', stats.continents)}
    ${tile('Trips', stats.trips)}
    ${tile('Travel days', stats.travelDays, { sub: stats.tripsMissingDates ? `${stats.tripsMissingDates} trip(s) without dates` : undefined })}
    ${tile('Road-trip km', stats.roadTripKm, { unit: 'km', sub: stats.roadTripsMissingKm ? `km TODO on ${stats.roadTripsMissingKm} road trip(s)` : undefined })}
    ${tile('Coffee shops', stats.coffee)}
    ${tile('Restaurants', stats.restaurants)}
    ${tile('Hiking spots', stats.hiking)}
    ${tile('Beaches', stats.beaches)}
    ${tile('Photography spots', stats.photography)}
  </div>
  <p class="note mt">Only confirmed visits count. Races are not counted in any statistic. Categories count confirmed places tagged with them.</p>`;

  return {
    title: 'Explore · MILES',
    section: 'miles',
    body: html`
      ${milesHead('/miles', 'Explore', 'Every visited place, the next trips and the dreams, on one clean map.')}
      <div class="map-shell">
        <div class="map-legend" aria-hidden="true">${kinds.map((k) => html`<span><i class="dot ${k}"></i>${KIND_LABEL[k]}</span>`)}</div>
        <div class="map" id="map" role="region" aria-label="Map of places. Markers are buttons; the same places are listed below the map."></div>
        <div class="map-status" id="map-status" role="status"><p>Loading map…</p></div>
      </div>
      <div class="chips scroll mt" role="group" aria-label="Show on map">
        ${kinds.map((k) => html`<button class="chip" type="button" data-kind="${k}" aria-pressed="true"><i class="dot ${k}" aria-hidden="true"></i>${KIND_LABEL[k]}</button>`)}
      </div>
      <div class="chips scroll" role="group" aria-label="Filter places by category">
        ${(usedCategories.length ? usedCategories : PLACE_CATEGORIES.slice(0, 9)).map(
          (c) => html`<button class="chip" type="button" data-cat="${c}" aria-pressed="false">${humanizeTag(c)}</button>`,
        )}
      </div>
      ${tripFilter ? html`<p class="note">Zoomed to one journey. <a href="${href('/miles')}">Show everything</a></p>` : ''}

      <details class="map-list card mt">
        <summary>All ${points.length} points on the map (list view)</summary>
        <ul>${points.map((p) => html`<li data-point="${p.id}"><a href="${href(p.href)}">${p.name}</a> <span class="note">· ${KIND_LABEL[p.kind]}${p.subtitle ? ` · ${p.subtitle}` : ''}</span></li>`)}</ul>
        ${unconfirmed.length ? html`<p class="note mt">Not on the map until the visit is confirmed (${unconfirmed.length}): ${unconfirmed.join(', ')}.</p>` : ''}
        ${noCoords.length ? html`<p class="note mt">Not on the map yet (coordinates TODO): ${noCoords.join(', ')}.</p>` : ''}
      </details>

      ${section('Stats', statTiles)}
    `,
    mount(root) {
      const container = root.querySelector<HTMLElement>('#map');
      const status = root.querySelector<HTMLElement>('#map-status');
      const list = root.querySelector<HTMLDetailsElement>('.map-list');
      if (!container || !status) return;
      const activeKinds = new Set<MarkerKind>(kinds);
      const activeCats = new Set<PlaceCategory>();
      const visibleIds = () =>
        new Set(
          points
            .filter((p) => activeKinds.has(p.kind))
            .filter((p) => !activeCats.size || p.categories.some((c) => activeCats.has(c)))
            .filter((p) => !tripFilter || p.tripId === tripFilter || p.kind !== 'visited')
            .map((p) => p.id),
        );

      let handle: MapHandle | undefined;
      let disposed = false;
      const apply = () => {
        const ids = visibleIds();
        handle?.setVisible(ids);
        root.querySelectorAll<HTMLElement>('[data-point]').forEach((li) => {
          li.hidden = !ids.has(li.dataset.point ?? '');
        });
      };

      root.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach((b) =>
        b.addEventListener('click', () => {
          const k = b.dataset.kind as MarkerKind;
          if (activeKinds.has(k)) activeKinds.delete(k);
          else activeKinds.add(k);
          b.setAttribute('aria-pressed', String(activeKinds.has(k)));
          apply();
        }),
      );
      root.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) =>
        b.addEventListener('click', () => {
          const c = b.dataset.cat as PlaceCategory;
          if (activeCats.has(c)) activeCats.delete(c);
          else activeCats.add(c);
          b.setAttribute('aria-pressed', String(activeCats.has(c)));
          apply();
          const ids = visibleIds();
          if (ids.size) handle?.focus(ids);
        }),
      );

      import('./map.ts')
        .then(({ createMap }) => createMap(container, points, currentTheme()))
        .then((h) => {
          if (disposed) {
            h.destroy();
            return;
          }
          handle = h;
          status.hidden = true;
          apply();
          if (tripFilter) {
            const ids = new Set(points.filter((p) => p.tripId === tripFilter).map((p) => p.id));
            if (ids.size) h.focus(ids);
          }
        })
        .catch((error: unknown) => {
          if (disposed) return;
          console.warn(error);
          status.innerHTML = html`<div class="stack"><p><strong>The interactive map is not available.</strong></p><p>${error instanceof Error ? error.message : ''}</p><p>All places are listed below.</p></div>`.value;
          if (list) list.open = true;
        });

      const offTheme = onThemeChange((t) => handle?.setTheme(t));
      return () => {
        disposed = true;
        offTheme();
        handle?.destroy();
      };
    },
  };
};

export default page;
