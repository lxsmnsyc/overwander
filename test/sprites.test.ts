import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ItemTypes, Items } from '../src/data/ids/items';
import registerItems, { getItemData, listItemsByType } from '../src/data/items';
import berryPlantSheet, { berryPlantName } from '../src/data/overworld/berry-plant';
import { BIOME_NAMES } from '../src/data/biome/names';
import Biome from '../src/data/ids/biome';
import Landmark, { LANDMARKS, LANDMARK_NAMES } from '../src/data/overworld/landmark';
import landmarkPicture, {
  LANDMARK_SHEET,
  hasLandmarkPicture,
  landmarkPictures,
} from '../src/data/overworld/landmark-sprite';
import Decoration, {
  DECORATION_NAMES,
  getBiomeDecorations,
} from '../src/data/overworld/decoration';
import decorationPicture, {
  DECORATION_SHEET,
  TREE_SHEET,
  biomeVariants,
  decorationPictures,
  grottoPicture,
  isSnowy,
} from '../src/data/overworld/decoration-sprite';

/**
 * The sprites and what has been done to them.
 *
 * The pictures under `public/sprites` come from outside this repository
 * and go through `pnpm compact-sprites` before they ship, which rewrites
 * the PNG container; `sprite-pipeline.json` records what it did. This is
 * what stops that record drifting: a sheet re-exported by the packing
 * tool no longer matches its entry, and a sheet dropped in and forgotten
 * has no entry at all.
 *
 * Either way the fix is to run the command, which is why the failures
 * below say so.
 */

const SPRITE_ROOT = 'public/sprites';

registerItems();

const LEDGER_PATH = 'sprite-pipeline.json';

/** How much of the digest the record keeps, in hex characters */
const DIGEST_LENGTH = 16;

interface SheetRecord {
  digest: unknown;
  compact: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function fieldOf(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

/** A pair of numbers the sheets write points and offsets as. */
function pairOf(pair: unknown): [number, number] | null {
  return Array.isArray(pair) && pair.length === 2 ? [Number(pair[0]), Number(pair[1])] : null;
}

function trimOf(entry: unknown): [number, number] {
  return pairOf(fieldOf(entry, 'trim')) ?? [0, 0];
}

function readLedger(): Map<string, SheetRecord> {
  const sheets = fieldOf(JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as unknown, 'sheets');
  const found = new Map<string, SheetRecord>();

  if (!isRecord(sheets)) {
    return found;
  }

  for (const [key, entry] of Object.entries(sheets)) {
    found.set(key, {
      digest: fieldOf(entry, 'digest'),
      compact: fieldOf(entry, 'compact'),
    });
  }
  return found;
}

/** Every picture that ships, wherever in the tree it sits */
function findSheets(root: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);

    if (entry.isDirectory()) {
      found.push(...findSheets(path));
    } else if (entry.name.endsWith('.png')) {
      found.push(path);
    }
  }
  return found.sort();
}

function digestOf(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, DIGEST_LENGTH);
}

const SHEETS = findSheets(SPRITE_ROOT);
const LEDGER = readLedger();

describe('the sprite pipeline record', () => {
  it('has an entry for every sheet that ships', () => {
    expect(SHEETS.length).toBeGreaterThan(0);

    const missing = SHEETS.filter((path) => !LEDGER.has(path));

    expect(missing, `run \`pnpm compact-sprites\` — unrecorded: ${missing.join(', ')}`).toEqual([]);
  });

  it('recorded the sheets that are actually on disk', () => {
    // The digest is what makes the record worth keeping: without it an
    // entry says a sheet was processed without saying *which* sheet
    const stale = SHEETS.filter((path) => {
      const known = LEDGER.get(path);

      return known != null && known.digest !== digestOf(path);
    });

    expect(
      stale,
      `these have been re-exported since they were processed, run \`pnpm compact-sprites\`: ${stale.join(', ')}`,
    ).toEqual([]);
  });

  it('remembers nothing that is no longer there', () => {
    const gone = [...LEDGER.keys()].filter((path) => !existsSync(path));

    expect(gone, `run \`pnpm compact-sprites\` to clear: ${gone.join(', ')}`).toEqual([]);
  });
});

