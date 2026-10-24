import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getPlaces, getRaces, getTrips } from '../../data.ts';
import { isConfirmedVisit, placeCountLabel, tripDays, tripStatus } from '../../lib/travel.ts';
import { formatRange } from '../../lib/dates.ts';
import { countryName, flagEmoji } from '../../lib/countries.ts';
import { humanizeTag } from '../../lib/speaklog.ts';
import { href } from '../../base.ts';
import { empty, milesHead, placePhoto } from '../../components/ui.ts';

const page: PageHandler = async ({ today }) => {
  const [trips, places, races] = await Promise.all([getTrips(), getPlaces(), getRaces()]);
  const sorted = [...trips].sort((a, b) => {
    const ka = a.start_date === 'TODO' ? '0000' : a.start_date;
    const kb = b.start_date === 'TODO' ? '0000' : b.start_date;
    return kb.localeCompare(ka) || a.name.localeCompare(b.name);
  });

  return {
    title: 'Journeys · MILES',
    section: 'miles',
    body: html`
      ${milesHead('/miles/journeys', 'Journeys', 'One card per trip. The same country twice is two journeys.')}
      <div class="cards">
        ${sorted.length
          ? sorted.map((t) => {
              const tripPlaces = places.filter((p) => p.trip_id === t.id);
              const hero = tripPlaces.find((p) => p.id === t.hero_place_id) ?? tripPlaces.find(isConfirmedVisit);
              const tripRaces = races.filter((r) => r.trip_id === t.id);
              const days = tripDays(t, today);
              const status = tripStatus(t, today);
              return html`<a class="card journey-card card-link" href="${href(`/miles/journeys/${t.id}`)}">
                ${placePhoto(hero ?? { name: t.name, photo: 'TODO', photo_alt: 'TODO' }, { className: 'wide' })}
                <div class="body">
                  <span class="muted"><span aria-hidden="true">${flagEmoji(t.country_code)}</span> ${countryName(t.country_code)} · ${formatRange(t.start_date, t.end_date)}</span>
                  <h2 class="jc-title">${t.name}</h2>
                  <span class="muted">${placeCountLabel(tripPlaces)}${days !== null ? ` · ${days} days` : ''}${status === 'planned' ? ' · planned' : status === 'ongoing' ? ' · now' : ''}</span>
                  ${tripRaces.length ? html`<div class="row">${tripRaces.map((r) => html`<span class="badge muted">Race · ${r.name}</span>`)}</div>` : ''}
                  ${t.tags.length ? html`<div class="row mt">${t.tags.map((tag) => html`<span class="tag">${humanizeTag(tag)}</span>`)}</div>` : ''}
                </div>
              </a>`;
            })
          : empty('No data yet', 'Add a trip to data/trips.json.')}
      </div>
    `,
  };
};

export default page;
