import * as v from 'valibot';
import type Biome from '../ids/biome';
import Decoration from '../ids/decorations';
import { BIOME_IDS, DECORATION_IDS } from '../ids/names';
import namesFile from '../text/en/decorations.yaml';
import { idOf, idsOf } from '../yaml';
import biomesFile from './biome-decorations.yaml';

export default Decoration;

/**
 * Where scenery grows, read out of `biome-decorations.yaml`, and what
 * each kind is called, out of `text/en/decorations.yaml`. The kinds
 * are numbered in `ids/decorations.ts`
 */
const BIOME = v.object({
  grows: v.array(v.string()),
  blocker: v.optional(v.string()),
  island: v.optional(v.array(v.string())),
  pictures: v.optional(v.record(v.string(), v.array(v.string()))),
});

export const DECORATION_NAMES: Record<number, string> = {};

for (const [name, title] of Object.entries(v.parse(v.record(v.string(), v.string()), namesFile))) {
  DECORATION_NAMES[idOf<Decoration>(DECORATION_IDS, name, `text/en/decorations.yaml: ${name}`)] =
    title;
}

/**
 * How many pieces of scenery a chunk carries. Enough to furnish it,
 * few enough that the ground is still mostly ground
 */
export const MIN_DECORATIONS = 8;
export const MAX_DECORATIONS = 12;

/** What grows or lies about in each biome, rolled over uniformly */
const DECORATIONS = new Map<Biome, Decoration[]>();

/** The tall thing a blocked cell shows, where it is not a tree */
const BLOCKERS = new Map<Biome, Decoration>();

/** What grows on an island in each open sea */
const ISLAND_DECORATIONS = new Map<Biome, Decoration[]>();

/**
 * What a biome draws a kind as, where it draws something of its own,
 * for `decoration-sprite.ts`. Kept with the rest of the biome's
 * scenery so a biome is one record
 */
export const BIOME_PICTURES: Record<number, Record<number, string[]>> = {};

for (const [name, written] of Object.entries(v.parse(v.record(v.string(), BIOME), biomesFile))) {
  const where = `biome-decorations.yaml: ${name}`;
  const biome = idOf<Biome>(BIOME_IDS, name, where);

  DECORATIONS.set(biome, idsOf<Decoration>(DECORATION_IDS, written.grows, where));
  if (written.blocker != null) {
    BLOCKERS.set(biome, idOf<Decoration>(DECORATION_IDS, written.blocker, where));
  }
  if (written.island != null) {
    ISLAND_DECORATIONS.set(biome, idsOf<Decoration>(DECORATION_IDS, written.island, where));
  }
  if (written.pictures != null) {
    const own: Record<number, string[]> = {};

    for (const [kind, pictures] of Object.entries(written.pictures)) {
      own[idOf<Decoration>(DECORATION_IDS, kind, where)] = pictures;
    }
    BIOME_PICTURES[biome] = own;
  }
}

// Every biome says what grows in it, even if the answer is nothing
for (const [name, biome] of Object.entries(BIOME_IDS)) {
  if (!DECORATIONS.has(biome)) {
    throw new Error(`${name} needs a row in biome-decorations.yaml`);
  }
}

/** The tall thing standing on a cell nothing can walk through. */
export function getBlocker(biome: Biome): Decoration {
  return BLOCKERS.get(biome) ?? Decoration.Tree;
}

export function getBiomeDecorations(biome: Biome): Decoration[] {
  return DECORATIONS.get(biome) ?? [];
}

/** What grows on dry ground in this country: its islands, out at sea */
export function getIslandDecorations(biome: Biome): Decoration[] {
  return ISLAND_DECORATIONS.get(biome) ?? getBiomeDecorations(biome);
}
