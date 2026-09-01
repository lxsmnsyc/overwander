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
 * taken from the caller: a species number, or a name cut down to
 * letters and digits, is all that reaches the file system.
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

/**
 * What a charset's folder may be called: letters, digits and the
 * hyphens between them, with slashes keeping subfolders — a charset
 * files under `characters/{version}/{name}`. Anything else a caller
 * typed is dropped rather than escaped, so a dotted segment cannot
 * climb out: `..` reduces to nothing and is refused
 */
export function overworldSlug(name: string): string {
  const parts = name
    .trim()
    .toLowerCase()
    .split('/')
    .map((part) =>
      part
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40),
    );

  if (parts.some((part) => part.length === 0)) {
    throw new Error('The sheet needs a name of letters or digits, one between each slash');
  }
  return parts.join('/');
}

/**
 * A character sheet: a folder of its own holding the grid and the
 * description beside it, which is the pair `OWCharSprite.fetch` asks
 * for
 */
export function overworldDestination(name: string): Destination {
  const slug = overworldSlug(name);

  return {
    image: `sprites/overworld/${slug}/image.png`,
    meta: `sprites/overworld/${slug}/data.json`,
  };
}

/**
 * A biome's tileset: the atlas and the description of how it is cut,
 * filed under the biome's own number so a chunk finds its ground
 * without a table of names in between
 */
export function biomeDestination(biome: number): Destination {
  const id = Math.trunc(biome);

  if (!Number.isFinite(id) || id < 0) {
    throw new Error('A tileset needs a biome to belong to');
  }
  return { image: `sprites/biome/${id}/image.png`, meta: `sprites/biome/${id}/data.json` };
}

/**
 * Anything else packed out of loose images, filed under a name of its
 * own: an extras sheet is not about a species, so nothing here asks
 * for one. The name takes slashes the way a charset's does, so a
 * sheet can be filed under `sprites/extras/ui/...`
 */
export function extraDestination(name: string): Destination {
  const slug = overworldSlug(name);

  return {
    image: `sprites/extras/${slug}.png`,
    meta: `sprites/extras/${slug}.json`,
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
