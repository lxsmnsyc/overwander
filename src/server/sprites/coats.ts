import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Coat, SpriteCoats } from '../../canvas/sprite-coats';

/**
 * The list of which pokemon were drawn in which coat, built by looking.
 *
 * It is derived rather than maintained: the directories are the truth,
 * and a list kept by hand is a list that disagrees with them the first
 * time somebody drops a file in. Rebuilt whole after every write, since
 * scanning the folders costs nothing next to packing a sheet.
 *
 * Unmarked by `server-only`, like the PNG codec beside it, so the
 * script that rebuilds the list outside the app can run it: what keeps
 * it off a browser is the `node:fs` it opens with.
 *
 * One list covers every region. Which region a pokemon is filed under
 * is a fact about its dex number rather than about the files, so the
 * game works it out for itself and the list stays a list of coats.
 */

/** Where the sheets are, under `public/`. */
const ROOT = 'sprites/pokemon';

/** The order coats are written in, so the file diffs cleanly. */
const ORDER: Coat[] = ['regular', 'shiny', 'female', 'shinyFemale'];

/** What each coat's drawing is called inside a pokemon's folder. */
const COAT_FILES: Record<Coat, string> = {
  regular: 'regular.png',
  shiny: 'shiny.png',
  female: 'female.png',
  shinyFemale: 'shiny_female.png',
};

/** A pokemon's folder is its species id and nothing else. */
const FOLDER = /^\d+$/;

async function listing(...parts: string[]): Promise<string[]> {
  return readdir(join(process.cwd(), 'public', ROOT, ...parts)).catch(() => []);
}

/**
 * The regions with sheets under them, whatever they are called. Read
 * off the directories rather than off a list, for the same reason the
 * coats are
 */
async function regions(): Promise<string[]> {
  const held = await readdir(join(process.cwd(), 'public', ROOT), {
    withFileTypes: true,
  }).catch(() => []);

  return held.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

/** What is on disk right now. */
export async function readCoats(): Promise<SpriteCoats> {
  const found = new Map<number, { region: string; coats: Coat[] }>();

  for (const region of await regions()) {
    for (const folder of await listing(region)) {
      if (!FOLDER.test(folder)) {
        continue;
      }
      const held = new Set(await listing(region, folder));
      const coats = ORDER.filter((coat) => held.has(COAT_FILES[coat]));

      if (coats.length > 0) {
        found.set(Number.parseInt(folder, 10), { region, coats });
      }
    }
  }

  const coats: Record<string, Coat[]> = {};
  const stamps: Record<string, string> = {};

  // By number rather than by string, so 9 comes before 10 and the file
  // reads like the dex
  for (const species of [...found.keys()].sort((one, two) => one - two)) {
    const held = found.get(species);

    if (held == null) {
      continue;
    }
    coats[String(species)] = held.coats;
    stamps[String(species)] = await stampOf(held.region, species, held.coats);
  }
  return { version: 1, coats, stamps };
}

/**
 * How much of the digest is kept: eight hex characters, which is four
 * bytes of SHA-256. Far past any accident among a few hundred sheets,
 * and short enough that the address still reads
 */
const STAMP_LENGTH = 8;

/**
 * A digest of everything a pokemon is drawn from: its description and
 * every coat. Either changing is a reason to fetch both again, which is
 * the whole point — a new drawing read against an old description draws
 * from wherever those coordinates now land
 */
async function stampOf(region: string, species: number, coats: Coat[]): Promise<string> {
  const hash = createHash('sha256');
  const folder = `${ROOT}/${region}/${species}`;
  const files = [
    `${folder}/sheet.json`,
    `${folder}/frames.bin`,
    ...coats.map((coat) => `${folder}/${COAT_FILES[coat]}`),
  ];

  for (const file of files) {
    const held = await readFile(join(process.cwd(), 'public', file)).catch(() => null);

    if (held != null) {
      hash.update(held);
    }
  }
  return hash.digest('hex').slice(0, STAMP_LENGTH);
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
  const marks = Object.entries(listed.stamps).map(
    ([species, stamp]) => `    "${species}": "${stamp}"`,
  );

  return (
    `{\n  "version": 1,\n  "coats": {\n${lines.join(',\n')}\n  },\n` +
    `  "stamps": {\n${marks.join(',\n')}\n  }\n}\n`
  );
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