describe('the berry plants that ship', () => {
  const ROOT = `${SPRITE_ROOT}/overworld/landmarks-berry`;

  /** Every berry the game registers, by the name its folder is called. */
  function registered(): { item: Items; name: string }[] {
    return listItemsByType(ItemTypes.Berry)
      .map((item) => ({ item, name: berryPlantName(item) }))
      .sort((one, two) => one.name.localeCompare(two.name));
  }

  it('names a folder after the berry, the way the icons are named', () => {
    expect(berryPlantSheet(Items.CheriBerry)).toBe('landmarks-berry/cheri');
  });

  it('has a plant for every berry the game registers', () => {
    const missing = registered()
      .filter(({ name }) => !existsSync(`${ROOT}/${name}/image.png`))
      .map((one) => one.name);

    expect(missing, 'run `node scripts/berry-plants.ts <sheet>` for these').toEqual([]);
  });

  it('ships no plant for a berry the game does not have', () => {
    const known = new Set(registered().map((one) => one.name));

    expect(readdirSync(ROOT).filter((folder) => !known.has(folder))).toEqual([]);
  });

  it('lays every plant out as two frames across and three stages down', () => {
    for (const { name } of registered()) {
      const described = JSON.parse(readFileSync(`${ROOT}/${name}/data.json`, 'utf8')) as unknown;
      const grid = fieldOf(described, 'grid');

      expect(fieldOf(grid, 'columns'), name).toBe(2);
      expect(fieldOf(grid, 'rows'), name).toBe(3);
      // Cropped alike, so a stage is still found by multiplying
      expect(fieldOf(described, 'width'), name).toBe(Number(fieldOf(grid, 'frameWidth')) * 2);
      expect(fieldOf(described, 'height'), name).toBe(Number(fieldOf(grid, 'frameHeight')) * 3);
      // All cut from the same cell, so every berry scales alike
      expect(fieldOf(grid, 'sourceFrameWidth'), name).toBe(22);
      expect(fieldOf(grid, 'sourceFrameHeight'), name).toBe(34);
    }
  });

  it('says where every plant meets the ground', () => {
    for (const { name } of registered()) {
      const described = JSON.parse(readFileSync(`${ROOT}/${name}/data.json`, 'utf8')) as unknown;
      const grid = fieldOf(described, 'grid');
      const base = pairOf(fieldOf(grid, 'base'));
      const trim = trimOf(grid);

      // Said in the cell's coordinates, and inside the crop that was
      // packed: the mound is drawn, so it survived the cropping
      expect(base, name).not.toBe(null);
      expect(base?.[0], name).toBeGreaterThanOrEqual(trim[0]);
      expect(base?.[1], name).toBeGreaterThanOrEqual(trim[1]);
      expect(base?.[0], name).toBeLessThan(trim[0] + Number(fieldOf(grid, 'frameWidth')));
      expect(base?.[1], name).toBeLessThan(trim[1] + Number(fieldOf(grid, 'frameHeight')));
      // Above the underside of the mound, which is the front of it
      expect(base?.[1], name).toBeLessThan(Number(fieldOf(grid, 'sourceFrameHeight')) - 1);
    }
  });

  it('takes the folder name off the item, so a rename cannot go unnoticed', () => {
    for (const { item, name } of registered()) {
      // A grade is two words in the name and one hyphen in the folder,
      // which is how the icon sheet spells it too
      expect(`${name.replace(/-/g, ' ')} berry`).toBe(getItemData(item).name.toLowerCase());
    }
  });

  it('spells a two-word berry the way its icon is filed', () => {
    expect(berryPlantSheet(Items.GoldenRazzBerry)).toBe('landmarks-berry/golden-razz');
  });
});

