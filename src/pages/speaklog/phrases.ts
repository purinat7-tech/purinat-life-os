import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getPhrases, getRescues } from '../../data.ts';
import { PHRASE_CATEGORIES, PHRASE_STATUSES, type PhraseCategory, type PhraseStatus, type Rescue, type RescuesFile } from '../../lib/types.ts';
import { formatDate } from '../../lib/dates.ts';
import { humanizeTag } from '../../lib/speaklog.ts';
import { href } from '../../base.ts';
import { empty, section, speaklogHead } from '../../components/ui.ts';
import { formatDataFile, hideOutput, outputPanel, showOutput } from '../../components/json-output.ts';

const STATUS_BADGE: Record<PhraseStatus, string> = { NEW: 'badge accent', LEARNING: 'badge dashed', MASTERED: 'badge solid' };

const page: PageHandler = async ({ query, today }) => {
  const [phrases, rescues] = await Promise.all([getPhrases(), getRescues()]);
  const catParam = query.get('category');
  const statusParam = query.get('status');
  const category = PHRASE_CATEGORIES.includes(catParam as PhraseCategory) ? (catParam as PhraseCategory) : null;
  const status = PHRASE_STATUSES.includes(statusParam as PhraseStatus) ? (statusParam as PhraseStatus) : null;
  const shown = phrases.filter((p) => (!category || p.category === category) && (!status || p.status === status));
  const link = (c: PhraseCategory | null, s: PhraseStatus | null) => {
    const q = new URLSearchParams();
    if (c) q.set('category', c);
    if (s) q.set('status', s);
    const qs = q.toString();
    return href(`/speaklog/phrases${qs ? `?${qs}` : ''}`);
  };
  const current = (on: boolean) => (on ? html`aria-current="true"` : '');

  return {
    title: 'Phrase Bank · SPEAKLOG',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/phrases', 'Phrase Bank', 'Natural English for real situations: what to say, when, and how well it is learned.')}
      <div class="tiles">
        ${PHRASE_STATUSES.map((s) => html`<div class="tile"><span class="label">${s}</span><span class="value">${phrases.length ? phrases.filter((p) => p.status === s).length : '—'}</span></div>`)}
      </div>
      <nav class="chips scroll mt" aria-label="Filter by situation">
        <a class="chip" href="${link(null, status)}" ${current(category === null)}>All situations</a>
        ${PHRASE_CATEGORIES.map((c) => html`<a class="chip" href="${link(c, status)}" ${current(category === c)}>${humanizeTag(c)}</a>`)}
      </nav>
      <nav class="chips scroll" aria-label="Filter by status">
        <a class="chip" href="${link(category, null)}" ${current(status === null)}>Any status</a>
        ${PHRASE_STATUSES.map((s) => html`<a class="chip" href="${link(category, s)}" ${current(status === s)}>${s}</a>`)}
      </nav>
      <div class="cards mt">
        ${shown.length
          ? shown.map(
              (p) => html`<article class="card stack">
                <div class="row"><span class="${STATUS_BADGE[p.status]}">${p.status}</span><span class="tag">${humanizeTag(p.category)}</span></div>
                <h2 class="serif card-title">${p.phrase}</h2>
                ${p.natural && p.natural !== p.phrase ? html`<p><span class="muted">Natural:</span> <strong>${p.natural}</strong></p>` : ''}
                <p class="muted">${p.situation}</p>
                <p class="note">Added ${formatDate(p.added)}${p.session_id ? html` · <a href="${href(`/speaklog/activities/${p.session_id}`)}">from a session</a>` : ''}</p>
              </article>`,
            )
          : empty('No data yet', phrases.length ? 'No phrases match these filters.' : 'Add phrases to data/speaklog/phrases.json.')}
      </div>

      ${section(
        'Sentence Rescue',
        html`<p class="lead" style="margin-bottom:14px">What I wanted to say → what I said → what a native speaker would say.</p>
          ${rescues.length
            ? html`<div class="cards">${[...rescues].reverse().map(
                (r) => html`<article class="card stack">
                  <p class="note">${formatDate(r.date)}${r.category ? ` · ${humanizeTag(r.category)}` : ''}</p>
                  <p><span class="muted">Wanted to say:</span> ${r.wanted_to_say}</p>
                  <p class="correction" style="padding:0;border:0"><span class="said">${r.my_version}</span></p>
                  <p class="serif" style="font-size:1.2rem"><strong>${r.natural_version}</strong></p>
                  ${r.note ? html`<p class="note">${r.note}</p>` : ''}
                </article>`,
              )}</div>`
            : empty('No data yet', 'Rescued sentences appear here after you commit them to data/speaklog/rescues.json.')}

          <form class="card form-grid mt" id="rescue-form" novalidate>
            <h3>Rescue a sentence</h3>
            <p class="note">This form only builds JSON for you to commit. Nothing is saved or published from here.</p>
            <div class="field"><label for="r-wanted">What I wanted to say</label><textarea class="short" id="r-wanted" name="wanted" required placeholder="Can be in Thai"></textarea></div>
            <div class="form-grid two">
              <div class="field"><label for="r-mine">My version</label><textarea class="short" id="r-mine" name="mine" required></textarea></div>
              <div class="field"><label for="r-natural">Natural version</label><textarea class="short" id="r-natural" name="natural" required></textarea></div>
            </div>
            <div class="form-grid two">
              <div class="field"><label for="r-date">Date</label><input type="date" id="r-date" name="date" value="${today}" required></div>
              <div class="field"><label for="r-cat">Situation (optional)</label><select id="r-cat" name="category"><option value="">—</option>${PHRASE_CATEGORIES.map((c) => html`<option value="${c}">${humanizeTag(c)}</option>`)}</select></div>
            </div>
            <div class="field"><label for="r-note">Note (optional)</label><input type="text" id="r-note" name="note"></div>
            <p class="note" role="alert" data-error></p>
            <div class="btn-row"><button class="btn primary" type="submit">Build rescues.json</button></div>
            ${outputPanel('rescue-output', 'rescues.json', 'Merged rescues.json')}
          </form>`,
      )}
    `,
    mount(root) {
      const form = root.querySelector<HTMLFormElement>('#rescue-form');
      if (!form) return;
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const get = (k: string) => String(data.get(k) ?? '').trim();
        const err = form.querySelector<HTMLElement>('[data-error]');
        const missing = [['wanted', 'What I wanted to say'], ['mine', 'My version'], ['natural', 'Natural version'], ['date', 'Date']]
          .filter(([k]) => !get(k!))
          .map(([, label]) => label);
        if (missing.length) {
          if (err) err.textContent = `Please fill in: ${missing.join(', ')}.`;
          hideOutput(root, 'rescue-output');
          return;
        }
        if (err) err.textContent = '';
        const date = get('date');
        const sameDay = rescues.filter((r) => r.date === date).length;
        const entry: Rescue = {
          id: `rescue-${date}-${String(sameDay + 1).padStart(3, '0')}`,
          date,
          wanted_to_say: get('wanted'),
          my_version: get('mine'),
          natural_version: get('natural'),
        };
        const cat = get('category');
        if (cat) entry.category = cat as PhraseCategory;
        if (get('note')) entry.note = get('note');
        const merged: RescuesFile & { $schema: string } = {
          $schema: '../../schemas/rescues.schema.json',
          schema_version: 1,
          rescues: [...rescues, entry].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
        };
        showOutput(root, 'rescue-output', formatDataFile(merged), 'rescues.json');
      });
    },
  };
};

export default page;
