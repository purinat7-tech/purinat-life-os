import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWebp } from '../scripts/lib/webp.ts';

// sharp is a devDependency; skip (not fail) if its native binary is unavailable on this machine.
let sharpAvailable = true;
try {
  await import('sharp');
} catch {
  sharpAvailable = false;
}

test('npm run images: resizes to 1600 px, WebP under 300 KB, strips EXIF incl. GPS', { skip: !sharpAvailable && 'sharp not installed' }, async () => {
  const { default: sharp } = await import('sharp');
  const { optimise, assertNoMetadata, MAX_BYTES } = await import('../scripts/lib/images.ts');

  // A 4000x3000 JPEG with smooth, photo-like content and EXIF: camera, timestamp and GPS position.
  const seed = Buffer.alloc(40 * 30 * 3);
  for (let i = 0; i < seed.length; i++) seed[i] = (i * 2654435761) % 251;
  const original = await sharp(seed, { raw: { width: 40, height: 30, channels: 3 } })
    .resize(4000, 3000)
    .jpeg({ quality: 92 })
    .withExif({
      IFD0: { Make: 'TestCam', Model: 'Model X', DateTime: '2026:10:12 07:15:00' },
      IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '38/1 39/1 57/1', GPSLongitudeRef: 'E', GPSLongitude: '143/1 6/1 16/1' },
    })
    .toBuffer();
  const before = await sharp(original).metadata();
  assert.ok(before.exif, 'test image has EXIF before optimisation');

  const out = await optimise(original);
  assert.ok(out.buffer.length <= MAX_BYTES, `${out.buffer.length} bytes`);
  assert.equal(Math.max(out.width, out.height), 1600);
  const after = await sharp(out.buffer).metadata();
  assert.equal(after.format, 'webp');
  assert.equal(after.exif, undefined);
  assert.equal(after.xmp, undefined);
  const info = parseWebp(out.buffer)!;
  assert.equal(info.hasExif, false);
  assert.equal(info.width, out.width);
  await assertNoMetadata(out.buffer, 'test');
});
