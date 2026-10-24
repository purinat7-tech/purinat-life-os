/** Photo optimisation used by `npm run images` (and its tests). Requires sharp. */
import sharp from 'sharp';
import { parseWebp } from './webp.ts';

export const MAX_BYTES = 300_000;
export const MAX_PX = 1600;

export interface Optimised {
  buffer: Buffer;
  width: number;
  height: number;
  quality: number;
}

/**
 * Longest side <= 1600 px (never enlarged), WebP, quality stepped down until < 300 KB.
 * sharp drops ALL metadata (EXIF incl. GPS, XMP, IPTC, ICC) unless asked to keep it;
 * .rotate() applies the EXIF orientation first so the photo stays upright.
 */
export async function optimise(input: string | Buffer): Promise<Optimised> {
  let size = MAX_PX;
  let quality = 82;
  for (;;) {
    const { data, info } = await sharp(input, { failOn: 'error' })
      .rotate()
      .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 5, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });
    if (data.length <= MAX_BYTES) return { buffer: data, width: info.width, height: info.height, quality };
    if (quality > 50) quality -= 8;
    else if (size > 1000) {
      size -= 200;
      quality = 78;
    } else throw new Error(`cannot get under ${MAX_BYTES / 1000} KB`);
  }
}

/** Throws if any metadata survived. Checked with sharp and with our own RIFF reader. */
export async function assertNoMetadata(buffer: Buffer, name: string): Promise<void> {
  const meta = await sharp(buffer).metadata();
  const webp = parseWebp(buffer);
  if (meta.exif || meta.xmp || meta.iptc || meta.icc || !webp || webp.hasExif || webp.hasXmp) {
    throw new Error(`${name}: metadata is still present after optimisation; refusing to write it`);
  }
}
