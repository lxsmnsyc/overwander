import 'server-only';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Where a processed sheet is put.
 *
 * The packer tool handed its results to a download and somebody
 * dropped them into `public/` by hand. Here the server writes them,
 * which is only ever right on a machine where `public/` is the working
 * tree: a deployed build serves those files from a bundle, so writing
 * one would change nothing and a deployed server that can write into
 * its own asset root is a hole. Every path is built here rather than
 * taken from the caller, and nothing but a species number reaches the
 * file system.
 */

/** Only ever true on a developer's own machine. */
export function canWrite(): boolean {
  return import.meta.env.DEV;
}

export interface Destination {
  /** Where the drawing goes, relative to `public/`. */
  image: string;
  /** Where the description goes, or nothing where there is none. */
  meta?: string;
}

/** What a sheet is called: its species, and which drawing of it. */
export interface SheetName {
  species: number;
  female: boolean;
  shiny: boolean;
}

function stem(name: SheetName): string {
  return `${Math.trunc(name.species)}${name.female ? '_f' : ''}`;
}

/**
 * A pokemon: the drawing under its coat, the description shared by
 * both coats. This is the layout `species-sprites.ts` reads
 */
export function pokemonDestination(name: SheetName): Destination {
  return {
    image: `sprites/pokemon/${name.shiny ? 'shiny' : 'regular'}/${stem(name)}.png`,
    meta: `sprites/pokemon/meta/${Math.trunc(name.species)}.json`,
  };
}

/** Anything else packed out of loose images. */
export function extraDestination(name: SheetName): Destination {
  return {
    image: `sprites/extras/${stem(name)}.png`,
    meta: `sprites/extras/${stem(name)}.json`,
  };
}

/**
 * Writes one file under `public/`, making the directory if it is the
 * first sheet to land there. Resolves what was there before it, since
 * a sheet is usually being processed again rather than for the first
 * time and whether it grew is the thing worth knowing
 */
async function put(path: string, body: Buffer | string): Promise<Written> {
  const full = join(process.cwd(), 'public', path);
  const before = await stat(full).then(
    (found) => found.size,
    // Nothing there is not an error: it is the first time
    () => null,
  );

  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, body);
  return { path, before };
}

/** One file put down, and the size of whatever it stood on. */
export interface Written {
  path: string;
  /** What the file it replaced weighed, or nothing where there was none. */
  before: number | null;
}

/**
 * A drawing as it ended up: where it went, what it was stored as, what
 * that cost, and the two numbers worth comparing it against — the same
 * sheet written plainly, and whatever it replaced
 */
export interface Drawing extends Written {
  as: string;
  bytes: number;
  plain: number;
}

/**
 * Puts a finished sheet where it belongs. Resolves what was written,
 * which is what the page reports back
 */
export async function writeSheet(
  destination: Destination,
  image: Buffer,
  meta: string | null,
): Promise<Written[]> {
  if (!canWrite()) {
    throw new Error('Sprites can only be processed on a development build');
  }
  const written = [await put(destination.image, image)];

  if (meta != null && destination.meta != null) {
    written.push(await put(destination.meta, meta));
  }
  return written;
}
