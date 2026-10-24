import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getPlan, getSessions } from '../../data.ts';
import { READINESS_WINDOW, tripReadiness } from '../../lib/speaklog.ts';
import { formatDate } from '../../lib/dates.ts';
import { empty, section, speaklogHead } from '../../components/ui.ts';
import { gauge } from '../../components/charts.ts';
import { bindLocalBanner, localBanner } from './shared.ts';

const page: PageHandler = async ({ today }) => {
  const [{ sessions, localIds }, plan] = await Promise.all([getSessions(), getPlan()]);
  const r = tripReadiness(sessions, today);

  return {
    title: 'Trip Readiness · SPEAKLOG',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/readiness', 'Trip Readiness', `Can I handle ${plan.next_trip.name} in English? One score per real-world scenario.`)}
      ${localBanner(localIds.size)}
      <section class="card readiness-head" aria-labelledby="overall-title">
        ${r.overall !== null ? gauge(r.overall, 'Overall readiness') : ''}
        <div class="stack">
          <h2 id="overall-title" style="font-size:1.5rem">Overall readiness</h2>
          ${r.overall !== null
            ? html`<p><strong>${r.overall}%</strong> based on ${r.covered} of 8 scenarios practised.</p>`
            : html`<p class="muted"><strong>No data yet.</strong> Log a travel-simulation Session Card with a <span class="code">scenario</span> to get the first score.</p>`}
          <p class="note">Each scenario score is the average of its latest ${READINESS_WINDOW} scored sessions (mean of the four core scores, × 20). Overall is the average of practised scenarios only.</p>
        </div>
      </section>
      ${section(
        'Scenarios',
        html`<div class="cards">
          ${r.scenarios.map(
            (s) => html`<article class="card stack">
              <div class="row" style="justify-content:space-between"><h3>${s.label}</h3><b class="num" style="font-size:1.6rem">${s.score !== null ? `${s.score}%` : ''}</b></div>
              ${s.score !== null
                ? html`<div class="bar-track" role="progressbar" aria-label="${s.label} readiness" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.score}"><div class="bar-fill" style="width:${s.score}%"></div></div>
                  <p class="note">${s.sessions} session${s.sessions === 1 ? '' : 's'} · last ${s.lastDate ? formatDate(s.lastDate) : '—'}</p>`
                : empty('No data yet', s.sessions ? 'Sessions found, but none has scores.' : 'Not practised yet.')}
            </article>`,
          )}
        </div>`,
      )}
    `,
    mount: bindLocalBanner,
  };
};

export default page;
