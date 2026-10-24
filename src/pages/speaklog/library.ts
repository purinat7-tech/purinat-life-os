import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getLibrary } from '../../data.ts';
import { isKnownNumber, LIBRARY_STATUSES, type LibraryKind, type LibraryStatus, type SubtitleMode } from '../../lib/types.ts';
import { href } from '../../base.ts';
import { empty, speaklogHead } from '../../components/ui.ts';
import { icons } from '../../components/icons.ts';

const STATUS_LABEL: Record<LibraryStatus, string> = { want: 'Want to watch', watching: 'Watching', completed: 'Completed', rewatch: 'Rewatch' };
const KIND_LABEL: Record<LibraryKind, string> = { movie: 'Movie', series: 'Series', podcast: 'Podcast', youtube: 'YouTube' };
const SUBS_LABEL: Record<SubtitleMode, string> = { none: 'No subtitles', english: 'English subtitles', thai: 'Thai subtitles', 'english+thai': 'English + Thai subtitles' };

const page: PageHandler = async ({ query }) => {
  const library = await getLibrary();
  const statusParam = query.get('status');
  const status = LIBRARY_STATUSES.includes(statusParam as LibraryStatus) ? (statusParam as LibraryStatus) : null;
  const shown = status ? library.filter((i) => i.status === status) : library;

  return {
    title: 'Library · SPEAKLOG',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/library', 'Library', 'Movies, series, podcasts and YouTube used as listening training.')}
      <nav class="chips scroll" aria-label="Filter by status">
        <a class="chip" href="${href('/speaklog/library')}" ${status === null ? html`aria-current="true"` : ''}>All <span class="count">${library.length}</span></a>
        ${LIBRARY_STATUSES.map((s) => html`<a class="chip" href="${href(`/speaklog/library?status=${s}`)}" ${status === s ? html`aria-current="true"` : ''}>${STATUS_LABEL[s]} <span class="count">${library.filter((i) => i.status === s).length}</span></a>`)}
      </nav>
      <div class="cards mt">
        ${shown.length
          ? shown.map(
              (i) => html`<article class="card stack">
                <div class="row"><span class="badge ${i.status === 'completed' ? 'solid' : 'accent'}">${STATUS_LABEL[i.status]}</span><span class="tag">${KIND_LABEL[i.kind]}</span></div>
                <h2 class="serif card-title">${i.kind === 'movie' || i.kind === 'series' ? icons.film : icons.headphones} ${i.title}</h2>
                <dl class="kv">
                  <dt>Difficulty</dt><dd>${isKnownNumber(i.difficulty) ? html`<span role="img" aria-label="${i.difficulty} of 5">${'●'.repeat(i.difficulty)}${'○'.repeat(5 - i.difficulty)}</span>` : 'TODO'}</dd>
                  <dt>Subtitles</dt><dd>${SUBS_LABEL[i.subtitle_mode]}</dd>
                  ${typeof i.comprehension_pct === 'number' ? html`<dt>Comprehension</dt><dd>${i.comprehension_pct}%</dd>` : ''}
                </dl>
                ${typeof i.comprehension_pct === 'number'
                  ? html`<div class="bar-track" role="progressbar" aria-label="Comprehension" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${i.comprehension_pct}"><div class="bar-fill" style="width:${i.comprehension_pct}%"></div></div>`
                  : ''}
                ${i.useful_phrases.length ? html`<div><strong>Useful phrases</strong><ul style="margin:6px 0 0;padding-left:20px">${i.useful_phrases.map((p) => html`<li>${p}</li>`)}</ul></div>` : ''}
                ${i.notes ? html`<p class="muted">${i.notes}</p>` : ''}
              </article>`,
            )
          : empty('No data yet', library.length ? 'Nothing with this status.' : 'Add titles to data/speaklog/library.json.')}
      </div>
    `,
  };
};

export default page;
