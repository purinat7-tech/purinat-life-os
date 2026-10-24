import { html, type SafeHtml } from '../../lib/html.ts';
import type { Place } from '../../lib/types.ts';
import { isTodo } from '../../lib/types.ts';
import { formatDate } from '../../lib/dates.ts';
import { flagEmoji } from '../../lib/countries.ts';
import { humanizeTag } from '../../lib/speaklog.ts';
import { href } from '../../base.ts';
import { placePhoto, stars } from '../../components/ui.ts';

/** level: heading level of the card title (2 directly under the page title, 3 inside a section). */
export function placeCard(p: Place, level: 2 | 3 = 3): SafeHtml {
  const title = level === 2 ? html`<h2 class="pc-title">${p.name}</h2>` : html`<h3 class="pc-title">${p.name}</h3>`;
  return html`<a class="place-card" href="${href(`/miles/places/${p.id}`)}">
    ${placePhoto(p, { sizes: '(min-width: 900px) 33vw, 100vw' })}
    <div class="stack" style="gap:4px">
      ${title}
      <span class="meta"><span aria-hidden="true">${flagEmoji(p.country_code)}</span> ${p.city}${isTodo(p.visited_date) ? '' : ` · ${formatDate(p.visited_date)}`}</span>
      <span class="row" style="gap:6px">${p.visit_confirmed ? stars(p.rating) : html`<span class="badge muted">Not confirmed</span>`}${p.category.slice(0, 3).map((c) => html`<span class="tag">${humanizeTag(c)}</span>`)}</span>
    </div>
  </a>`;
}
