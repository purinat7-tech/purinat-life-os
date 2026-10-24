import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, addMonths, daysInclusive, formatRange, isIsoDate, startOfWeek, todayIso, weekdayIndex } from '../src/lib/dates.ts';

test('isIsoDate rejects impossible dates', () => {
  assert.equal(isIsoDate('2026-10-08'), true);
  assert.equal(isIsoDate('2026-02-30'), false);
  assert.equal(isIsoDate('TODO'), false);
  assert.equal(isIsoDate('2026-1-8'), false);
});

test('trip length counts first and last day (8-20 Oct = 13 days)', () => {
  assert.equal(daysInclusive('2026-10-08', '2026-10-20'), 13);
  assert.equal(daysInclusive('2026-10-08', '2026-10-08'), 1);
});

test('weeks start on Monday', () => {
  assert.equal(weekdayIndex('2026-10-19'), 0); // Monday
  assert.equal(weekdayIndex('2026-10-25'), 6); // Sunday
  assert.equal(startOfWeek('2026-10-23'), '2026-10-19');
  assert.equal(startOfWeek('2026-10-19'), '2026-10-19');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('todayIso uses Bangkok time, not UTC', () => {
  // 2026-10-22 18:30 UTC is already 23 Oct 01:30 in Bangkok.
  assert.equal(todayIso(new Date('2026-10-22T18:30:00Z')), '2026-10-23');
  assert.equal(todayIso(new Date('2026-10-22T16:59:00Z')), '2026-10-22');
});

test('date formatting', () => {
  assert.equal(formatRange('2026-10-08', '2026-10-20'), '8–20 Oct 2026');
  assert.equal(formatRange('TODO', 'TODO'), 'Dates TODO');
  assert.equal(addMonths('2026-11', 3), '2027-02');
});
