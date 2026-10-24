/**
 * npm run images [-- --force]
 *
 * Reads original photos from photos-src/ (git-ignored, never committed) and writes
 * public/images/places/<name>.webp:
 *   - longest side at most 1600 px (never enlarged)
 *   - WebP, quality lowered step by step until the file is under 300 KB
 *   - rotated upright, then ALL metadata removed: EXIF (GPS location, camera/device, timestamps),
 *     XMP, IPTC and ICC. The result is checked; the script fails if any metadata remains.
 *
 * Name each original after the place id, e.g. photos-src/twelve-apostles.jpg, then set
 * "photo": "images/places/twelve-apostles.webp" for that place in data/places.json.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertNoMetadata, optimise } from './lib/images.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'photos-src');
const OUT = path.join(ROOT, 'public', 'images', 'places');
const INPUT = /\.(jpe?g|png|webp|tiff?|avif|heic|heif)$/i;
const force = process.argv.includes('--force');

const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function main(): Promise<void> {
  if (!existsSync(SRC)) {
    mkdirSync(SRC, { recursive: true });
    console.log('Created photos-src/. Put original photos there (named after the place id) and run again.');
    return;
  }
  mkdirSync(OUT, { recursive: true });
  const files = readdirSync(SRC).filter((f) => INPUT.test(f));
  if (!files.length) {
    console.log('No photos found in photos-src/.');
    return;
  }
  let failed = 0;
  for (const file of files) {
    const id = slug(path.parse(file).name);
    const target = path.join(OUT, `${id}.webp`);
    if (existsSync(target) && !force) {
      console.log(`skip  ${id}.webp (exists; use --force to overwrite)`);
      continue;
    }
    try {
      const { buffer, width, height, quality } = await optimise(path.join(SRC, file));
      await assertNoMetadata(buffer, file);
      writeFileSync(target, buffer);
      console.log(`ok    ${id}.webp  ${width}×${height}  ${(buffer.length / 1000).toFixed(0)} KB  q${quality}  metadata removed`);
      console.log(`      "photo": "images/places/${id}.webp"`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      const hint = /heif|heic|codec/i.test(message) ? ' (HEIC is not supported: export the photo as JPEG first)' : '';
      console.error(`fail  ${file}: ${message}${hint}`);
    }
  }
  console.log('\nOriginals stay in photos-src/ (git-ignored). Only the cleaned WebP files are published.');
  if (failed) process.exit(1);
}

await main();
