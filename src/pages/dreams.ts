import { html, type SafeHtml } from '../lib/html.ts';
import type { PageHandler } from '../view.ts';
import { getDreams } from '../data.ts';
import { DREAM_STATUSES, isKnownNumber, isTodo, type Dream, type DreamStatus } from '../lib/types.ts';
import { daysUntilDream, dreamWhen, formatBudget } from '../lib/travel.ts';
import { countryName, flagEmoji } from '../lib/countries.ts';
import { href } from '../base.ts';
import { empty, pageHead, subnav, MILES_NAV } from '../components/ui.ts';

const STATUS_INFO: Record<DreamStatus, { title: string; badge: string; hint: string }> = {
  NEXT: { title: 'Next', badge: 'badge solid', hint: 'Being planned' },
  CONDITIONAL: { title: 'Conditional', badge: 'badge accent', hint: 'Depends on something' },
  BACKUP: { title: 'Backup', badge: 'badge dashed', hint: 'Plan B for another dream' },
  DREAM: { title: 'Dream', badge: 'badge muted', hint: 'Someday' },
};

const page: PageHandler = async ({ today }) => {
  const dreams = await getDreams();
  const byId = new Map(dreams.map((d) => [d.id, d]));
  const name = (d: Dream) => `${d.destination}${isKnownNumber(d.target_year) ? ` ${d.target_year}` : ''}`;

  const card = (d: Dream): SafeHtml => {
    const days = daysUntilDream(d, today);
    const backupFor = d.backup_of ? byId.get(d.backup_of) : undefined;
    const backups = dreams.filter((x) => x.backup_of === d.id);
    return html`<article class="card dream" id="${d.id}">
      <div class="row" style="justify-content:space-between"><span class="${STATUS_INFO[d.status].badge}">${d.status}</span>${isKnownNumber(d.priority) ? html`<span class="tag">Priority ${d.priority}</span>` : ''}</div>
      <h3><span aria-hidden="true">${flagEmoji(d.country_code)}</span> ${d.destination}</h3>
      <p class="when">${dreamWhen(d)} <span class="muted">· ${countryName(d.country_code)}</span></p>
      ${days !== null ? html`<p><span class="countdown" style="font-size:2rem">${days}</span> <span class="muted">days to ${dreamWhen(d)}</span></p>` : ''}
      <dl class="kv">
        <dt>Budget</dt><dd>${formatBudget(d.budget_thb_per_person)}</dd>
        <dt>Priority</dt><dd>${isKnownNumber(d.priority) ? d.priority : isTodo(d.priority) ? 'TODO' : '—'}</dd>
      </dl>
      ${d.depends_on || backupFor || backups.length
        ? html`<div class="links">
            ${d.depends_on ? html`<span>Depends on: <strong>${d.depends_on}</strong></span>` : ''}
            ${backupFor ? html`<span>Backup for <a href="#${backupFor.id}">${name(backupFor)}</a></span>` : ''}
            ${backups.map((b) => html`<span>Backup plan: <a href="#${b.id}">${name(b)}</a></span>`)}
          </div>`
        : ''}
      ${d.notes && !isTodo(d.notes) ? html`<p class="note">${d.notes}</p>` : ''}
    </article>`;
  };

  const chains = dreams.filter((d) => d.depends_on || dreams.some((x) => x.backup_of === d.id));

  return {
    title: 'Dream Board',
    section: 'dreams',
    body: html`
      ${pageHead({ eyebrow: 'MILES · Dreams', title: 'Dream Board', lead: 'Where next, what it depends on, and the plan B.' })}
      ${subnav(MILES_NAV, '/dreams', 'MILES sections')}
      ${dreams.length
        ? html`<div class="board">${DREAM_STATUSES.map((status) => {
            const items = dreams.filter((d) => d.status === status);
            return html`<section class="board-col" aria-labelledby="col-${status}">
              <h2 id="col-${status}"><span>${STATUS_INFO[status].title}</span><span>${items.length}</span></h2>
              <div class="stack">${items.length ? items.map(card) : html`<p class="note">${STATUS_INFO[status].hint}: none yet.</p>`}</div>
            </section>`;
          })}</div>`
        : empty('No data yet', 'Add dreams to data/dreams.json.')}
      ${chains.length
        ? html`<section class="section" aria-labelledby="dep-title">
            <div class="section-head"><h2 id="dep-title">Dependencies</h2></div>
            <div class="stack">${chains.map((d) => {
              const backups = dreams.filter((x) => x.backup_of === d.id);
              return html`<div class="card dep">
                <a href="#${d.id}"><strong>${name(d)}</strong></a>
                ${d.depends_on ? html`<span><span class="arrow">depends on →</span> ${d.depends_on}</span>` : ''}
                ${backups.map((b) => html`<span><span class="arrow">if it does not happen →</span> <a href="#${b.id}"><strong>${name(b)}</strong></a></span>`)}
              </div>`;
            })}</div>
          </section>`
        : ''}
      <p class="note mt">Map markers for dreams are on <a href="${href('/miles')}">Explore</a>.</p>
    `,
  };
};

export default page;
