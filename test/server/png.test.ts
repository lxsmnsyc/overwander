import { describe, expect, it } from 'vitest';
import { blank, encode } from '../../src/server/sprites/raster';
import decode, {
  type Image,
  depthFor,
  encodeIndexed,
  encodeSmallest,
  encodeTruecolor,
  paletteOf,
  sameImage,
} from '../../src/server/sprites/png';

/**
 * The codec the processors write their sheets with.
 *
 * A sprite sheet is pixel art, so the only encoding worth having is one
 * that gives back exactly what it was handed: `encodeSmallest` picks the
 * smallest container it can *prove* does that, and everything below is
 * about that proof. The sheets it will meet are flat-coloured and mostly
 * transparent, which is why the pictures here are too.
 */

/**
 * A sheet of flat eight-pixel blocks in as many colours as asked for,
 * plus one block left transparent — pixel art in miniature, which is
 * what makes an indexed container worth choosing. The sheet has to hold
 * `colors + 1` blocks for every colour to appear
 */
function striped(width: number, height: number, colors: number): Image {
  const rgba = Buffer.alloc(width * height * 4);
  const across = Math.max(1, width >> 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      const band = ((y >> 3) * across + (x >> 3)) % (colors + 1);

      // The transparent one, since that is what a sprite sheet is mostly
      // made of
      if (band === colors) {
        continue;
      }
      rgba[at] = (band * 37) % 256;
      rgba[at + 1] = (band * 71) % 256;
      rgba[at + 2] = (band * 113) % 256;
      rgba[at + 3] = 255;
    }
  }
  return { width, height, rgba };
}

/**
 * A sheet with more colours than a palette can hold: the channels vary
 * with x and y separately, so the combinations are the area rather than
 * a line through the cube
 */
function shaded(width: number, height: number): Image {
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;

      rgba[at] = (x * 6) % 256;
      rgba[at + 1] = (y * 6) % 256;
      rgba[at + 2] = (x * y) % 256;
      rgba[at + 3] = 255;
    }
  }
  return { width, height, rgba };
}

describe('what a sheet is stored as', () => {
  it('indexes a sheet drawn in few colours', () => {
    // Big enough that the pixels rather than the headers decide it,
    // which is the size the real sheets are
    const image = striped(256, 256, 12);
    const stored = encodeSmallest(image);

    // Twelve colours and a transparent block is thirteen, which fits in
    // four bits a pixel. Which filtering won is a size question
    expect(stored.as).toMatch(/^indexed 4-bit,/);
    expect(sameImage(image, decode(stored.bytes))).toBe(true);
    // And the point of all of it: well under what RGBA costs
    expect(stored.bytes.length).toBeLessThan(encodeTruecolor(image, 'none').length / 2);
  });

  it('takes the depth the palette needs and no more', () => {
    // Wide enough that every colour gets a block of its own
    for (const [colors, depth, side] of [
      [1, 1, 32],
      [3, 2, 32],
      [12, 4, 48],
      [200, 8, 128],
    ] as const) {
      const palette = paletteOf(striped(side, side, colors));

      expect(palette?.colors.length, `${colors} colours`).toBe(colors + 1);
      expect(depthFor(palette?.colors.length ?? 0), `${colors} colours`).toBe(depth);
    }
  });

  it('keeps whichever container came out smaller', () => {
    // Few colours over flat blocks: indexing wins, and by a lot
    for (const colors of [1, 3, 12]) {
      const image = striped(256, 256, colors);
      const stored = encodeSmallest(image);

      expect(stored.as, `${colors} colours`).toMatch(/^indexed /);
      expect(stored.bytes.length).toBeLessThanOrEqual(encodeTruecolor(image, 'none').length);
    }
    // Two hundred of them and truecolour with filtering can win instead.
    // Either answer is fine as long as it is the smaller one
    const busy = striped(128, 128, 200);
    const stored = encodeSmallest(busy);
    const palette = paletteOf(busy);

    expect(palette).not.toBeNull();

    if (palette != null) {
      expect(stored.bytes.length).toBeLessThanOrEqual(encodeIndexed(busy, palette, 'none').length);
    }
    expect(stored.bytes.length).toBeLessThanOrEqual(encodeTruecolor(busy, 'none').length);
  });

  it('stays truecolour when there are too many colours to index', () => {
    const image = shaded(64, 64);

    expect(paletteOf(image)).toBeNull();

    const stored = encodeSmallest(image);

    expect(stored.as).toMatch(/^truecolour/);
    expect(sameImage(image, decode(stored.bytes))).toBe(true);
  });

  it('gives back every pixel it was handed, whichever container it chose', () => {
    for (const image of [striped(31, 17, 2), striped(128, 128, 200), shaded(40, 24)]) {
      const read = decode(encodeSmallest(image).bytes);

      expect([read.width, read.height]).toEqual([image.width, image.height]);
      // Byte for byte rather than `sameImage`, which forgives the colour
      // under a fully transparent pixel
      for (let at = 0; at < image.rgba.length; at += 4) {
        if (image.rgba[at + 3] === 0) {
          expect(read.rgba[at + 3], `alpha at ${at}`).toBe(0);
          continue;
        }
        expect(read.rgba.readUInt32BE(at), `pixel at ${at}`).toBe(image.rgba.readUInt32BE(at));
      }
    }
  });

  it('reads back what it wrote at every depth', () => {
    for (const [colors, side] of [
      [1, 32],
      [3, 32],
      [12, 48],
      [200, 128],
    ] as const) {
      const image = striped(side, side, colors);
      const palette = paletteOf(image);

      expect(palette).not.toBeNull();

      if (palette == null) {
        continue;
      }

      for (const filtering of ['none', 'adaptive'] as const) {
        expect(
          sameImage(image, decode(encodeIndexed(image, palette, filtering))),
          `${colors} colours, ${filtering}`,
        ).toBe(true);
        expect(
          sameImage(image, decode(encodeTruecolor(image, filtering))),
          `truecolour, ${filtering}`,
        ).toBe(true);
      }
    }
  });

  it('is what the processors write their sheets with', () => {
    // The step this replaced handed `sharp` a raw buffer and took
    // whatever PNG it made, which was RGBA every time
    const sheet = blank(64, 64);

    for (let at = 0; at < sheet.data.length; at += 4) {
      sheet.data[at] = 12;
      sheet.data[at + 1] = 200;
      sheet.data[at + 2] = 64;
      sheet.data[at + 3] = 255;
    }

    const stored = encode(sheet);
    const read = decode(stored.bytes);

    expect(stored.as).toBe('indexed 1-bit, none');
    expect([read.width, read.height]).toEqual([64, 64]);
    expect(sameImage({ width: 64, height: 64, rgba: sheet.data }, read)).toBe(true);
  });

  it('leaves the colour under a transparent pixel alone', () => {
    const image = striped(32, 32, 4);

    // A pixel nobody can see, painted a colour nothing else uses: it
    // must not cost the sheet a palette entry
    image.rgba.writeUInt32BE(0xff00ff00, 0);

    const palette = paletteOf(image);

    // Four colours and one entry for everything transparent
    expect(palette?.colors.length).toBe(5);
    expect(sameImage(image, decode(encodeSmallest(image).bytes))).toBe(true);
  });
});
