import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The sprites and what has been done to them.
 *
 * The pictures under `public/sprites` come from outside this repository
 * and go through two passes before they ship — `pnpm compact-sprites`
 * rewrites the PNG container, `pnpm sprite-loops` measures whether an
 * effect can be played round and round — and `sprite-pipeline.json`
 * records both. This is what stops that record drifting: a sheet
 * re-exported by the packing tool no longer matches its entry, and a
 * sheet dropped in and forgotten has no entry at all.
 *
 * Either way the fix is to run the two commands, which is why the
 * failures below say so.
 */

const SPRITE_ROOT = 'public/sprites';

const LEDGER_PATH = 'sprite-pipeline.json';

/** How much of the digest the record keeps, in hex characters */
const DIGEST_LENGTH = 16;

interface SheetRecord {
  digest: unknown;
  compact: unknown;
  loops: unknown;
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
      loops: fieldOf(entry, 'loops'),
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

/** The atlases whose seams the loop pass measures */
const EFFECT_ROOTS = ['directional', 'effects', 'particles'].map((kind) => join(SPRITE_ROOT, kind));

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
      `these have been re-exported since they were processed, run \`pnpm compact-sprites\` and \`pnpm sprite-loops\`: ${stale.join(', ')}`,
    ).toEqual([]);
  });

  it('remembers nothing that is no longer there', () => {
    const gone = [...LEDGER.keys()].filter((path) => !existsSync(path));

    expect(gone, `run \`pnpm compact-sprites\` to clear: ${gone.join(', ')}`).toEqual([]);
  });

  it('has measured the seam of every effect sheet', () => {
    const effects = SHEETS.filter((path) => EFFECT_ROOTS.some((root) => path.startsWith(root)));

    expect(effects.length).toBeGreaterThan(0);

    const unmeasured = effects.filter((path) => LEDGER.get(path)?.loops == null);

    expect(unmeasured, `run \`pnpm sprite-loops\` — unmeasured: ${unmeasured.join(', ')}`).toEqual(
      [],
    );
  });
});
