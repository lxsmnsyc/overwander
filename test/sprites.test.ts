import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ItemTypes, Items } from '../src/data/ids/items';
import registerItems, { getItemData, listItemsByType } from '../src/data/items';
import berryPlantSheet, { berryPlantName } from '../src/data/overworld/berry-plant';

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
