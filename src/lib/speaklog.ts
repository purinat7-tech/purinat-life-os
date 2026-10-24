/**
 * SPEAKLOG statistics. Pure functions over Session Cards.
 * Every number shown on the site comes from these functions and the stored JSON.
 * Nothing is estimated, randomised or filled in: missing data returns null / [].
 *
 * Score scale: Session Cards store 0-5. Charts show 0-100 (= score x 20).
 */
import type { LibraryItem, Phrase, Plan, PhaseName, Scenario, Session, SessionType } from './types.ts';
import { SCENARIOS } from './types.ts';
import { addDays, dayNumber, diffDays, isIsoDate, monthKey, startOfWeek, addMonths } from './dates.ts';

export const SPEAKING_TYPES: ReadonlySet<SessionType> = new Set<SessionType>(['speaking', 'storytelling', 'travel-simulation']);
export const LISTENING_TYPES: ReadonlySet<SessionType> = new Set<SessionType>(['listening', 'movie']);
export const CORE_SCORES = ['fluency', 'grammar', 'vocabulary', 'communication'] as const;

export const TYPE_LABELS: Record<SessionType, string> = {
  speaking: 'Speaking',
  listening: 'Listening',
  movie: 'Movie',
  reading: 'Reading',
  shadowing: 'Shadowing',
  'travel-simulation': 'Travel simulation',
  storytelling: 'Storytelling',
};

export const SCENARIO_LABELS: Record<Scenario, string> = {
  airport: 'Airport',
  hotel: 'Hotel',
  restaurant: 'Restaurant',
  shopping: 'Shopping',
  'car-rental': 'Car rental',
  'small-talk': 'Small talk',
  storytelling: 'Storytelling',
  'problem-solving': 'Problem solving',
};

