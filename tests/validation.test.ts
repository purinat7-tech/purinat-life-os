import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { scanSensitive } from '../src/lib/sensitive.ts';
import { checkSessions, nextSessionId } from '../src/lib/session-checks.ts';
import { parseWebp } from '../scripts/lib/webp.ts';
import type { Session } from '../src/lib/types.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaDir = path.join(ROOT, 'schemas');

function ajv() {
  const a = new Ajv2020({ allErrors: true, strict: true });
  addFormats(a);
  for (const f of readdirSync(schemaDir)) a.addSchema(JSON.parse(readFileSync(path.join(schemaDir, f), 'utf8')) as object);
  return a;
}

const EXAMPLE: Session = {
  id: '2026-10-23-001',
  date: '2026-10-23',
  type: 'speaking',
  duration_min: 18,
  topic: 'Australia trip',
  scores: { fluency: 3.2, grammar: 3.5, vocabulary: 3.4, communication: 4.0 },
  strength: 'Continuous storytelling',
  focus: 'Past tense consistency',
  corrections: [{ said: 'I very enjoy Sydney.', natural: 'I really enjoyed Sydney.', tag: 'past-tense' }],
  new_phrases: ['The highlight of the trip was...'],
  coach_note: 'Try telling longer stories without translating from Thai first.',
};

test('the example Session Card from the brief is valid', () => {
  const validate = ajv().getSchema('session-card.schema.json')!;
  assert.equal(validate(EXAMPLE), true, JSON.stringify(validate.errors));
});

test('Session Card schema rejects bad scores, types and unknown fields', () => {
  const validate = ajv().getSchema('session-card.schema.json')!;
  assert.equal(validate({ ...EXAMPLE, scores: { fluency: 7 } }), false);
  assert.equal(validate({ ...EXAMPLE, type: 'karaoke' }), false);
  assert.equal(validate({ ...EXAMPLE, pronunciation: 3 }), false, 'pronunciation scoring is out of scope');
  assert.equal(validate({ ...EXAMPLE, id: 'abc' }), false);
  assert.equal(validate({ ...EXAMPLE, date: '2026-02-30' }), false);
});

test('all seed data files match their schemas', () => {
  const a = ajv();
  const pairs: [string, string][] = [
    ['trips.json', 'trips.schema.json'], ['places.json', 'places.schema.json'], ['dreams.json', 'dreams.schema.json'],
    ['races.json', 'races.schema.json'], ['speaklog/sessions.json', 'sessions.schema.json'], ['speaklog/plan.json', 'plan.schema.json'],
  ];
  for (const [file, schema] of pairs) {
    const validate = a.getSchema(schema)!;
    const ok = validate(JSON.parse(readFileSync(path.join(ROOT, 'data', file), 'utf8')));
    assert.equal(ok, true, `${file}: ${JSON.stringify(validate.errors)}`);
  }
});

test('session checks: id must match date, no duplicates', () => {
  const findings = checkSessions([{ ...EXAMPLE, id: '2026-10-22-001' }, EXAMPLE, EXAMPLE], [], '2026-10-23');
  const errors = findings.filter((f) => f.level === 'error').map((f) => f.message);
  assert.ok(errors.some((m) => m.includes('must start with the session date')));
  assert.ok(errors.some((m) => m.includes('duplicate id')));
  assert.ok(checkSessions([EXAMPLE], [EXAMPLE], '2026-10-23').some((f) => f.message.includes('already exists')));
  assert.equal(nextSessionId('2026-10-23', [EXAMPLE]), '2026-10-23-002');
});

test('sensitive data: contact and payment details are errors', () => {
  const levels = (v: unknown) => scanSensitive(v).map((f) => f.level);
  assert.deepEqual(levels({ notes: 'mail me at someone@example.com' }), ['error']);
  assert.deepEqual(levels({ notes: 'call +66 81 234 5678' }), ['error']);
  assert.deepEqual(levels({ notes: 'call 081-234-5678' }), ['error']);
  assert.deepEqual(levels({ notes: 'card 4111 1111 1111 1111' }), ['error']);
  assert.ok(levels({ passport_no: 'x' }).includes('error'));
  assert.ok(levels({ hotel_address: 'x' }).includes('error'));
});

