import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Coat, SpriteCoats } from '../../canvas/sprite-coats';

/**
 * The list of which pokemon were drawn in which coat, built by looking.
 *
 * It is derived rather than maintained: the directories are the truth,
 * and a list kept by hand is a list that disagrees with them the first
 * time somebody drops a file in. Rebuilt whole after every write, since
 * scanning two directories costs nothing next to packing a sheet.
 *
 * Unmarked by `server-only`, like the PNG codec beside it, so the
 * script that rebuilds the list outside the app can run it: what keeps
 * it off a browser is the `node:fs` it opens with.
 */

/** Where the sheets are, under `public/`. */
const ROOT = 'sprites/pokemon';

/** Which directory carries which pair of coats. */
const SIDES: { directory: string; plain: Coat; female: Coat }[] = [
  { directory: 'regular', plain: 'regular', female: 'female' },
  { directory: 'shiny', plain: 'shiny', female: 'shinyFemale' },
];

/** The order coats are written in, so the file diffs cleanly. */
const ORDER: Coat[] = ['regular', 'shiny', 'female', 'shinyFemale'];

const SHEET = /^(\d+)(_f)?\.png$/;

async function listing(directory: string): Promise<string[]> {
  return readdir(join(process.cwd(), 'public', ROOT, directory)).catch(() => []);
}

/** What is on disk right now. */
export async function readCoats(): Promise<SpriteCoats> {
  const found = new Map<number, Set<Coat>>();

  for (const side of SIDES) {
    for (const file of await listing(side.directory)) {
      const named = SHEET.exec(file);

      if (named == null) {
        continue;
      }
      const species = Number.parseInt(named[1], 10);
      const held = found.get(species) ?? new Set<Coat>();

      // The name ends in `_f` only for the female drawing
      held.add(file.endsWith('_f.png') ? side.female : side.plain);
      found.set(species, held);
    }
  }

  const coats: Record<string, Coat[]> = {};

  // By number rather than by string, so 9 comes before 10 and the file
  // reads like the dex
  for (const species of [...found.keys()].sort((one, two) => one - two)) {
    coats[String(species)] = ORDER.filter((coat) => found.get(species)?.has(coat) === true);
  }
  return { version: 1, coats };
}

/**
 * The list as a file: one pokemon a line.
 *
 * Written out rather than handed to `JSON.stringify`, which puts every
 * coat on a line of its own and turns a hundred and fifty pokemon into
 * two thousand lines nobody can read a diff of
 */
function formatCoats(listed: SpriteCoats): string {
  const lines = Object.entries(listed.coats).map(
    ([species, coats]) => `    "${species}": ${JSON.stringify(coats)}`,
  );

  return `{\n  "version": 1,\n  "coats": {\n${lines.join(',\n')}\n  }\n}\n`;
}

/**
 * Writes the list beside the sheets it describes. Resolves the path
 * written, which the processor reports with everything else
 */
export default async function writeCoats(): Promise<string> {
  const path = `${ROOT}/coats.json`;

  await writeFile(join(process.cwd(), 'public', path), formatCoats(await readCoats()));
  return path;
}
