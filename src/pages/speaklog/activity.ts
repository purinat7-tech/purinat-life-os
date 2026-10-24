import { html } from '../../lib/html.ts';
import { NotFoundError, type PageHandler } from '../../view.ts';
import { getSessions } from '../../data.ts';
import { humanizeTag, SCENARIO_LABELS, sessionScore, TYPE_LABELS } from '../../lib/speaklog.ts';
import { formatDate } from '../../lib/dates.ts';
import { href } from '../../base.ts';
import { scoreBar, section, speaklogHead } from '../../components/ui.ts';
import { bindLocalBanner, localBanner } from './shared.ts';

const page: PageHandler = async ({ params }) => {
  const { sessions, localIds } = await getSessions();
  const s = sessions.find((x) => x.id === params.id);
  if (!s) throw new NotFoundError(`session ${params.id}`);
  const isLocal = localIds.has(s.id);
  const score = sessionScore(s);
  const sc = s.scores ?? {};

  return {
    title: `${s.topic} · Activities`,
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/activities', s.topic, html`${TYPE_LABELS[s.type]} · ${formatDate(s.date)} · ${s.duration_min} min${isLocal ? html` · <span class="local-badge">Local preview</span>` : ''}`)}
      ${isLocal ? localBanner(1) : ''}
      <div class="tiles four">
        <div class="tile"><span class="label">Duration</span><span class="value">${s.duration_min}<small>min</small></span></div>
        ${score !== null ? html`<div class="tile"><span class="label">Session score</span><span class="value">${score.toFixed(1)}<small>/ 5</small></span><span class="sub">Mean of the core scores</span></div>` : ''}
        ${typeof s.comprehension_pct === 'number' ? html`<div class="tile"><span class="label">Comprehension</span><span class="value">${s.comprehension_pct}<small>%</small></span></div>` : ''}
        ${s.scenario ? html`<div class="tile"><span class="label">Scenario</span><span class="value" style="font-size:1.5rem">${SCENARIO_LABELS[s.scenario]}</span></div>` : ''}
      </div>

      <div class="split mt">
        <div class="stack">
          ${s.scores
            ? section('Scores', html`<div class="card score-bars">
                ${scoreBar('Fluency', sc.fluency)}${scoreBar('Grammar', sc.grammar)}${scoreBar('Vocabulary', sc.vocabulary)}${scoreBar('Communication', sc.communication)}${scoreBar('Listening', sc.listening)}
              </div>`)
            : ''}
          ${s.corrections?.length
            ? section('Corrections', html`<div class="card">${s.corrections.map(
                (c) => html`<div class="correction">
                  <span class="said"><span class="sr-only">I said: </span>${c.said}</span>
                  <span class="natural"><span class="sr-only">More natural: </span>${c.natural}</span>
                  <span><a class="tag" href="${href('/speaklog/mistakes')}">${humanizeTag(c.tag)}</a></span>
                </div>`,
              )}</div>`)
            : ''}
        </div>
        <div class="stack">
          ${s.strength || s.focus
            ? section('Strength and focus', html`<div class="card"><dl class="kv">
                ${s.strength ? html`<dt>Strength</dt><dd>${s.strength}</dd>` : ''}
                ${s.focus ? html`<dt>Focus</dt><dd>${s.focus}</dd>` : ''}
              </dl></div>`)
            : ''}
          ${s.new_phrases?.length
            ? section('New phrases', html`<ul class="card stack" style="margin:0;padding-left:34px">${s.new_phrases.map((p) => html`<li>${p}</li>`)}</ul>`)
            : ''}
          ${s.coach_note ? section('Coach note', html`<blockquote class="quote" style="margin:0">${s.coach_note}</blockquote>`) : ''}
        </div>
      </div>
      <p class="mt"><a href="${href('/speaklog/activities')}">← All activities</a></p>
    `,
    mount: bindLocalBanner,
  };
};

export default page;