const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Sessions on or before today, sorted oldest first. Future-dated cards are ignored. */
export function pastSessions(sessions: Session[], today: string): Session[] {
  return sessions
    .filter((s) => isIsoDate(s.date) && s.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/** Mean of the four core scores that are present (0-5), or null when none are. */
export function sessionScore(s: Session): number | null {
  const values = CORE_SCORES.map((k) => s.scores?.[k]).filter((v): v is number => typeof v === 'number');
  const m = mean(values);
  return m === null ? null : round1(m);
}

export function minutesByDay(sessions: Session[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) map.set(s.date, (map.get(s.date) ?? 0) + s.duration_min);
  return map;
}

/** Consecutive practice days ending today (or yesterday, if today has no session yet). */
export function currentStreak(sessions: Session[], today: string): number {
  const days = new Set(pastSessions(sessions, today).map((s) => s.date));
  let cursor = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(cursor)) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function longestStreak(sessions: Session[], today: string): { days: number; start: string; end: string } | null {
  const days = [...new Set(pastSessions(sessions, today).map((s) => s.date))].sort();
  if (!days.length) return null;
  let best = { days: 1, start: days[0]!, end: days[0]! };
  let run = { days: 1, start: days[0]!, end: days[0]! };
  for (let i = 1; i < days.length; i++) {
    const day = days[i]!;
    if (diffDays(run.end, day) === 1) run = { days: run.days + 1, start: run.start, end: day };
    else run = { days: 1, start: day, end: day };
    if (run.days > best.days) best = { ...run };
  }
  return best;
}

export interface WeekSummary {
  weekStart: string;
  sessions: number;
  minutes: number;
  speakingSessions: number;
  listeningMinutes: number;
  newPhrases: number;
}

export function weekSummary(sessions: Session[], today: string): WeekSummary {
  const weekStart = startOfWeek(today);
  const inWeek = pastSessions(sessions, today).filter((s) => s.date >= weekStart);
  return {
    weekStart,
    sessions: inWeek.length,
    minutes: inWeek.reduce((sum, s) => sum + s.duration_min, 0),
    speakingSessions: inWeek.filter((s) => SPEAKING_TYPES.has(s.type)).length,
    listeningMinutes: inWeek.filter((s) => LISTENING_TYPES.has(s.type)).reduce((sum, s) => sum + s.duration_min, 0),
    newPhrases: inWeek.reduce((sum, s) => sum + (s.new_phrases?.length ?? 0), 0),
  };
}

export function weeklyVolume(sessions: Session[], today: string, weeks = 12): { weekStart: string; minutes: number }[] {
  const current = startOfWeek(today);
  const totals = new Map<string, number>();
  for (const s of pastSessions(sessions, today)) {
    const w = startOfWeek(s.date);
    totals.set(w, (totals.get(w) ?? 0) + s.duration_min);
  }
  const out: { weekStart: string; minutes: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const w = addDays(current, -7 * i);
    out.push({ weekStart: w, minutes: totals.get(w) ?? 0 });
  }
  return out;
}

export const SKILLS = ['listening', 'speaking', 'fluency', 'vocabulary', 'grammar'] as const;
export type Skill = (typeof SKILLS)[number];
export const SKILL_LABELS: Record<Skill, string> = {
  listening: 'Listening',
  speaking: 'Speaking',
  fluency: 'Fluency',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
};
export const SKILL_SOURCES: Record<Skill, string> = {
  listening: 'scores.listening × 20, or comprehension_pct',
  speaking: 'scores.communication × 20',
  fluency: 'scores.fluency × 20',
  vocabulary: 'scores.vocabulary × 20',
  grammar: 'scores.grammar × 20',
};

function skillValue(s: Session, skill: Skill): number | null {
  const sc = s.scores ?? {};
  switch (skill) {
    case 'listening':
      if (typeof sc.listening === 'number') return sc.listening * 20;
      return typeof s.comprehension_pct === 'number' ? s.comprehension_pct : null;
    case 'speaking':
      return typeof sc.communication === 'number' ? sc.communication * 20 : null;
    default: {
      const v = sc[skill];
      return typeof v === 'number' ? v * 20 : null;
    }
  }
}

export type MonthlySkills = { month: string } & Record<Skill, number | null>;

/** Monthly averages on 0-100 for the last `months` months that end with the latest session. */
export function monthlySkills(sessions: Session[], today: string, months = 12): MonthlySkills[] {
  const past = pastSessions(sessions, today);
  if (!past.length) return [];
  const last = monthKey(today);
  const first = monthKey(past[0]!.date);
  const out: MonthlySkills[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = addMonths(last, -i);
    if (m < first) continue;
    const inMonth = past.filter((s) => monthKey(s.date) === m);
    const row = { month: m } as MonthlySkills;
    for (const skill of SKILLS) {
      const avg = mean(inMonth.map((s) => skillValue(s, skill)).filter((v): v is number => v !== null));
      row[skill] = avg === null ? null : Math.round(avg);
    }
    out.push(row);
  }
  return out;
}

export interface PersonalBest {
  key: string;
  label: string;
  value: string;
  detail: string;
  sessionId?: string;
}

export function personalBests(sessions: Session[], today: string): PersonalBest[] {
  const past = pastSessions(sessions, today);
  if (!past.length) return [];
  const pbs: PersonalBest[] = [];
  const maxBy = <T>(xs: T[], f: (x: T) => number | null): T | undefined => {
    let best: T | undefined;
    let bestVal = -Infinity;
    for (const x of xs) {
      const v = f(x);
      if (v !== null && v > bestVal) {
        best = x;
        bestVal = v;
      }
    }
    return best;
  };

  const longest = maxBy(past, (s) => s.duration_min);
  if (longest) pbs.push({ key: 'longest', label: 'Longest session', value: `${longest.duration_min} min`, detail: `${longest.topic} · ${longest.date}`, sessionId: longest.id });

  const speaking = maxBy(past.filter((s) => SPEAKING_TYPES.has(s.type)), (s) => s.duration_min);
  if (speaking) pbs.push({ key: 'longest-speaking', label: 'Longest speaking session', value: `${speaking.duration_min} min`, detail: `${speaking.topic} · ${speaking.date}`, sessionId: speaking.id });

  const streak = longestStreak(past, today);
  if (streak) pbs.push({ key: 'streak', label: 'Longest streak', value: `${streak.days} day${streak.days === 1 ? '' : 's'}`, detail: `${streak.start} → ${streak.end}` });

  const weeks = new Map<string, number>();
  for (const s of past) weeks.set(startOfWeek(s.date), (weeks.get(startOfWeek(s.date)) ?? 0) + s.duration_min);
  const bigWeek = [...weeks.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (bigWeek) pbs.push({ key: 'big-week', label: 'Biggest week', value: `${bigWeek[1]} min`, detail: `Week of ${bigWeek[0]}` });

  const bestScore = maxBy(past, sessionScore);
  if (bestScore) pbs.push({ key: 'score', label: 'Best session score', value: `${sessionScore(bestScore)?.toFixed(1)} / 5`, detail: `${bestScore.topic} · ${bestScore.date}`, sessionId: bestScore.id });

  const fluency = maxBy(past, (s) => s.scores?.fluency ?? null);
  if (fluency?.scores?.fluency !== undefined) pbs.push({ key: 'fluency', label: 'Best fluency', value: `${fluency.scores.fluency.toFixed(1)} / 5`, detail: `${fluency.topic} · ${fluency.date}`, sessionId: fluency.id });

  const phrases = maxBy(past, (s) => (s.new_phrases?.length ? s.new_phrases.length : null));
  if (phrases?.new_phrases?.length) pbs.push({ key: 'phrases', label: 'Most new phrases in a session', value: String(phrases.new_phrases.length), detail: `${phrases.topic} · ${phrases.date}`, sessionId: phrases.id });

  const comp = maxBy(past, (s) => s.comprehension_pct ?? null);
  if (comp?.comprehension_pct !== undefined) pbs.push({ key: 'comprehension', label: 'Best comprehension', value: `${comp.comprehension_pct}%`, detail: `${comp.topic} · ${comp.date}`, sessionId: comp.id });

  return pbs;
}

/* ------------------------------------------------------------------ Mistakes */

export function humanizeTag(tag: string): string {
  const s = tag.replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface MistakeExample {
  said: string;
  natural: string;
  date: string;
  sessionId: string;
}

export interface MistakePattern {
  tag: string;
  label: string;
  count: number;
  recent: number;
  lastSeen: string;
  examples: MistakeExample[];
}

export const RECENT_DAYS = 14;

export function mistakePatterns(sessions: Session[], today: string): MistakePattern[] {
  const recentFrom = addDays(today, -(RECENT_DAYS - 1));
  const byTag = new Map<string, MistakePattern>();
  for (const s of pastSessions(sessions, today)) {
    for (const c of s.corrections ?? []) {
      const p = byTag.get(c.tag) ?? { tag: c.tag, label: humanizeTag(c.tag), count: 0, recent: 0, lastSeen: s.date, examples: [] };
      p.count += 1;
      if (s.date >= recentFrom) p.recent += 1;
      if (s.date > p.lastSeen) p.lastSeen = s.date;
      p.examples.push({ said: c.said, natural: c.natural, date: s.date, sessionId: s.id });
      byTag.set(c.tag, p);
    }
  }
  return [...byTag.values()]
    .map((p) => ({ ...p, examples: p.examples.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3) }))
    .sort((a, b) => b.recent - a.recent || b.count - a.count || b.lastSeen.localeCompare(a.lastSeen) || a.tag.localeCompare(b.tag));
}

export interface WeeklyFocus {
  tag: string;
  label: string;
  reason: string;
  example: MistakeExample | undefined;
}

/** Rule: the pattern seen most in the last 14 days; if none is recent, the most frequent overall. */
export function weeklyFocus(patterns: MistakePattern[]): WeeklyFocus | null {
  const top = patterns[0];
  if (!top) return null;
  const reason =
    top.recent > 0
      ? `Seen ${top.recent} time${top.recent === 1 ? '' : 's'} in the last ${RECENT_DAYS} days (${top.count} in total).`
      : `No corrections in the last ${RECENT_DAYS} days. This is the most frequent pattern overall (${top.count} time${top.count === 1 ? '' : 's'}).`;
  return { tag: top.tag, label: top.label, reason, example: top.examples[0] };
}

/* ------------------------------------------------------------------ Readiness */

export interface ScenarioReadiness {
  scenario: Scenario;
  label: string;
  score: number | null;
  sessions: number;
  lastDate: string | null;
}

export const READINESS_WINDOW = 3;

/** Per scenario: mean score (0-100) of the latest 3 scored sessions that name that scenario. */
export function tripReadiness(sessions: Session[], today: string): {
  scenarios: ScenarioReadiness[];
  overall: number | null;
  covered: number;
} {
  const past = pastSessions(sessions, today);
  const scenarios = SCENARIOS.map((scenario): ScenarioReadiness => {
    const forScenario = past.filter((s) => s.scenario === scenario);
    const scored = forScenario.filter((s) => sessionScore(s) !== null).slice(-READINESS_WINDOW);
    const avg = mean(scored.map((s) => (sessionScore(s) ?? 0) * 20));
    return {
      scenario,
      label: SCENARIO_LABELS[scenario],
      score: avg === null ? null : Math.round(avg),
      sessions: forScenario.length,
      lastDate: forScenario.at(-1)?.date ?? null,
    };
  });
  const scores = scenarios.map((s) => s.score).filter((s): s is number => s !== null);
  const overall = mean(scores);
  return { scenarios, overall: overall === null ? null : Math.round(overall), covered: scores.length };
}

/* ------------------------------------------------------------------ Heatmap */

export interface HeatDay {
  date: string;
  minutes: number;
  future: boolean;
}

/** Columns of Monday-Sunday weeks, oldest first; the last column is the current week. */
export function heatmapWeeks(sessions: Session[], today: string, weeks = 26): HeatDay[][] {
  const byDay = minutesByDay(pastSessions(sessions, today));
  const firstMonday = addDays(startOfWeek(today), -7 * (weeks - 1));
  const cols: HeatDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstMonday, w * 7 + d);
      col.push({ date, minutes: byDay.get(date) ?? 0, future: date > today });
    }
    cols.push(col);
  }
  return cols;
}