test('sensitive data: flight numbers, booking refs and passports are flagged', () => {
  const messages = (v: unknown) => scanSensitive(v).map((f) => `${f.level}:${f.message}`);
  assert.ok(messages({ memory: 'Flew TG 461 home' }).some((m) => m.startsWith('warning') && m.includes('flight')));
  assert.ok(messages({ notes: 'ref X7K9PQ' }).some((m) => m.includes('booking reference')));
  assert.ok(messages({ notes: 'AA1234567' }).some((m) => m.includes('passport')));
});

test('sensitive data: normal text, dates, ids and lens names are not flagged', () => {
  assert.deepEqual(scanSensitive({ id: '2026-10-23-001', date: '2026-10-23', topic: 'Australia trip', lens: 'RF 24-70mm', camera: 'X100VI' }), []);
  assert.deepEqual(scanSensitive(JSON.parse(readFileSync(path.join(ROOT, 'data', 'places.json'), 'utf8'))), []);
  assert.deepEqual(scanSensitive(JSON.parse(readFileSync(path.join(ROOT, 'data', 'races.json'), 'utf8'))), []);
});

/* ---------------------------------------------------------------- WebP reader */

function riff(chunks: [string, Uint8Array][]): Uint8Array {
  const parts: number[] = [];
  for (const [fourcc, data] of chunks) {
    parts.push(...[...fourcc].map((c) => c.charCodeAt(0)));
    parts.push(data.length & 255, (data.length >> 8) & 255, (data.length >> 16) & 255, (data.length >> 24) & 255);
    parts.push(...data);
    if (data.length % 2) parts.push(0);
  }
  const size = parts.length + 4;
  return new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([size & 255, (size >> 8) & 255, (size >> 16) & 255, size >>> 24], [...'WEBP'].map((c) => c.charCodeAt(0)), parts));
}

test('parseWebp reads VP8X canvas size and metadata flags', () => {
  const w = 1600 - 1;
  const h = 1067 - 1;
  const vp8x = new Uint8Array([0x08 | 0x04, 0, 0, 0, w & 255, (w >> 8) & 255, w >> 16, h & 255, (h >> 8) & 255, h >> 16]);
  const info = parseWebp(riff([['VP8X', vp8x], ['EXIF', new Uint8Array([1, 2, 3, 4])]]))!;
  assert.equal(info.width, 1600);
  assert.equal(info.height, 1067);
  assert.equal(info.hasExif, true);
  assert.equal(info.hasXmp, true);
});

test('parseWebp reads a simple lossy VP8 frame', () => {
  const vp8 = new Uint8Array([0, 0, 0, 0x9d, 0x01, 0x2a, 1200 & 255, 1200 >> 8, 800 & 255, 800 >> 8]);
  const info = parseWebp(riff([['VP8 ', vp8]]))!;
  assert.deepEqual([info.width, info.height, info.hasExif], [1200, 800, false]);
  assert.equal(parseWebp(new TextEncoder().encode('not a webp file at all')), null);
});

/* ---------------------------------------------------------------- validate:data end to end */

function runValidator(dataDir: string, publicDir: string) {
  return spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'validate-data.ts')], {
    env: { ...process.env, LIFEOS_DATA_DIR: dataDir, LIFEOS_PUBLIC_DIR: publicDir, VALIDATE_WARNING_LIMIT: '500' },
    encoding: 'utf8',
  });
}

function fixture(): { data: string; pub: string } {
  const dir = mkdtempSync(path.join(tmpdir(), 'lifeos-'));
  const data = path.join(dir, 'data');
  const pub = path.join(dir, 'public');
  cpSync(path.join(ROOT, 'data'), data, { recursive: true });
  mkdirSync(path.join(pub, 'images', 'places'), { recursive: true });
  return { data, pub };
}

