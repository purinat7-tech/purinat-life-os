import { html, raw } from '../lib/html.ts';
import { HOME_HERO_HTML } from '../lib/routes.ts';
import type { PageHandler } from '../view.ts';
import { getDreams, getPlaces, getPlan, getSessions, getTrips } from '../data.ts';
import { computeTravelStats, dreamWhen, isConfirmedVisit, nextDreams, placeCountLabel, tripStatus } from '../lib/travel.ts';
import { currentStreak, planSchedule, totals, weekSummary } from '../lib/speaklog.ts';
import { formatMonthKey, formatRange, isIsoDate } from '../lib/dates.ts';
import { countryName, flagEmoji } from '../lib/countries.ts';
import { href } from '../base.ts';
import { empty, placePhoto, section } from '../components/ui.ts';

const home: PageHandler = async ({ today }) => {
  const [{ sessions }, plan, trips, places, dreams] = await Promise.all([getSessions(), getPlan(), getTrips(), getPlaces(), getDreams()]);

  const t = totals(sessions, today);
  const week = weekSummary(sessions, today);
  const streak = currentStreak(sessions, today);
  const travel = computeTravelStats(trips, places, today);
  const schedule = planSchedule(plan, today);
  const upcoming = nextDreams(dreams);

  const latestTrip = trips
    .filter((tr) => isIsoDate(tr.start_date) && tripStatus(tr, today) !== 'planned')
    .sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  const latestPlaces = latestTrip ? places.filter((p) => p.trip_id === latestTrip.id) : [];
  const heroPlace = latestTrip ? latestPlaces.find((p) => p.id === latestTrip.hero_place_id) ?? latestPlaces.find(isConfirmedVisit) : undefined;

  const tripWhen = schedule.tripDate
    ? schedule.dateIsApproximate && schedule.tripDate.endsWith('-01')
      ? formatMonthKey(schedule.tripDate.slice(0, 7))
      : schedule.tripDate
    : 'Date TODO';

  return {
    title: 'PURINAT LIFE OS',
    section: 'home',
    body: html`
      ${raw(HOME_HERO_HTML)}

      <div class="modules">
        <a class="module-card" href="${href('/speaklog')}">
          <span class="module-name">SPEAKLOG</span>
          <h2>English training log</h2>
          ${t.sessions > 0
            ? html`<div class="mini-stats">
                <div><b>${streak}</b><span>day streak</span></div>
                <div><b>${week.minutes}</b><span>min this week</span></div>
                <div><b>${t.sessions}</b><span>sessions</span></div>
              </div>`
            : html`<p class="muted">No sessions yet. The first Session Card starts the log.</p>`}
          <span class="go">Open dashboard <span aria-hidden="true">→</span></span>
        </a>
        <a class="module-card" href="${href('/miles')}">
          <span class="module-name">MILES</span>
          <h2>Travel passport</h2>
          <div class="mini-stats">
            <div><b>${travel.countries}</b><span>countries</span></div>
            <div><b>${travel.places}</b><span>places</span></div>
            <div><b>${travel.trips}</b><span>journeys</span></div>
          </div>
          <span class="go">Explore the map <span aria-hidden="true">→</span></span>
        </a>
      </div>

      ${section(
        'Next up',
        html`<div class="cards">
          <a class="card card-link" href="${href('/speaklog/plan')}">
            <div class="eyebrow">Next trip · training target</div>
            <h3 class="serif" style="font-size:1.7rem;font-weight:600;margin-top:6px">${schedule.tripName}</h3>
            <p class="muted">${tripWhen}${schedule.tentative ? ' · tentative' : ''}</p>
            ${schedule.daysToTrip !== null && schedule.daysToTrip >= 0
              ? html`<p class="countdown mt">${schedule.daysToTrip}<span class="muted" style="font-size:1rem;font-weight:700;letter-spacing:0"> days</span></p>
                  <p class="note">${schedule.dateIsApproximate ? 'Counted to the 1st of the month; exact date not set.' : ''} Phase now: <strong>${schedule.current ?? '—'}</strong></p>`
              : html`<p class="note mt">Set the trip date in data/speaklog/plan.json to start the countdown.</p>`}
          </a>
          ${upcoming.length
            ? html`<div class="card"><div class="eyebrow">Dream Board · NEXT</div>
                <ul class="stack" style="list-style:none;padding:0;margin:10px 0 0">
                  ${upcoming.map((d) => html`<li><a href="${href(`/dreams#${d.id}`)}"><span aria-hidden="true">${flagEmoji(d.country_code)}</span> ${d.destination}</a> <span class="muted">· ${dreamWhen(d)}</span></li>`)}
                </ul></div>`
            : ''}
        </div>`,
      )}

      ${section(
        'Latest journey',
        latestTrip
          ? html`<a class="card journey-card card-link" href="${href(`/miles/journeys/${latestTrip.id}`)}">
              ${placePhoto(heroPlace ?? { name: latestTrip.name, photo: 'TODO', photo_alt: 'TODO' }, { className: 'wide' })}
              <div class="body">
                <span class="muted"><span aria-hidden="true">${flagEmoji(latestTrip.country_code)}</span> ${countryName(latestTrip.country_code)} · ${formatRange(latestTrip.start_date, latestTrip.end_date)}</span>
                <h3 class="jc-title">${latestTrip.name}</h3>
                <span class="muted">${placeCountLabel(latestPlaces)} · ${latestTrip.cities.length} areas</span>
              </div>
            </a>`
          : empty('No data yet', 'Journeys appear once a trip with dates is added to data/trips.json.'),
        { path: '/miles/journeys', label: 'All journeys' },
      )}
    `,
  };
};

export default home;