/* ------------------------------------------------------------------ Totals */

export function totals(sessions: Session[], today: string) {
  const past = pastSessions(sessions, today);
  return {
    sessions: past.length,
    minutes: past.reduce((sum, s) => sum + s.duration_min, 0),
    first: past[0]?.date ?? null,
    last: past.at(-1)?.date ?? null,
  };
}

export function moviesCompleted(library: LibraryItem[]): number {
  return library.filter((i) => i.kind === 'movie' && (i.status === 'completed' || i.status === 'rewatch')).length;
}

export function phrasesMastered(phrases: Phrase[]): number {
  return phrases.filter((p) => p.status === 'MASTERED').length;
}

/* ------------------------------------------------------------------ Training plan */

export interface PhaseWindow {
  name: PhaseName;
  focus: string;
  weeks: number | null;
  start: string | null;
  end: string | null;
  state: 'past' | 'current' | 'upcoming';
}

export interface PlanSchedule {
  tripName: string;
  tripDate: string | null;
  dateIsApproximate: boolean;
  tentative: boolean;
  daysToTrip: number | null;
  phases: PhaseWindow[];
  current: PhaseName | 'Trip' | null;
}

/**
 * Phases are counted backwards from the trip date: the last phase ends the day before
 * the trip. The phase with `weeks: null` (Base) absorbs all time before the others.
 * When only the month is known, the 1st of that month is used and flagged as approximate.
 */
