import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CreditWork, Credits } from '../../data/credits';

/**
 * The credits list as a file, read and written by the two things that
 * know something nobody typed in.
 *
 * `sprites` is scanned out of the sheets; `overworld` is upserted as
 * each charset is packed. Everything else in the file was written by
 * hand and is carried through untouched, so a rebuild never eats the
 * licences.
 *
 * Unmarked by `server-only`, like the coats list beside it, so the
 * scripts that run outside the app can use it: what keeps it off a
 * browser is the `node:fs` it opens with. Nothing here imports a
 * value out of `src/`, for the same reason: node runs these scripts
 * with its own type stripping, which resolves no extensions.
 */

/** Where the list lives, under `public/`. */
const CREDITS_FILE = 'public/credits.json';

/** Where the pokemon sheets are, under `public/`. */
const SPRITE_ROOT = 'public/sprites/pokemon';

function pathOf(...parts: string[]): string {
  return join(process.cwd(), ...parts);
}

/**
 * The list as it stands, read straight rather than normalised: this
 * file is the repository's own and is rewritten from here, so what a
 * browser needs `asCredits` for does not arise. A file that is not
 * there yet reads as an empty one
 */
export async function readCredits(): Promise<Credits> {
  const held = await readFile(pathOf(CREDITS_FILE), 'utf8').catch(() => '');
  const blank: Credits = {
    version: 1,
    sources: [],
    packages: [],
    sprites: [],
    overworld: [],
    scenery: [],
  };

  if (held === '') {
    return blank;
  }

  const parsed: unknown = JSON.parse(held);
  const listed = (parsed ?? {}) as Partial<Credits>;

  return {
    version: 1,
    sources: listed.sources ?? [],
    packages: listed.packages ?? [],
    sprites: listed.sprites ?? [],
    overworld: listed.overworld ?? [],
    scenery: listed.scenery ?? [],
  };
}

/**
 * Written out rather than handed to `JSON.stringify` whole: a work
 * and its artist belong on one line, and four hundred of them across
 * three lines each is a diff nobody can read
 */
function format(credits: Credits): string {
  const rows = (works: CreditWork[]): string =>
    works.map((row) => `    ${JSON.stringify(row)}`).join(',\n');

  return [
    '{',
    '  "version": 1,',
    `  "sources": ${JSON.stringify(credits.sources, null, 2).replaceAll('\n', '\n  ')},`,
    `  "packages": ${JSON.stringify(credits.packages, null, 2).replaceAll('\n', '\n  ')},`,
    '  "sprites": [',
    rows(credits.sprites),
    '  ],',
    '  "overworld": [',
    rows(credits.overworld),
    '  ],',
    `  "scenery": ${JSON.stringify(credits.scenery, null, 2).replaceAll('\n', '\n  ')}`,
    '}',
    '',
  ].join('\n');
}

export async function writeCredits(credits: Credits): Promise<string> {
  await writeFile(pathOf(CREDITS_FILE), format(credits));
  return CREDITS_FILE;
}

/** The pairs in a stable order, so two rebuilds diff to nothing. */
function sorted(works: CreditWork[]): CreditWork[] {
  return [...works].sort(
    (one, other) => one.work.localeCompare(other.work) || one.credit.localeCompare(other.credit),
  );
}

/**
 * Whoever is named on a sheet, once per artist however many coats
 * they drew. A sheet with no `credits` block contributes nothing
 * rather than an empty name
 */
function creditsOf(sheet: unknown, work: string): CreditWork[] {
  const root = typeof sheet === 'object' && sheet != null ? sheet : {};
  const held = 'credits' in root ? root.credits : null;
  const names = new Set<string>();

  if (typeof held === 'object' && held != null) {
    for (const rows of Object.values(held) as unknown[]) {
      for (const row of (Array.isArray(rows) ? rows : []) as unknown[]) {
        const name: unknown =
          typeof row === 'object' && row != null && 'name' in row ? row.name : null;

        if (typeof name === 'string' && name.length > 0) {
          names.add(name);
        }
      }
    }
  }
  return [...names].map((credit) => ({ work, credit }));
}

/**
 * Every artist named on a pokemon sheet, scanned off disk.
 *
 * The name of the pokemon is taken from the sheet rather than from
 * the registry, since this runs in a script that cannot import a
 * `const enum`, and the sheet carries the name it was packed under
 */
export async function readSpriteCredits(): Promise<CreditWork[]> {
  const regions = await readdir(pathOf(SPRITE_ROOT), { withFileTypes: true }).catch(() => []);
  const found: CreditWork[] = [];

  for (const region of regions.filter((entry) => entry.isDirectory())) {
    for (const folder of await readdir(pathOf(SPRITE_ROOT, region.name)).catch(() => [])) {
      const file = pathOf(SPRITE_ROOT, region.name, folder, 'sheet.json');
      const held = await readFile(file, 'utf8').catch(() => '');

      if (held === '') {
        continue;
      }

      const sheet: unknown = JSON.parse(held);
      const named: unknown =
        typeof sheet === 'object' && sheet != null && 'name' in sheet ? sheet.name : null;

      found.push(...creditsOf(sheet, typeof named === 'string' ? named : folder));
    }
  }
  return sorted(found);
}

/**
 * Rebuilds the sprite half of the list from what is on disk, leaving
 * every hand-written section as it was. Resolves the path written
 */
export default async function writeSpriteCredits(): Promise<string> {
  const credits = await readCredits();

  return writeCredits({ ...credits, sprites: await readSpriteCredits() });
}

/**
 * The list with one charset's row upserted, kept sorted so re-packing
 * a sheet updates its row rather than adding a second.
 *
 * Pure, so a test can hand it a list and read the rows back: keeping
 * them straight is the half worth checking, not the file round trip
 */
export function withCredit(credits: Credits, sheet: string, credit: string): Credits {
  const kept = credits.overworld.filter((row) => row.work !== sheet);

  return { ...credits, overworld: sorted([...kept, { work: sheet, credit }]) };
}
