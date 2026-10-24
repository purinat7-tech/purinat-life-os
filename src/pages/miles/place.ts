import { html, safeExternalUrl } from '../../lib/html.ts';
import { NotFoundError, type PageHandler } from '../../view.ts';
import { getPlaces, getTrips } from '../../data.ts';
import { hasCoords } from '../../lib/travel.ts';
import { formatDate } from '../../lib/dates.ts';
import { countryName, flagEmoji } from '../../lib/countries.ts';
import { humanizeTag } from '../../lib/speaklog.ts';
import { isTodo } from '../../lib/types.ts';
import { href } from '../../base.ts';
import { milesHead, placePhoto, section, stars } from '../../components/ui.ts';

const page: PageHandler = async ({ params }) => {
  const [places, trips] = await Promise.all([getPlaces(), getTrips()]);
  const p = places.find((x) => x.id === params.id);
  if (!p) throw new NotFoundError(`place ${params.id}`);
  const trip = trips.find((t) => t.id === p.trip_id);
  const source = safeExternalUrl(p.coord_source);
  const photoMeta = [
    p.camera ? ['Camera', p.camera] : null,
    p.lens ? ['Lens', p.lens] : null,
    typeof p.focal_length_mm === 'number' ? ['Focal length', `${p.focal_length_mm} mm`] : null,
    p.best_time ? ['Best time', p.best_time] : null,
  ].filter((x): x is [string, string] => x !== null);

  return {
    title: `${p.name} · Places`,
    section: 'miles',
    body: html`
      <div class="place-hero">${milesHead('/miles/places', p.name, html`<span aria-hidden="true">${flagEmoji(p.country_code)}</span> ${p.city}, ${countryName(p.country_code)}`)}</div>
      ${placePhoto(p, { className: 'wide', eager: true })}
      <div class="split mt">
        <div class="stack">
          ${isTodo(p.memory) || !p.memory ? html`<p class="note">Memory TODO.</p>` : html`<p class="quote">${p.memory}</p>`}
          <div class="row">${p.category.map((c) => html`<a class="tag" href="${href(`/miles/places?category=${c}`)}">${humanizeTag(c)}</a>`)}</div>
        </div>
        <div class="card">
          <dl class="kv">
            <dt>Journey</dt><dd>${trip ? html`<a href="${href(`/miles/journeys/${trip.id}`)}">${trip.name}</a>` : p.trip_id}</dd>
            <dt>Visit</dt><dd>${p.visit_confirmed ? html`Confirmed${isTodo(p.visited_date) ? ' · date TODO' : ` · ${formatDate(p.visited_date)}`}` : html`<span class="badge muted">Not confirmed</span> <span class="note">Suggested place, not counted as a visit.</span>`}</dd>
            ${p.visit_confirmed ? html`<dt>Rating</dt><dd>${stars(p.rating)}</dd>` : ''}
            ${photoMeta.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}
            <dt>Location</dt><dd>${hasCoords(p)
              ? html`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}${source ? html` · <a href="${source}" rel="noopener noreferrer" target="_blank">source</a>` : ''}${p.coord_verified === false ? html`<br><span class="note">Looked up from a public source, not yet verified.</span>` : ''}`
              : 'Coordinates TODO'}</dd>
          </dl>
          ${hasCoords(p) && p.visit_confirmed ? html`<p class="mt"><a href="${href(`/miles?trip=${p.trip_id}`)}">See on the map →</a></p>` : ''}
        </div>
      </div>
      ${p.coord_note ? section('Note', html`<p class="note">${p.coord_note}</p>`) : ''}
    `,
  };
};

export default page;
