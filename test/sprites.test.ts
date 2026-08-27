import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ItemTypes, Items } from '../src/data/ids/items';
import registerItems, { getItemData, listItemsByType } from '../src/data/items';
import berryPlantSheet, { berryPlantName } from '../src/data/overworld/berry-plant';
import { BIOME_NAMES } from '../src/data/biome/names';
import Biome from '../src/data/ids/biome';
import Decoration, {
  DECORATION_NAMES,
  getBiomeDecorations,
} from '../src/data/overworld/decoration';
import decorationPicture, {
  DECORATION_SHEET,
  TREE_SHEET,
  biomeVariants,
  decorationPictures,
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

describe('the scenery that ships', () => {
  interface Packed {
    name: string;
    width: number;
    height: number;
    sourceWidth: number;
    sourceHeight: number;
    trim: [number, number];
  }

  function packed(sheet: string): Packed[] {
    const described = JSON.parse(
      readFileSync(`${SPRITE_ROOT}/overworld/${sheet}/data.json`, 'utf8'),
    ) as unknown;
    const images = fieldOf(described, 'images');
    const trimOf = (entry: unknown): [number, number] => {
      const pair = fieldOf(entry, 'trim');

      return Array.isArray(pair) ? [Number(pair[0]), Number(pair[1])] : [0, 0];
    };

    return (Array.isArray(images) ? images : []).map((entry: unknown) => ({
      name: String(fieldOf(entry, 'name')).replace(/\.png$/, ''),
      width: Number(fieldOf(entry, 'width')),
      height: Number(fieldOf(entry, 'height')),
      sourceWidth: Number(fieldOf(entry, 'sourceWidth')),
      sourceHeight: Number(fieldOf(entry, 'sourceHeight')),
      trim: trimOf(entry),
    }));
  }

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
    expect(decorationPicture(Decoration.Pine, Biome.Taiga).name).toBe('pine-snow');
    // A rock in the cold is a rock: a white one would be invisible
    // against the ground it stands on
    expect(decorationPicture(Decoration.Rock, Biome.Taiga)).toEqual(
      decorationPicture(Decoration.Rock, Biome.Savanna),
    );
    // The mountain is cold too, and its darker pine goes under the same
    // snow rather than needing one of its own
    expect(decorationPicture(Decoration.Pine, Biome.Mountain).name).toBe('pine-snow');
    // A warm biome keeps its own tree
    expect(isSnowy(Biome.TropicalRainforest)).toBe(false);
    expect(decorationPicture(Decoration.Tree, Biome.TropicalRainforest).name).toBe('jungle');
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

  it('packs every picture of both sheets in one square cell, on its floor', () => {
    const all = BOTH.flatMap((sheet) => packed(sheet));
    const cell = all[0].sourceWidth;

    for (const one of all) {
      // One cell across both sheets: a rock beside a pine keeps the
      // proportions the rip drew them in, whichever sheet it came from
      expect(one.sourceWidth, one.name).toBe(cell);
      expect(one.sourceHeight, one.name).toBe(cell);
      // Sitting on the floor, centred across it, so the point a caller
      // puts scenery on is the ground it stands on
      expect(one.trim[1], one.name).toBe(cell - one.height);
      expect(one.trim[0], one.name).toBe(Math.floor((cell - one.width) / 2));
      expect(one.width, one.name).toBeLessThanOrEqual(cell);
      expect(one.height, one.name).toBeLessThanOrEqual(cell);
    }
  });
});
