import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getSessions } from '../../data.ts';
import { pastSessions, TYPE_LABELS } from '../../lib/speaklog.ts';
import { SESSION_TYPES, type SessionType } from '../../lib/types.ts';
import { href } from '../../base.ts';
import { empty, speaklogHead } from '../../components/ui.ts';
import { activityCard, bindLocalBanner, IMPORT_HINT, localBanner } from './shared.ts';

const page: PageHandler = async ({ today, query }) => {
  const { sessions, localIds } = await getSessions();
  const all = pastSessions(sessions, today).reverse();
  const typeParam = query.get('type');
  const type = SESSION_TYPES.includes(typeParam as SessionType) ? (typeParam as SessionType) : null;
  const shown = type ? all.filter((s) => s.type === type) : all;
  const count = (t: SessionType) => all.filter((s) => s.type === t).length;
  const future = sessions.length - pastSessions(sessions, today).length;

  return {
    title: 'Activities · SPEAKLOG',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog/activities', 'Activities', 'Every session, newest first, like a training feed.')}
      ${localBanner(localIds.size)}
      <nav class="chips scroll" aria-label="Filter by type">
        <a class="chip" href="${href('/speaklog/activities')}" ${type === null ? html`aria-current="true"` : ''}>All <span class="count">${all.length}</span></a>
        ${SESSION_TYPES.map(
          (t) => html`<a class="chip" href="${href(`/speaklog/activities?type=${t}`)}" ${type === t ? html`aria-current="true"` : ''}>${TYPE_LABELS[t]} <span class="count">${count(t)}</span></a>`,
        )}
      </nav>
      <div class="feed mt">
        ${shown.length
          ? shown.map((s) => activityCard(s, localIds.has(s.id), { level: 2 }))
          : empty('No data yet', type ? `No ${TYPE_LABELS[type].toLowerCase()} sessions logged.` : IMPORT_HINT)}
      </div>
      ${future ? html`<p class="note mt">${future} session card(s) dated in the future are hidden until that day.</p>` : ''}
    `,
    mount: bindLocalBanner,
  };
};

export default page;