test('validate:data passes on the seed data', () => {
  const r = runValidator(path.join(ROOT, 'data'), path.join(ROOT, 'public'));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /validate:data passed/);
});

test('validate:data fails on duplicate ids, invalid coordinates and missing photos', () => {
  const { data, pub } = fixture();
  const file = path.join(data, 'places.json');
  const json = JSON.parse(readFileSync(file, 'utf8')) as { places: Record<string, unknown>[] };
  json.places[1]!.id = json.places[0]!.id as string;
  json.places[2]!.lat = 123.4;
  json.places[3]!.lng = 'TODO';
  json.places[4]!.photo = 'images/places/missing.webp';
  json.places[4]!.photo_alt = 'Loch Ard Gorge';
  writeFileSync(file, JSON.stringify(json));
  const r = runValidator(data, pub);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /duplicate id/);
  assert.match(r.stdout, /must be <= 90/);
  assert.match(r.stdout, /lat and lng must both be numbers or both be TODO/);
  assert.match(r.stdout, /missing file public\/images\/places\/missing\.webp/);
});

test('validate:data fails on photos with metadata or wrong size, and on contact details', () => {
  const { data, pub } = fixture();
  const w = 2000 - 1;
  const vp8x = new Uint8Array([0x08, 0, 0, 0, w & 255, (w >> 8) & 255, w >> 16, w & 255, (w >> 8) & 255, w >> 16]);
  writeFileSync(path.join(pub, 'images', 'places', 'camp-cove.webp'), riff([['VP8X', vp8x], ['EXIF', new Uint8Array(8)]]));
  writeFileSync(path.join(pub, 'images', 'places', 'orphan.webp'), riff([['VP8X', vp8x]]));
  const file = path.join(data, 'places.json');
  const json = JSON.parse(readFileSync(file, 'utf8')) as { places: Record<string, unknown>[] };
  json.places[8]!.photo = 'images/places/camp-cove.webp';
  json.places[8]!.photo_alt = 'Camp Cove beach';
  json.places[0]!.memory = 'Ask the guide: guide@example.com';
  writeFileSync(file, JSON.stringify(json));
  const r = runValidator(data, pub);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /contains EXIF\/XMP metadata/);
  assert.match(r.stdout, /2000×2000 \(max 1600 px\)/);
  assert.match(r.stdout, /e-mail address/);
  assert.match(r.stdout, /orphan\.webp: not used by any place/);
});

test('validate:data warns when a race is entered as a place', () => {
  const { data, pub } = fixture();
  const file = path.join(data, 'places.json');
  const json = JSON.parse(readFileSync(file, 'utf8')) as { places: Record<string, unknown>[] };
  json.places.push({ ...json.places[0]!, id: 'melbourne-marathon', name: 'Melbourne Marathon' });
  writeFileSync(file, JSON.stringify(json));
  const r = runValidator(data, pub);
  assert.match(r.stdout, /looks like a race/);
});

test('validate:data fails on phrase and library references that do not exist', () => {
  const { data, pub } = fixture();
  writeFileSync(path.join(data, 'speaklog', 'phrases.json'), JSON.stringify({ schema_version: 1, phrases: [
    { id: 'p1', phrase: 'Hi', natural: 'Hi', situation: 'x', category: 'travel', status: 'NEW', added: '2026-10-01', session_id: '2026-10-01-001' },
  ] }));
  writeFileSync(path.join(data, 'speaklog', 'sessions.json'), JSON.stringify({ schema_version: 1, sessions: [
    { id: '2026-10-02-001', date: '2026-10-02', type: 'movie', duration_min: 90, topic: 'Film', library_id: 'missing-film' },
  ] }));
  const r = runValidator(data, pub);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /no session with id "2026-10-01-001"/);
  assert.match(r.stdout, /no library item with id "missing-film"/);
});
