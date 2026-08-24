import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { asRecord } from '../../auth/__normalize';
import type { Drawing } from './files';
import { biomeDestination, writeSheet } from './files';
import { decode, encode } from './raster';

/**
 * A packed biome tileset, palette-swapped into another biome's folder.
 *
 * The art is indexed in practice: a rip holds a couple of dozen exact
 * colours, so a swap is a lookup rather than any blending. The same
 * map is run over the sheet's pixels and over the palette frames in
 * its description, since the animation re-applies those colours at
 * runtime and an unswapped palette would cycle the old biome back in.
 *
 * Colours the map does not name are left alone and reported, so the
 * workflow is: run with an empty map, read the sheet's colours off
 * the result, fill the map in, run again.
 */

export interface RecolorOptions {
  /** The packed biome the sheet is read from. */
  source: number;
  /** The biome folder the recoloured copy lands in. */
  biome: number;
  /** `#rrggbb` to `#rrggbb`, lowercase. */
  swaps: Map<string, string>;
}

export interface RecolorResult {
  written: string[];
  drawing: Drawing;
  /** Pixels the map changed. */
  swapped: number;
  /** Every opaque colour the map said nothing about, most-used first. */
  unmapped: string[];
}

const HEX = /^#[0-9a-f]{6}$/;

/**
 * A swap list out of a textarea: one swap per line, two colours,
 * whitespace or an arrow between them. Blank lines are skipped, and a
 * line that is not two colours refuses the whole parse rather than
 * quietly recolouring with half a map
 */
export function parseSwaps(spec: string): Map<string, string> {
  const swaps = new Map<string, string>();

  for (const line of spec.split('\n')) {
    const said = line.trim().toLowerCase();

    if (said === '') {
      continue;
    }
    const pair = said.split(/\s*(?:->|=>|\s)\s*/).filter(Boolean);

    if (pair.length !== 2 || !HEX.test(pair[0]) || !HEX.test(pair[1])) {
      throw new Error(`Not a colour swap: "${line.trim()}"`);
    }
    swaps.set(pair[0], pair[1]);
  }
  return swaps;
}

function hexOf(red: number, green: number, blue: number): string {
  return `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, '0')}`;
}

export default async function recolorTileset(options: RecolorOptions): Promise<RecolorResult> {
  if (options.source === options.biome) {
    throw new Error('The copy needs a biome of its own');
  }

  const from = biomeDestination(options.source);
  const image = await readFile(join(process.cwd(), 'public', from.image));
  const meta = await readFile(join(process.cwd(), 'public', String(from.meta)), 'utf8');
  const raster = await decode(new Uint8Array(image));

  // Keyed by packed rgb so the pixel pass never builds strings
  const byPixel = new Map<number, [number, number, number]>();

  for (const [old, next] of options.swaps) {
    const wanted = Number.parseInt(next.slice(1), 16);

    byPixel.set(Number.parseInt(old.slice(1), 16), [
      (wanted >> 16) & 0xff,
      (wanted >> 8) & 0xff,
      wanted & 0xff,
    ]);
  }

  const missed = new Map<string, number>();
  let swapped = 0;

  for (let at = 0; at < raster.data.length; at += 4) {
    if (raster.data[at + 3] === 0) {
      continue;
    }
    const key = (raster.data[at] << 16) | (raster.data[at + 1] << 8) | raster.data[at + 2];
    const wanted = byPixel.get(key);

    if (wanted == null) {
      const hex = hexOf(raster.data[at], raster.data[at + 1], raster.data[at + 2]);

      missed.set(hex, (missed.get(hex) ?? 0) + 1);
      continue;
    }
    [raster.data[at], raster.data[at + 1], raster.data[at + 2]] = wanted;
    swapped += 1;
  }

  // The description travels whole; only the folder it claims and the
  // colours its palettes cycle change
  const data = asRecord(JSON.parse(meta));

  data.biome = options.biome;
  for (const entry of Array.isArray(data.palettes) ? data.palettes : []) {
    const palette = asRecord(entry);

    if (Array.isArray(palette.frames)) {
      palette.frames = palette.frames.map((frame): (string | null)[] =>
        Array.isArray(frame)
          ? frame.map((slot) =>
              typeof slot === 'string' ? (options.swaps.get(slot.toLowerCase()) ?? slot) : null,
            )
          : [],
      );
    }
  }

  const drawn = encode(raster);
  const written = await writeSheet(
    biomeDestination(options.biome),
    drawn.bytes,
    JSON.stringify(data, null, 2),
  );

  return {
    written: written.map((file) => file.path),
    drawing: { ...written[0], as: drawn.as, bytes: drawn.bytes.length, plain: drawn.plain },
    swapped,
    unmapped: [...missed.entries()].sort((one, other) => other[1] - one[1]).map(([hex]) => hex),
  };
}
