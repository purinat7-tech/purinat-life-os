import { html, type SafeHtml } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getDreams, getPlaces, getTrips } from '../../data.ts';
import { buildTimeline, type TimelineGroup, type TimelineItem } from '../../lib/travel.ts';
import { formatRange } from '../../lib/dates.ts';
import { flagEmoji, countryName } from '../../lib/countries.ts';
import { href } from '../../base.ts';
import { empty, milesHead } from '../../components/ui.ts';

const page: PageHandler = async ({ today }) => {
  const [trips, places, dreams] = await Promise.all([getTrips(), getPlaces(), getDreams()]);
  const groups = buildTimeline(trips, places, dreams, today);
  const tripById = new Map(trips.map((t) => [t.id, t]));
  const thisYear = today.slice(0, 4);
  let todayShown = false;
  const divider = html`<li class="today-line">Today</li>`;

  const item = (it: TimelineItem): SafeHtml => {
    const trip = it.kind === 'trip' ? tripById.get(it.id) : undefined;
    const when = trip ? formatRange(trip.start_date, trip.end_date) : it.when;
    let before: SafeHtml = html``;
    if (!todayShown && it.future && it.sortKey) {
      todayShown = true;
      before = divider;
    }
    return html`${before}<li class="tl-item ${it.future ? 'future' : ''}">
      <a class="card card-link" href="${href(it.href)}">
        <span class="when">${when}${it.status ? html` · <span class="badge ${it.status === 'NEXT' ? 'solid' : it.status === 'CONDITIONAL' ? 'accent' : it.status === 'BACKUP' ? 'dashed' : 'muted'}">${it.status}</span>` : ''}</span>
        <span class="title"><span aria-hidden="true">${flagEmoji(it.countryCode)}</span> ${it.title}</span>
        <span class="note">${it.kind === 'trip' ? `Journey · ${countryName(it.countryCode)}` : 'Dream'}${it.detail ? ` · ${it.detail}` : ''}</span>
      </a>
    </li>`;
  };

  /** The "Today" line goes after the current year's past items, not under next year's heading. */
  const groupItems = (g: TimelineGroup): SafeHtml => {
    const items = g.items.map(item);
    if (!todayShown && g.key === thisYear && g.items.every((i) => !i.future)) {
      todayShown = true;
      return html`${items}${divider}`;
    }
    return html`${items}`;
  };

  return {
    title: 'Timeline · MILES',
    section: 'miles',
    body: html`
      ${milesHead('/miles/timeline', 'Timeline', 'Journeys by year, then the dreams still ahead.')}
      ${groups.length
        ? html`<div class="timeline">${groups.map(
            (g) => html`<section class="year" aria-labelledby="y-${g.key}">
              <h2 id="y-${g.key}">${g.label}</h2>
              <ol class="tl-items">${groupItems(g)}</ol>
            </section>`,
          )}</div>`
        : empty('No data yet', 'Add trips and dreams to see the timeline.')}
    `,
  };
};

export default page;
