import { html } from '../../lib/html.ts';
import { NotFoundError, type PageHandler } from '../../view.ts';
import { getPlaces, getRaces, getTrips } from '../../data.ts';
import { hasCoords, isConfirmedVisit, tripDays } from '../../lib/travel.ts';
import { formatRange } from '../../lib/dates.ts';
import { countryName, flagEmoji } from '../../lib/countries.ts';
import { humanizeTag } from '../../lib/speaklog.ts';
import { isKnownNumber, isTodo } from '../../lib/types.ts';
import { empty, milesHead, placePhoto, section, tile } from '../../components/ui.ts';
import { placeCard } from './shared.ts';

const page: PageHandler = async ({ params, today }) => {
  const [trips, places, races] = await Promise.all([getTrips(), getPlaces(), getRaces()]);
  const trip = trips.find((t) => t.id === params.id);
  if (!trip) throw new NotFoundError(`trip ${params.id}`);
  const tripPlaces = places.filter((p) => p.trip_id === trip.id);
  const hero = tripPlaces.find((p) => p.id === trip.hero_place_id) ?? tripPlaces.find(isConfirmedVisit);
  const confirmed = tripPlaces.filter(isConfirmedVisit).length;
  const tripRaces = races.filter((r) => r.trip_id === trip.id);
  const days = tripDays(trip, today);
  const onMap = tripPlaces.filter((p) => isConfirmedVisit(p) && hasCoords(p)).length;

  return {
    title: `${trip.name} · Journeys`,
    section: 'miles',
    body: html`
      ${milesHead('/miles/journeys', trip.name, html`<span aria-hidden="true">${flagEmoji(trip.country_code)}</span> ${countryName(trip.country_code)} · ${formatRange(trip.start_date, trip.end_date)}`, 'journey-title')}
      ${tripRaces.length ? html`<div class="row" style="margin-bottom:12px">${tripRaces.map((r) => html`<span class="badge muted" title="Races are not counted in any travel statistic">Race · ${r.name}</span>`)}</div>` : ''}
      ${placePhoto(hero ?? { name: trip.name, photo: 'TODO', photo_alt: 'TODO' }, { className: 'wide', eager: true })}
      <div class="tiles four mt">
        ${tile('Days', days)}
        ${tile('Places', confirmed, { sub: tripPlaces.length - confirmed ? `${tripPlaces.length - confirmed} to confirm` : undefined })}
        ${tile('Areas', trip.cities.length || null)}
        ${tile('Road-trip km', isKnownNumber(trip.road_trip_km) ? trip.road_trip_km : null, { sub: isTodo(trip.road_trip_km) ? 'TODO' : undefined })}
      </div>
      ${trip.summary && !isTodo(trip.summary) ? html`<p class="lead mt serif" style="font-size:1.35rem">${trip.summary}</p>` : html`<p class="note mt">Summary TODO.</p>`}
      ${trip.cities.length ? section('Route', html`<ol class="row" style="list-style:none;padding:0;margin:0">${trip.cities.map((c, i) => html`<li class="tag">${i + 1}. ${c}</li>`)}</ol>`) : ''}
      ${section(
        'Places',
        tripPlaces.length
          ? html`${confirmed < tripPlaces.length ? html`<p class="note" style="margin-bottom:12px">“Not confirmed” places are suggestions. They are not counted as visits until <span class="code">"visit_confirmed": true</span> is set.</p>` : ''}<div class="photo-grid">${tripPlaces.map((p) => placeCard(p))}</div>`
          : empty('No data yet', 'Places for this journey are TODO.'),
        onMap ? { path: `/miles?trip=${trip.id}`, label: 'See on the map' } : undefined,
      )}
      ${tripPlaces.length && trip.tags.length ? html`<div class="row mt">${trip.tags.map((t) => html`<span class="tag">${humanizeTag(t)}</span>`)}</div>` : ''}
    `,
  };
};

export default page;
