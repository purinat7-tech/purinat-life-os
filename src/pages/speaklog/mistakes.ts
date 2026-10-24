import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getSessions } from '../../data.ts';
import { mistakePatterns, RECENT_DAYS, weeklyFocus } from '../../lib/speaklog.ts';
import { formatDate } from '../../lib/dates.ts';
import { href } from '../../base.ts';
import { empty, section, speaklogHead } from '../../components/ui.ts';
import { bindLocalBanner, localBanner } from './shared.ts';

const page: PageHandler = async ({ today }) => {
  const { sessions, localIds } = await getSessions();
  const patterns = mistakePatterns(sessions, today);
  const focus = weeklyFocus(patterns);

  return {
    title: 'Mistake Memory · SPEAKLOG',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/mistakes', 'Mistake Memory', 'Recurring error patterns, grouped by the tag on each correction in your Session Cards.')}
      ${localBanner(localIds.size)}
      ${focus
        ? html`<section class="focus-card" aria-labelledby="focus-title">
            <div class="eyebrow">This week’s focus</div>
            <h2 id="focus-title">${focus.label}</h2>
            <p>${focus.reason}</p>
            ${focus.example ? html`<p><span style="text-decoration:line-through;opacity:.75">${focus.example.said}</span> → <strong>${focus.example.natural}</strong></p>` : ''}
          </section>`
        : empty('No data yet', 'This week’s focus is picked from the corrections in your Session Cards.')}
      ${section(
        'Patterns',
        patterns.length
          ? html`<div class="table-wrap"><table class="wide">
              <thead><tr><th scope="col">Pattern</th><th scope="col">Total</th><th scope="col">Last ${RECENT_DAYS} days</th><th scope="col">Last seen</th><th scope="col">Latest example</th></tr></thead>
              <tbody>${patterns.map(
                (p) => html`<tr>
                  <th scope="row">${p.label}<br><span class="note">${p.tag}</span></th>
                  <td class="num">${p.count}</td>
                  <td class="num">${p.recent}</td>
                  <td>${formatDate(p.lastSeen)}</td>
                  <td>${p.examples[0] ? html`<a href="${href(`/speaklog/activities/${p.examples[0].sessionId}`)}">${p.examples[0].natural}</a>` : ''}</td>
                </tr>`,
              )}</tbody>
            </table></div>`
          : empty('No data yet', html`Corrections look like <span class="code">{"said": "...", "natural": "...", "tag": "past-tense"}</span>.`),
      )}
      <p class="note mt">Rule for the focus: the pattern seen most often in the last ${RECENT_DAYS} days; if nothing is that recent, the most frequent pattern overall.</p>
    `,
    mount: bindLocalBanner,
  };
};

export default page;
