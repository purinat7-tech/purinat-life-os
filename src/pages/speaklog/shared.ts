import { html, type SafeHtml } from '../../lib/html.ts';
import type { Session } from '../../lib/types.ts';
import { sessionScore, TYPE_LABELS } from '../../lib/speaklog.ts';
import { formatDate } from '../../lib/dates.ts';
import { href } from '../../base.ts';
import { typeIcon } from '../../components/icons.ts';
import { clearLocalSessions } from '../../local-preview.ts';
import { refresh } from '../../nav.ts';

export function localBanner(count: number): SafeHtml {
  if (!count) return html``;
  return html`<div class="banner" role="note">
    <span>Including ${count} local preview session${count === 1 ? '' : 's'}. Only this browser can see ${count === 1 ? 'it' : 'them'}; the public site is unchanged.</span>
    <button class="btn" type="button" data-action="clear-local">Clear local preview</button>
  </div>`;
}

export function bindLocalBanner(root: HTMLElement): void {
  root.querySelector('[data-action="clear-local"]')?.addEventListener('click', () => {
    clearLocalSessions();
    refresh();
  });
}

/** level: 2 when the card sits directly under the page title (feed), 3 inside a section. */
export function activityCard(s: Session, isLocal: boolean, opts: { link?: boolean; level?: 2 | 3 } = {}): SafeHtml {
  const title = opts.level === 2 ? html`<h2 class="act-title">${s.topic}</h2>` : html`<h3 class="act-title">${s.topic}</h3>`;
  const score = sessionScore(s);
  const corrections = s.corrections?.length ?? 0;
  const phrases = s.new_phrases?.length ?? 0;
  const inner = html`
    <div class="type-icon">${typeIcon(s.type)}</div>
    <div>
      <div class="meta"><span>${TYPE_LABELS[s.type]}</span><span>${formatDate(s.date)}</span>${isLocal ? html`<span class="local-badge">Local preview</span>` : ''}</div>
      ${title}
      <div class="stats">
        <div><b>${s.duration_min}</b><span>min</span></div>
        ${score !== null ? html`<div><b>${score.toFixed(1)}</b><span>score / 5</span></div>` : ''}
        ${typeof s.comprehension_pct === 'number' ? html`<div><b>${s.comprehension_pct}%</b><span>understood</span></div>` : ''}
        ${corrections ? html`<div><b>${corrections}</b><span>corrections</span></div>` : ''}
        ${phrases ? html`<div><b>${phrases}</b><span>new phrases</span></div>` : ''}
      </div>
      ${s.focus ? html`<p><strong>Focus:</strong> ${s.focus}</p>` : ''}
    </div>`;
  return opts.link === false
    ? html`<article class="card activity">${inner}</article>`
    : html`<a class="card activity card-link" href="${href(`/speaklog/activities/${s.id}`)}">${inner}</a>`;
}

export const IMPORT_HINT = html`Add a Session Card with the <a href="${href('/speaklog/import')}">import tool</a>, then commit the merged file.`;