interface Packed {
  name: string;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  trim: [number, number];
  base: [number, number] | null;
}

function packed(sheet: string): Packed[] {
  const described = JSON.parse(
    readFileSync(`${SPRITE_ROOT}/overworld/${sheet}/data.json`, 'utf8'),
  ) as unknown;
  const images = fieldOf(described, 'images');

  return (Array.isArray(images) ? images : []).map((entry: unknown) => ({
    name: String(fieldOf(entry, 'name')).replace(/\.png$/, ''),
    width: Number(fieldOf(entry, 'width')),
    height: Number(fieldOf(entry, 'height')),
    sourceWidth: Number(fieldOf(entry, 'sourceWidth')),
    sourceHeight: Number(fieldOf(entry, 'sourceHeight')),
    trim: trimOf(entry),
    base: pairOf(fieldOf(entry, 'base')),
  }));
}

describe('the landmarks that ship', () => {
  it('has a picture for every landmark drawn as one', () => {
    const drawn = new Set(packed(LANDMARK_SHEET).map((one) => one.name));
    const missing = landmarkPictures().filter((name) => !drawn.has(name));

    expect(missing, 'run `node scripts/landmarks.ts <sheet>` for these').toEqual([]);
  });

  it('leaves the landmarks somebody stands on to their charsets', () => {
    // A market is its vendor and a gym is its leader. A picture as well
    // would be the cell saying the same thing twice
    for (const kind of [
      Landmark.Market,
      Landmark.Trainer,
      Landmark.GymLeader,
      Landmark.EliteFour,
      Landmark.Champion,
      Landmark.TeamRocket,
      Landmark.WanderingNpc,
      // And the patch grows its own bush
      Landmark.BerryPatch,
    ]) {
      expect(hasLandmarkPicture(kind), LANDMARK_NAMES[kind]).toBe(false);
      expect(landmarkPicture(kind, Biome.Grassland), LANDMARK_NAMES[kind]).toBe(null);
    }
  });

  it('draws every other landmark as something', () => {
    for (const kind of LANDMARKS) {
      if (!hasLandmarkPicture(kind)) {
        continue;
      }
      expect(landmarkPicture(kind, Biome.Grassland), LANDMARK_NAMES[kind]).not.toBe(null);
    }
  });

  it('hangs a cold lair with ice and a wet one with moss', () => {
    expect(landmarkPicture(Landmark.LegendaryLair, Biome.Grassland)).toBe('lair');
    expect(landmarkPicture(Landmark.LegendaryLair, Biome.Glacier)).toBe('lair-ice');
    expect(landmarkPicture(Landmark.LegendaryLair, Biome.Swamp)).toBe('lair-moss');
    // Only the lair varies: a board is a board wherever it is posted
    expect(landmarkPicture(Landmark.AuctionBoard, Biome.Glacier)).toBe(
      landmarkPicture(Landmark.AuctionBoard, Biome.Swamp),
    );
  });

  it('finds a shadow lair choked or boarded, and always the same one', () => {
    const mouths = new Set(
      Array.from({ length: 32 }, (_, cell) =>
        landmarkPicture(Landmark.ShadowLair, Biome.Grassland, false, cell),
      ),
    );

    expect([...mouths].sort()).toEqual(['lair-rubble', 'lair-sealed']);
    // The same cell keeps the mouth it had: a lair that changed every
    // frame would be a lair nobody could recognise
    expect(landmarkPicture(Landmark.ShadowLair, Biome.Grassland, false, 7)).toBe(
      landmarkPicture(Landmark.ShadowLair, Biome.Grassland, false, 7),
    );
  });

  it('opens a cache this player has already dug up', () => {
    expect(landmarkPicture(Landmark.ItemCache, Biome.Grassland)).toBe('cache');
    expect(landmarkPicture(Landmark.ItemCache, Biome.Grassland, true)).toBe('cache-taken');
    // Nothing else has a second state, and asking for one gives the
    // picture it always had rather than nothing at all
    expect(landmarkPicture(Landmark.Nest, Biome.Grassland, true)).toBe('nest');
  });

  it('says where every landmark meets the ground', () => {
    for (const one of packed(LANDMARK_SHEET)) {
      expect(one.base, one.name).not.toBe(null);
      expect(one.base?.[1], one.name).toBeGreaterThan(one.trim[1]);
      expect(one.base?.[1], one.name).toBeLessThan(one.sourceHeight);
    }
  });
});

