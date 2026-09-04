import 'server-only';
import sharp from 'sharp';
import { type Encoded, encodeSmallest } from './png';

/**
 * Pixels, on the server.
 *
 * The packer tool did this work in a canvas: decode into an `Image`,
 * read it back through `getImageData`, draw the pieces into a second
 * canvas and hand the result to a download. None of that exists here,
 * so an image is a flat RGBA buffer and compositing is arithmetic over
 * it. `sharp` is used at one end only — decoding whatever was uploaded.
 * The finished sheet is encoded by [`png.ts`](./png.ts), which picks the
 * container rather than always writing RGBA.
 */

/** One decoded image: straight RGBA, four bytes to the pixel. */
export interface Raster {
  width: number;
  height: number;
  data: Buffer;
}

/** Decodes any format sharp reads into RGBA. */
export async function decode(bytes: Uint8Array): Promise<Raster> {
  const { data, info } = await sharp(bytes)
    // Kept as authored: a sprite sheet is pixel art on a transparent
    // ground, and any resampling at all would smear its edges
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { width: info.width, height: info.height, data };
}

/** A transparent image to compose into. */
export function blank(width: number, height: number): Raster {
  return { width, height, data: Buffer.alloc(Math.max(0, width * height * 4)) };
}

/**
 * Copies a rectangle of one image into another.
 *
 * A straight overwrite rather than an alpha blend: every piece lands
 * on its own untouched part of the sheet, and blending a sprite's
 * semi-transparent edge against the transparent ground would darken it
 */
export function blit(
  target: Raster,
  source: Raster,
  from: { x: number; y: number; width: number; height: number },
  to: { x: number; y: number },
): void {
  // Whatever hangs off the left of either image is dropped rather than
  // wrapping onto the row above, which is what a negative index does to
  // a flat buffer
  const skip = Math.max(0, -from.x, -to.x);
  const sourceX = from.x + skip;
  const targetX = to.x + skip;

  for (let row = 0; row < from.height; row += 1) {
    const sourceY = from.y + row;
    const targetY = to.y + row;

    if (sourceY < 0 || sourceY >= source.height || targetY < 0 || targetY >= target.height) {
      continue;
    }
    const width = Math.min(from.width - skip, source.width - sourceX, target.width - targetX);

    if (width <= 0) {
      continue;
    }
    const start = (sourceY * source.width + sourceX) * 4;
    // Against the buffer rather than against the stated height: a
    // drawing whose size does not match what it is being read as
    // should come out short, not throw out of a copy
    const end = Math.min(start + width * 4, source.data.length);

    if (end <= start) {
      continue;
    }
    source.data.copy(target.data, (targetY * target.width + targetX) * 4, start, end);
  }
}

/**
 * The finished sheet, as the bytes of a PNG file and what it was stored
 * as.
 *
 * `sharp` is not asked to do this: it writes 8-bit RGBA whatever the
 * sheet holds, which is four bytes a pixel for art drawn in sixteen
 * colours. [`encodeSmallest`](./png.ts) tries the indexed containers
 * too and keeps the smallest that gives the same pixels back, so a
 * sheet lands compact rather than being rewritten by a pass afterwards
 */
export function encode(raster: Raster): Encoded {
  return encodeSmallest({ width: raster.width, height: raster.height, rgba: raster.data });
}

/** Whether a pixel is drawn at all. */
export function opaque(raster: Raster, x: number, y: number): boolean {
  return raster.data[(y * raster.width + x) * 4 + 3] > 0;
}
