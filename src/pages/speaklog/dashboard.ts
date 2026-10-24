import { html } from '../../lib/html.ts';
import type { PageHandler } from '../../view.ts';
import { getLibrary, getPhrases, getPlan, getSessions } from '../../data.ts';
import {
  currentStreak, heatmapWeeks, monthlySkills, moviesCompleted, pastSessions, personalBests, phrasesMastered,
  SKILL_LABELS, SKILL_SOURCES, SKILLS, totals, weekSummary, weeklyVolume,
} from '../../lib/speaklog.ts';
import { formatDate, formatShortMonthKey, monthName } from '../../lib/dates.ts';
import { href } from '../../base.ts';
import { defaultFlag, empty, progressRow, section, speaklogHead, tile } from '../../components/ui.ts';
import { barChart, heatmap, sparkline } from '../../components/charts.ts';
import { activityCard, bindLocalBanner, IMPORT_HINT, localBanner } from './shared.ts';

const page: PageHandler = async ({ today }) => {
  const [{ sessions, localIds }, library, phrases, plan] = await Promise.all([getSessions(), getLibrary(), getPhrases(), getPlan()]);
  const t = totals(sessions, today);
  const has = t.sessions > 0;
  const week = weekSummary(sessions, today);
  const goals = plan.weekly_goals;
  const volume = weeklyVolume(sessions, today, 12);
  const skills = monthlySkills(sessions, today, 12);
  const pbs = personalBests(sessions, today);
  const recent = pastSessions(sessions, today).slice(-3).reverse();

  const tiles = html`<div class="tiles six">
    ${tile('Current streak', has ? currentStreak(sessions, today) : null, { unit: 'days', accent: has })}
    ${tile('Minutes this week', has ? week.minutes : null, { unit: 'min', sub: has ? `${week.sessions} sessions` : undefined })}
    ${tile('Speaking sessions', has ? week.speakingSessions : null, { sub: has ? 'this week' : undefined })}
    ${tile('Listening hours', has ? (week.listeningMinutes / 60).toFixed(1) : null, { unit: 'h', sub: has ? 'this week' : undefined })}
    ${tile('Movies completed', library.length ? moviesCompleted(library) : null, { sub: library.length ? 'all time' : undefined })}
    ${tile('Phrases learned', phrases.length ? phrasesMastered(phrases) : null, { sub: phrases.length ? `mastered of ${phrases.length}` : undefined })}
  </div>`;

  const goalsBody = html`<div class="card">
    <div class="progress-list">
      ${progressRow('Practice minutes', week.minutes, goals.minutes, 'min')}
      ${progressRow('Speaking sessions', week.speakingSessions, goals.speaking_sessions, '')}
      ${progressRow('Listening minutes', week.listeningMinutes, goals.listening_minutes, 'min')}
      ${progressRow('New phrases', week.newPhrases, goals.new_phrases, '')}
    </div>
    <p class="note mt">Week of ${formatDate(week.weekStart)} (Mon–Sun, Bangkok time). ${goals.is_default ? defaultFlag('data/speaklog/plan.json') : ''}</p>
  </div>`;

  const volumeBody = has
    ? barChart(
        volume.map((w, i) => ({
          // Like a training log: label only the first week of each month.
          label: i === 0 || volume[i - 1]!.weekStart.slice(5, 7) !== w.weekStart.slice(5, 7) ? monthName(Number(w.weekStart.slice(5, 7)), 'short') : '',
          value: w.minutes,
          title: `Week of ${formatDate(w.weekStart)}`,
          current: i === volume.length - 1,
        })),
        { caption: 'Practice minutes per week, last 12 weeks', unit: 'Minutes' },
      )
    : empty('No data yet', IMPORT_HINT);

  const skillsBody = skills.length
    ? html`<div class="skills">
        ${SKILLS.map((skill) => {
          const values = skills.map((m) => m[skill]);
          const latest = [...values].reverse().find((v) => v !== null);
          return html`<div class="skill">
            <div class="top"><span>${SKILL_LABELS[skill]}</span><b>${latest ?? '—'}</b></div>
            ${values.some((v) => v !== null)
              ? sparkline(values, `${SKILL_LABELS[skill]} per month, 0 to 100`)
              : html`<p class="note">No data yet</p>`}
            <div class="row note" style="justify-content:space-between"><span>${formatShortMonthKey(skills[0]!.month)}</span><span>${formatShortMonthKey(skills.at(-1)!.month)}</span></div>
          </div>`;
        })}
      </div>
      <p class="note mt">Monthly averages on 0–100. Sources: ${SKILLS.map((s) => `${SKILL_LABELS[s]} = ${SKILL_SOURCES[s]}`).join('; ')}.</p>`
    : empty('No data yet', 'Skill scores come from the scores in your Session Cards.');

  const pbBody = pbs.length
    ? html`<div class="tiles four">${pbs.map((pb) =>
        pb.sessionId
          ? html`<a class="tile card-link" href="${href(`/speaklog/activities/${pb.sessionId}`)}"><span class="label">${pb.label}</span><span class="value">${pb.value}</span><span class="sub">${pb.detail}</span></a>`
          : tile(pb.label, pb.value, { sub: pb.detail }),
      )}</div>`
    : empty('No data yet', 'Personal bests appear after your first session.');

  return {
    title: 'SPEAKLOG Dashboard',
    section: 'speaklog',
    body: html`
      ${speaklogHead('/speaklog', 'Dashboard', 'Training English like an endurance sport: volume, consistency and quality, all from logged Session Cards.')}
      ${localBanner(localIds.size)}
      ${tiles}
      ${section('Weekly goals', goalsBody)}
      ${section('Weekly volume', volumeBody)}
      ${section('Skill progress', skillsBody)}
      ${section('Practice calendar', has ? heatmap(heatmapWeeks(sessions, today, 53)) : empty('No data yet', 'Each practice day lights up here.'))}
      ${section('English Personal Bests', pbBody)}
      ${section(
        'Recent activities',
        recent.length ? html`<div class="feed">${recent.map((s) => activityCard(s, localIds.has(s.id)))}</div>` : empty('No data yet', IMPORT_HINT),
        recent.length ? { path: '/speaklog/activities', label: 'All activities' } : undefined,
      )}
    `,
    mount(root) {
      bindLocalBanner(root);
      root.querySelectorAll<HTMLElement>('[data-scroll-end]').forEach((el) => {
        el.scrollLeft = el.scrollWidth;
      });
    },
  };
};

export default page;
