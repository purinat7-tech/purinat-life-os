import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getJournal } from '../../data.ts';
import { formatDate } from '../../lib/dates.ts';
import { href } from '../../base.ts';
import { empty, speaklogHead } from '../../components/ui.ts';

const page: PageHandler = async ({ query }) => {
  const entries = await getJournal();
  const topics = [...new Set(entries.map((e) => e.topic))].sort((a, b) => a.localeCompare(b));
  const topicParam = query.get('topic');
  const topic = topicParam && topics.includes(topicParam) ? topicParam : null;
  const groups = (topic ? [topic] : topics).map((t) => ({
    topic: t,
    items: entries.filter((e) => e.topic === t).sort((a, b) => b.date.localeCompare(a.date)),
  }));

  return {
    title: 'Journal · SPEAKLOG',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/journal', 'Journal', 'Personal English notes, grouped by topic.')}
      ${topics.length
        ? html`<nav class="chips scroll" aria-label="Topics">
            <a class="chip" href="${href('/speaklog/journal')}" ${topic === null ? html`aria-current="true"` : ''}>All topics</a>
            ${topics.map((t) => html`<a class="chip" href="${href(`/speaklog/journal?topic=${encodeURIComponent(t)}`)}" ${topic === t ? html`aria-current="true"` : ''}>${t}</a>`)}
          </nav>`
        : ''}
      ${groups.length
        ? groups.map(
            (g) => html`<section class="section" aria-label="${g.topic}">
              <div class="section-head"><h2>${g.topic}</h2><span class="note">${g.items.length} note${g.items.length === 1 ? '' : 's'}</span></div>
              <div class="stack">${g.items.map(
                (e) => html`<article class="card stack" id="${e.id}">
                  <p class="note">${formatDate(e.date)}</p>
                  <h3 class="serif card-title">${e.title}</h3>
                  <div class="prose">${e.body.split(/\n{2,}/).map((para) => html`<p>${para}</p>`)}</div>
                </article>`,
              )}</div>
            </section>`,
          )
        : empty('No data yet', 'Add notes to data/speaklog/journal.json.')}
    `,
  };
};

export default page;
