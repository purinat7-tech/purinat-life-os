import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getPlan } from '../../data.ts';
import { planSchedule, TYPE_LABELS } from '../../lib/speaklog.ts';
import { formatDate, formatMonthKey } from '../../lib/dates.ts';
import { defaultFlag, section, speaklogHead } from '../../components/ui.ts';

const page: PageHandler = async ({ today }) => {
  const plan = await getPlan();
  const s = planSchedule(plan, today);
  const when = s.tripDate
    ? s.dateIsApproximate
      ? `${formatMonthKey(s.tripDate.slice(0, 7))} (exact day not set; counting to the 1st)`
      : formatDate(s.tripDate)
    : 'Date TODO';
  const totalWeeks = s.phases.reduce((sum, p) => sum + (p.weeks ?? 0), 0);
  const baseWeeks = s.tripDate && s.phases[0]?.end ? Math.max(1, Math.ceil((Date.parse(s.phases[0].end) - Date.parse(today)) / 604_800_000)) : 4;

  return {
    title: 'Training Plan · SPEAKLOG',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/plan', 'Training Plan', 'Periodised like a marathon block: Base, Build, Trip-Specific, Peak, Taper, counted back from the next trip.')}
      <div class="split">
        <section class="card stack" aria-labelledby="trip-title">
          <div class="eyebrow">Next trip${s.tentative ? ' · tentative' : ''}</div>
          <h2 id="trip-title" class="serif" style="font-size:2.2rem;font-weight:600">${s.tripName}</h2>
          <p class="muted">${when}</p>
          ${s.daysToTrip !== null
            ? s.daysToTrip >= 0
              ? html`<p class="countdown">${s.daysToTrip}<span class="muted" style="font-size:1rem;font-weight:700;letter-spacing:0"> days to go</span></p>`
              : html`<p class="note">This trip date has passed. Set the next trip in data/speaklog/plan.json.</p>`
            : html`<p class="note">Set <span class="code">next_trip.start_date</span> or <span class="code">target_month</span> in data/speaklog/plan.json to start the countdown.</p>`}
          <p>Current phase: <strong>${s.current ?? '—'}</strong></p>
        </section>
        <section class="card stack" aria-labelledby="goal-title">
          <h2 id="goal-title" style="font-size:1.3rem">Weekly goals</h2>
          <dl class="kv">
            <dt>Practice</dt><dd>${plan.weekly_goals.minutes} min</dd>
            <dt>Speaking sessions</dt><dd>${plan.weekly_goals.speaking_sessions}</dd>
            <dt>Listening</dt><dd>${plan.weekly_goals.listening_minutes} min</dd>
            <dt>New phrases</dt><dd>${plan.weekly_goals.new_phrases}</dd>
          </dl>
          ${plan.weekly_goals.is_default ? defaultFlag('data/speaklog/plan.json') : ''}
        </section>
      </div>

      ${section(
        'Phases',
        html`<div class="phase-bar" role="list" aria-label="Phases in order">
            ${s.phases.map((p) => {
              const weeks = p.weeks ?? baseWeeks;
              return html`<div role="listitem" class="${p.state}" style="flex:${Math.max(1, weeks)}" title="${p.name}">${p.name}${p.state === 'current' ? html`<span class="sr-only"> (current)</span>` : ''}</div>`;
            })}
          </div>
          <div class="phase-cards mt">
            ${s.phases.map(
              (p) => html`<article class="card phase-card stack ${p.state === 'current' ? 'current' : ''}">
                <div class="row"><h3>${p.name}</h3>${p.state === 'current' ? html`<span class="badge solid">Now</span>` : p.state === 'past' ? html`<span class="badge muted">Done</span>` : ''}</div>
                <p class="note">${p.start ? formatDate(p.start) : 'Now'} – ${p.end ? formatDate(p.end) : 'TODO'}${p.weeks ? ` · ${p.weeks} wk` : ''}</p>
                <p>${p.focus}</p>
              </article>`,
            )}
          </div>
          <p class="note mt">Fixed phases total ${totalWeeks} weeks; Base takes the time before them. ${plan.phases.is_default ? defaultFlag('data/speaklog/plan.json') : ''}</p>`,
      )}

      ${section(
        'Weekly template',
        html`<div class="table-wrap"><table class="stack-sm">
            <thead><tr><th scope="col">Day</th><th scope="col">Session</th><th scope="col">Minutes</th><th scope="col">Note</th></tr></thead>
            <tbody>${plan.weekly_template.days.map(
              (d) => html`<tr><th scope="row">${d.day}</th><td>${d.activity === 'rest' ? 'Rest' : TYPE_LABELS[d.activity]}</td><td class="num">${d.minutes || '—'}</td><td>${d.note}</td></tr>`,
            )}</tbody>
          </table></div>
          ${plan.weekly_template.is_default ? html`<p class="mt">${defaultFlag('data/speaklog/plan.json')}</p>` : ''}`,
      )}
    `,
  };
};

export default page;
