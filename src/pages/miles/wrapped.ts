import { html } from '../../lib/html.ts';
import { NotFoundError, type PageHandler } from '../../view.ts';
import { getPlaces, getTrips } from '../../data.ts';
import { computeWrapped, wrappedYears } from '../../lib/travel.ts';
import { formatMonthKey } from '../../lib/dates.ts';
import { flagEmoji } from '../../lib/countries.ts';
import { humanizeTag } from '../../lib/speaklog.ts';
import { href } from '../../base.ts';
import { empty, milesHead } from '../../components/ui.ts';

const page: PageHandler = async ({ params, today }) => {
  const [trips, places] = await Promise.all([getTrips(), getPlaces()]);
  const years = wrappedYears(trips, today);
  const year = params.year ? Number(params.year) : years[0];
  if (params.year && (!Number.isInteger(year) || !years.includes(year!))) throw new NotFoundError(`wrapped ${params.year}`);

  if (year === undefined) {
    return {
      title: 'Travel Wrapped · MILES',
      section: 'miles',
      body: html`${milesHead('/miles/wrapped', 'Travel Wrapped')}${empty('No data yet', 'Wrapped needs at least one trip with dates.')}`,
    };
  }
  const w = computeWrapped(year, trips, places, today);
  const highlight = w.longestTrip?.trip;
  const months = w.months.map((m) => formatMonthKey(m).split(' ')[0]!.slice(0, 3));

  return {
    title: `Travel Wrapped ${year} · MILES`,
    section: 'miles',
    body: html`
      <div class="no-shot">${milesHead('/miles/wrapped', `Travel Wrapped ${year}`, 'Made to be screenshotted. Use screenshot mode to hide the navigation.')}</div>
      ${years.length > 1
        ? html`<nav class="chips no-shot" aria-label="Year">${years.map((y) => html`<a class="chip" href="${href(`/miles/wrapped/${y}`)}" ${y === year ? html`aria-current="true"` : ''}>${y}</a>`)}</nav>`
        : ''}
      <div class="wrapped-stage mt">
        <article class="wrapped-card" aria-label="Travel Wrapped ${year}">
          <div class="w-top"><span>MILES</span><span>PURINAT LIFE OS</span></div>
          <div>
            <div class="w-year">${year}</div>
            <div class="w-sub">Travel Wrapped</div>
            <div class="w-hl mt">${w.countries.map((c) => flagEmoji(c)).join(' ')}</div>
          </div>
          <div class="stack" style="align-content:end;gap:16px">
            <div class="w-grid">
              <div><b>${w.trips.length}</b><span>${w.trips.length === 1 ? 'journey' : 'journeys'}</span></div>
              <div><b>${w.travelDays}</b><span>travel days</span></div>
              <div><b>${w.countries.length}</b><span>${w.countries.length === 1 ? 'country' : 'countries'}</span></div>
              <div><b>${w.places.length}</b><span>places</span></div>
              <div><b>${w.cities}</b><span>towns &amp; areas</span></div>
              <div><b>${w.continents.length}</b><span>${w.continents.length === 1 ? 'continent' : 'continents'}</span></div>
            </div>
            <div class="w-foot">
              ${highlight ? html`<span class="w-hl">Longest: ${highlight.name} · ${w.longestTrip!.days} days</span>` : ''}
              ${months.length ? html`<span>On the road in ${months.join(', ')}</span>` : ''}
              ${w.topCategories.length ? html`<span>Most: ${w.topCategories.map((c) => `${humanizeTag(c.category)} (${c.count})`).join(' · ')}</span>` : ''}
            </div>
          </div>
        </article>
        <div class="btn-row no-shot">
          <button class="btn primary" type="button" data-action="shot">Screenshot mode</button>
        </div>
        <p class="note no-shot">${w.undatedTrips ? `${w.undatedTrips} journey(s) without dates are not in any year yet.` : ''}</p>
      </div>
    `,
    mount(root) {
      const button = root.querySelector<HTMLButtonElement>('[data-action="shot"]');
      const exit = document.createElement('button');
      exit.type = 'button';
      exit.className = 'btn';
      exit.textContent = 'Exit screenshot mode';
      exit.style.cssText = 'position:fixed;right:12px;bottom:12px;opacity:.85;z-index:50';
      exit.hidden = true;
      document.body.append(exit);
      const set = (on: boolean) => {
        document.body.classList.toggle('screenshot', on);
        exit.hidden = !on;
        if (on) exit.focus();
        else button?.focus();
      };
      button?.addEventListener('click', () => set(true));
      exit.addEventListener('click', () => set(false));
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') set(false);
      };
      document.addEventListener('keydown', onKey);
      return () => {
        document.body.classList.remove('screenshot');
        document.removeEventListener('keydown', onKey);
        exit.remove();
      };
    },
  };
};

export default page;