describe('the scenery that ships', () => {
  const BOTH = [DECORATION_SHEET, TREE_SHEET];

  it('has a picture for everything anything is drawn as', () => {
    const drawn = new Set(
      BOTH.flatMap((sheet) => packed(sheet).map((one) => `${sheet}/${one.name}`)),
    );
    const missing = decorationPictures()
      .map((one) => `${one.sheet}/${one.name}`)
      .filter((key) => !drawn.has(key));

    expect(missing, 'run `node scripts/decorations.ts <sheet>` for these').toEqual([]);
  });

  it('carries no picture nothing is drawn as', () => {
    const wanted = new Set(decorationPictures().map((one) => `${one.sheet}/${one.name}`));

    for (const sheet of BOTH) {
      expect(
        packed(sheet)
          .map((one) => `${sheet}/${one.name}`)
          .filter((key) => !wanted.has(key)),
        sheet,
      ).toEqual([]);
    }
  });

  it('draws every kind of scenery as something', () => {
    const kinds = Object.keys(DECORATION_NAMES).map(Number) as Decoration[];

    for (const kind of kinds) {
      const picture = decorationPicture(kind, Biome.Grassland);

      expect(picture.name, String(kind)).not.toBe('');
      expect(BOTH, String(kind)).toContain(picture.sheet);
    }
  });

  it('names every biome variant on a kind that biome actually grows', () => {
    const biomes = Object.keys(BIOME_NAMES).map(Number) as Biome[];

    for (const biome of biomes) {
      const grown = new Set(getBiomeDecorations(biome));

      for (const kind of biomeVariants(biome)) {
        expect(grown.has(kind), `${BIOME_NAMES[biome]} has no ${DECORATION_NAMES[kind]}`).toBe(
          true,
        );
      }
    }
  });

  it('puts the trees of a cold biome under snow, and nothing else', () => {
    // The taiga is the archetype: it is below the line, and the pine it
    // grows is the one thing on its cells that the cold shows on
    expect(isSnowy(Biome.Taiga)).toBe(true);
    // The snow is composed onto the biome's own tree, so a cold biome
    // keeps the pine it chose rather than trading it for a white one
    expect(decorationPicture(Decoration.Pine, Biome.Taiga)).toEqual({
      sheet: TREE_SHEET,
      name: 'pine-snow',
    });
    // A rock in the cold is a rock: a white one would be invisible
    // against the ground it stands on
    expect(decorationPicture(Decoration.Rock, Biome.Taiga)).toEqual(
      decorationPicture(Decoration.Rock, Biome.Savanna),
    );
    // The palm has no coat cut for it, so a cold beach keeps a bare one
    expect(decorationPicture(Decoration.Palm, Biome.Taiga).name).toBe('palm');
    // The mountain is cold, but its tiles are bare rock and its walls
    // carry no snow, so its pine stands bare too
    expect(isSnowy(Biome.Mountain)).toBe(false);
    expect(decorationPicture(Decoration.Pine, Biome.Mountain)).toEqual({
      sheet: TREE_SHEET,
      name: 'pine-dark',
    });
    // A warm biome keeps its own tree
    expect(isSnowy(Biome.TropicalRainforest)).toBe(false);
    expect(decorationPicture(Decoration.Tree, Biome.TropicalRainforest).name).toBe('jungle');
  });

  it('draws a grotto as whatever tree the biome grows', () => {
    // What makes a grotto hidden is that it is a tree: the same tree
    // every other cell of the chunk is drawn with, snow and all
    for (const biome of [Biome.Grassland, Biome.Savanna, Biome.Taiga, Biome.Beach]) {
      const trees = getBiomeDecorations(biome).filter((kind) =>
        [Decoration.Tree, Decoration.Pine, Decoration.Palm].includes(kind),
      );

      expect(grottoPicture(biome), BIOME_NAMES[biome]).toEqual(
        decorationPicture(trees[0] ?? Decoration.Tree, biome),
      );
    }
    // A taiga grows pines and nothing else, so a grotto there is a pine
    // under snow rather than the plain tree
    expect(isSnowy(Biome.Taiga)).toBe(true);
    expect(grottoPicture(Biome.Taiga).name).toBe('pine-snow');
  });

  it('gives a tree its biome and a rock the same picture everywhere', () => {
    // A forest and a savanna both put a tree on a cell and mean
    // different things by it
    expect(decorationPicture(Decoration.Tree, Biome.Savanna).name).not.toBe(
      decorationPicture(Decoration.Tree, Biome.TropicalRainforest).name,
    );
    // Scenery that is not a tree is the same wherever it stands
    expect(decorationPicture(Decoration.Rock, Biome.Volcano)).toEqual(
      decorationPicture(Decoration.Rock, Biome.Glacier),
    );
  });

  it('says where every piece of scenery meets the ground', () => {
    for (const sheet of BOTH) {
      for (const one of packed(sheet)) {
        const cell = one.sourceWidth;

        // Without it a caller can only guess the bottom middle, which
        // stands the shadow on the tile and the piece a row behind it
        expect(one.base, one.name).not.toBe(null);
        expect(one.base?.[0], one.name).toBeGreaterThanOrEqual(0);
        expect(one.base?.[0], one.name).toBeLessThan(cell);
        expect(one.base?.[1], one.name).toBeGreaterThanOrEqual(0);
        expect(one.base?.[1], one.name).toBeLessThan(cell);
        // The ground is under the picture, never above its middle
        expect(one.base?.[1], one.name).toBeGreaterThan(one.trim[1]);
        // Above the lowest row it is drawn on, which is the front of
        // the patch it stands on rather than the middle: the sheet has
        // already taken the board's tilt off it
        expect(one.base?.[1], one.name).toBeLessThan(one.trim[1] + one.height - 1);
      }
    }
  });

  it('says how much ground a tree covers, so a tree is sized by the tree', () => {
    const described = JSON.parse(
      readFileSync(`${SPRITE_ROOT}/overworld/${TREE_SHEET}/data.json`, 'utf8'),
    ) as unknown;
    const stands = Number(fieldOf(described, 'stands'));
    const cell = packed(TREE_SHEET)[0].sourceWidth;

    // A tree covers a good part of the square it was cut in, and never
    // the whole of it: the square holds the tallest crown on the sheet
    expect(stands).toBeGreaterThan(cell / 4);
    expect(stands).toBeLessThan(cell);
  });

  it('packs each sheet in one square cell, every picture on its floor', () => {
    for (const sheet of BOTH) {
      const all = packed(sheet);
      // One cell to a sheet, sized off that sheet's tallest piece. The
      // props are their own sheet for this reason: measured against the
      // tallest pine there is, a rock came out a speck
      const cell = all[0].sourceWidth;

      for (const one of all) {
        expect(one.sourceWidth, one.name).toBe(cell);
        expect(one.sourceHeight, one.name).toBe(cell);
        expect(one.width, one.name).toBeLessThanOrEqual(cell);
        expect(one.height, one.name).toBeLessThanOrEqual(cell);
        // Sitting on the floor, centred across it, so the point a
        // caller puts scenery on is the ground it stands on
        expect(one.trim[1], one.name).toBe(cell - one.height);
        expect(one.trim[0], one.name).toBe(Math.floor((cell - one.width) / 2));
      }
    }
  });
});