export function planSchedule(plan: Plan, today: string): PlanSchedule {
  const nt = plan.next_trip;
  const tripDate = nt.start_date && isIsoDate(nt.start_date) ? nt.start_date : nt.target_month ? `${nt.target_month}-01` : null;
  const items = plan.phases.items;
  const phases: PhaseWindow[] = items.map((p) => ({ name: p.name, focus: p.focus, weeks: p.weeks, start: null, end: null, state: 'upcoming' }));
  let current: PlanSchedule['current'] = null;

  if (tripDate && isIsoDate(tripDate)) {
    let cursorEnd = addDays(tripDate, -1);
    for (let i = phases.length - 1; i >= 0; i--) {
      const ph = phases[i]!;
      ph.end = cursorEnd;
      if (ph.weeks === null) {
        ph.start = null;
        break;
      }
      ph.start = addDays(cursorEnd, -(ph.weeks * 7) + 1);
      cursorEnd = addDays(ph.start, -1);
    }
    for (const ph of phases) {
      if (ph.end === null) continue;
      if (ph.end < today) ph.state = 'past';
      else if (ph.start === null || ph.start <= today) ph.state = 'current';
    }
    // Only one phase can be current: the earliest one that has not ended.
    const firstCurrent = phases.findIndex((p) => p.state === 'current');
    phases.forEach((p, i) => {
      if (p.state === 'current' && i !== firstCurrent) p.state = 'upcoming';
    });
    current = firstCurrent >= 0 ? phases[firstCurrent]!.name : today >= tripDate ? 'Trip' : null;
  }

  const daysToTrip = tripDate && isIsoDate(tripDate) ? dayNumber(tripDate) - dayNumber(today) : null;
  return {
    tripName: nt.name,
    tripDate,
    dateIsApproximate: !(nt.start_date && isIsoDate(nt.start_date)),
    tentative: nt.tentative,
    daysToTrip,
    phases,
    current,
  };
}
