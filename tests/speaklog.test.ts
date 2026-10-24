import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { PlanFile, Session } from '../src/lib/types.ts';
import {
  currentStreak, heatmapWeeks, longestStreak, mistakePatterns, monthlySkills, personalBests, planSchedule, sessionScore,
  tripReadiness, weekSummary, weeklyFocus, weeklyVolume,
} from '../src/lib/speaklog.ts';

const s = (id: string, extra: Partial<Session> = {}): Session => ({
  id: `${id}-001`,
  date: id,
  type: 'speaking',
  duration_min: 20,
  topic: 'Test',
  ...extra,
});

const TODAY = '2026-10-23'; // Friday

test('empty data gives empty results, never invented numbers', () => {
  assert.equal(currentStreak([], TODAY), 0);
  assert.equal(longestStreak([], TODAY), null);
  assert.deepEqual(personalBests([], TODAY), []);
  assert.deepEqual(monthlySkills([], TODAY), []);
  assert.equal(weeklyFocus(mistakePatterns([], TODAY)), null);
  const r = tripReadiness([], TODAY);
  assert.equal(r.overall, null);
  assert.equal(r.covered, 0);
  assert.ok(r.scenarios.every((x) => x.score === null));
});

test('streak continues from yesterday until today is logged', () => {
  const data = [s('2026-10-20'), s('2026-10-21'), s('2026-10-22')];
  assert.equal(currentStreak(data, TODAY), 3);
  assert.equal(currentStreak([...data, s('2026-10-23')], TODAY), 4);
  assert.equal(currentStreak([s('2026-10-20')], TODAY), 0);
  assert.equal(currentStreak([s('2026-10-24')], TODAY), 0, 'future sessions are ignored');
});

test('week summary uses Monday-Sunday and the session types', () => {
  const data = [
    s('2026-10-18', { duration_min: 99 }), // previous Sunday
    s('2026-10-19', { type: 'listening', duration_min: 30 }),
    s('2026-10-20', { type: 'movie', duration_min: 90, new_phrases: ['a', 'b'] }),
    s('2026-10-21', { type: 'travel-simulation', duration_min: 15 }),
  ];
  const w = weekSummary(data, TODAY);
  assert.equal(w.weekStart, '2026-10-19');
  assert.equal(w.minutes, 135);
  assert.equal(w.speakingSessions, 1);
  assert.equal(w.listeningMinutes, 120);
  assert.equal(w.newPhrases, 2);
  const vol = weeklyVolume(data, TODAY, 2);
  assert.deepEqual(vol, [{ weekStart: '2026-10-12', minutes: 99 }, { weekStart: '2026-10-19', minutes: 135 }]);
});

test('session score is the mean of the core scores present', () => {
  assert.equal(sessionScore(s('2026-10-23', { scores: { fluency: 3.2, grammar: 3.5, vocabulary: 3.4, communication: 4.0 } })), 3.5);
  assert.equal(sessionScore(s('2026-10-23', { scores: { listening: 4 } })), null, 'listening is not a core score');
  assert.equal(sessionScore(s('2026-10-23')), null);
});

test('monthly skills are averages x 20 and only from stored scores', () => {
  const data = [
    s('2026-09-10', { scores: { fluency: 3 } }),
    s('2026-10-02', { scores: { fluency: 3, communication: 4 } }),
    s('2026-10-09', { scores: { fluency: 4 }, comprehension_pct: 70 }),
  ];
  const m = monthlySkills(data, TODAY);
  assert.deepEqual(m.map((x) => x.month), ['2026-09', '2026-10']);
  assert.equal(m[0]!.fluency, 60);
  assert.equal(m[1]!.fluency, 70);
  assert.equal(m[1]!.speaking, 80);
  assert.equal(m[1]!.listening, 70);
  assert.equal(m[0]!.grammar, null);
});

test('mistake memory and weekly focus', () => {
  const c = (tag: string) => ({ said: 'x', natural: 'y', tag });
  const data = [
    s('2026-09-01', { corrections: [c('articles'), c('articles'), c('articles')] }),
    s('2026-10-20', { corrections: [c('past-tense')] }),
    s('2026-10-22', { corrections: [c('past-tense'), c('articles')] }),
  ];
  const patterns = mistakePatterns(data, TODAY);
  assert.equal(patterns[0]!.tag, 'past-tense', 'recent beats frequent');
  assert.equal(patterns[0]!.recent, 2);
  assert.equal(patterns[1]!.count, 4);
  const focus = weeklyFocus(patterns)!;
  assert.equal(focus.label, 'Past tense');
  assert.match(focus.reason, /2 times in the last 14 days/);
});

test('trip readiness averages the latest 3 scored sessions per scenario', () => {
  const sim = (date: string, scenario: Session['scenario'], v: number) =>
    s(date, { type: 'travel-simulation', scenario, scores: { fluency: v, grammar: v, vocabulary: v, communication: v } });
  const data = [sim('2026-10-01', 'airport', 1), sim('2026-10-02', 'airport', 3), sim('2026-10-03', 'airport', 3), sim('2026-10-04', 'airport', 3), sim('2026-10-05', 'hotel', 4)];
  const r = tripReadiness(data, TODAY);
  assert.equal(r.scenarios.find((x) => x.scenario === 'airport')!.score, 60);
  assert.equal(r.scenarios.find((x) => x.scenario === 'hotel')!.score, 80);
  assert.equal(r.covered, 2);
  assert.equal(r.overall, 70);
});

test('personal bests', () => {
  const data = [s('2026-10-20', { duration_min: 45, scores: { fluency: 3.8 } }), s('2026-10-21', { duration_min: 10 }), s('2026-10-22')];
  const pbs = personalBests(data, TODAY);
  assert.equal(pbs.find((p) => p.key === 'longest')!.value, '45 min');
  assert.equal(pbs.find((p) => p.key === 'streak')!.value, '3 days');
  assert.equal(pbs.find((p) => p.key === 'fluency')!.value, '3.8 / 5');
});

test('heatmap has 7 days per week and marks the future', () => {
  const weeks = heatmapWeeks([s('2026-10-22', { duration_min: 40 })], TODAY, 4);
  assert.equal(weeks.length, 4);
  assert.ok(weeks.every((w) => w.length === 7));
  const last = weeks.at(-1)!;
  assert.equal(last[3]!.minutes, 40);
  assert.equal(last[5]!.future, true);
});

test('training plan counts back from May 2027 (tentative)', () => {
  const plan = (JSON.parse(readFileSync(new URL('../data/speaklog/plan.json', import.meta.url), 'utf8')) as PlanFile).plan;
  const p = planSchedule(plan, TODAY);
  assert.equal(p.tripDate, '2027-05-01');
  assert.equal(p.dateIsApproximate, true);
  assert.equal(p.daysToTrip, 190);
  assert.equal(p.current, 'Base');
  const taper = p.phases.find((x) => x.name === 'Taper')!;
  assert.deepEqual([taper.start, taper.end], ['2027-04-24', '2027-04-30']);
  const build = p.phases.find((x) => x.name === 'Build')!;
  assert.equal(build.start, '2027-01-30');
  assert.equal(planSchedule(plan, '2027-04-25').current, 'Taper');
  assert.equal(planSchedule(plan, '2027-05-02').current, 'Trip');
});
