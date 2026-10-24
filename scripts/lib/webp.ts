/**
 * Minimal WebP (RIFF) reader: dimensions and metadata chunks, no dependencies.
 * Used by validate:data to check every published photo without decoding it.
 */

export interface WebpInfo {
  width: number;
  height: number;
  hasExif: boolean;
  hasXmp: boolean;
  hasIcc: boolean;
  animated: boolean;
  chunks: string[];
}

export function parseWebp(buf: Uint8Array): WebpInfo | null {
  if (buf.length < 20) return null;
  const ascii = (offset: number, length: number) => String.fromCharCode(...buf.subarray(offset, offset + length));
  if (ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WEBP') return null;
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const info: WebpInfo = { width: 0, height: 0, hasExif: false, hasXmp: false, hasIcc: false, animated: false, chunks: [] };

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const fourcc = ascii(offset, 4);
    const size = view.getUint32(offset + 4, true);
    const data = offset + 8;
    if (data + size > buf.length) break;
    info.chunks.push(fourcc);
    const b = (i: number) => buf[data + i] ?? 0;
    if (fourcc === 'VP8X' && size >= 10) {
      const flags = b(0);
      if (flags & 0x20) info.hasIcc = true;
      if (flags & 0x08) info.hasExif = true;
      if (flags & 0x04) info.hasXmp = true;
      if (flags & 0x02) info.animated = true;
      info.width = 1 + (b(4) | (b(5) << 8) | (b(6) << 16));
      info.height = 1 + (b(7) | (b(8) << 8) | (b(9) << 16));
    } else if (fourcc === 'VP8 ' && size >= 10 && !info.width) {
      if (b(3) === 0x9d && b(4) === 0x01 && b(5) === 0x2a) {
        info.width = view.getUint16(data + 6, true) & 0x3fff;
        info.height = view.getUint16(data + 8, true) & 0x3fff;
      }
    } else if (fourcc === 'VP8L' && size >= 5 && !info.width) {
      if (b(0) === 0x2f) {
        const bits = view.getUint32(data + 1, true);
        info.width = (bits & 0x3fff) + 1;
        info.height = ((bits >>> 14) & 0x3fff) + 1;
      }
    } else if (fourcc === 'EXIF') {
      info.hasExif = true;
    } else if (fourcc === 'XMP ') {
      info.hasXmp = true;
    } else if (fourcc === 'ICCP') {
      info.hasIcc = true;
    }
    offset = data + size + (size % 2);
  }
  return info;
}
