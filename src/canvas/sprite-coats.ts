import type { Species } from '../data/ids/species';

/**
 * Which drawings of each pokemon exist.
 *
 * A sheet is asked for by path, and until now the answer to "is there a
 * female Pikachu" was a request that either arrived or 404ed. That is
 * an honest answer and an expensive one: every pokemon on a field with
 * no female drawing paid a failed request to find out, once per coat,
 * and the browser logs each of them.
 *
 * So the coats that exist are written down when the sheets are, and the
 * list is fetched once. What it is **not** is the authority on drawing:
 * a species the list has never heard of is still tried, so a sheet
 * dropped in by hand shows up without a rebuild.
 */

/** Where the list is served from. */
export const COATS_PATH = '/sprites/pokemon/coats.json';

/** The four drawings a species can have, named as the file is. */
export type Coat = 'regular' | 'shiny' | 'female' | 'shinyFemale';

export interface SpriteCoats {
  version: 1;
  /** Species id to the coats it was drawn in, in the order above. */
  coats: Record<string, Coat[]>;
  /**
   * Species id to a short digest of its sheets as they now stand.
   *
   * A sheet keeps its address for ever — `regular/1.png` is always
   * `regular/1.png` — so a browser holding yesterday's copy has no
   * reason to ask for it again. That is fine until the packer rewrites
   * one: an old drawing read against a new description is a frame
   * taken from wherever those coordinates now land, which is usually
   * nothing at all. Asking for the sheet **with its digest** makes a
   * repacked sheet a different address
   */
  stamps: Record<string, string>;
}

export function coatOf(shiny: boolean, female: boolean): Coat {
  if (female) {
    return shiny ? 'shinyFemale' : 'female';
  }
  return shiny ? 'shiny' : 'regular';
}

/** Reads whatever was fetched, keeping only what has the right shape. */
export function asSpriteCoats(value: unknown): SpriteCoats {
  const listed: Record<string, Coat[]> = {};
  const stamps: Record<string, string> = {};
  const root = typeof value === 'object' && value == null ? null : value;
  const held = typeof root === 'object' && root != null && 'coats' in root ? root.coats : null;
  const marks = typeof root === 'object' && root != null && 'stamps' in root ? root.stamps : null;

  if (typeof held === 'object' && held != null) {
    for (const [species, coats] of Object.entries(held)) {
      if (Array.isArray(coats)) {
        listed[species] = coats.filter((coat): coat is Coat => typeof coat === 'string');
      }
    }
  }
  if (typeof marks === 'object' && marks != null) {
    for (const [species, stamp] of Object.entries(marks)) {
      if (typeof stamp === 'string') {
        stamps[species] = stamp;
      }
    }
  }
  return { version: 1, coats: listed, stamps };
}

/**
 * A path with the sheet's digest on it, or the path as it stands where
 * nothing is known about the species — an unstamped address is the old
 * behaviour, which is right for a sheet dropped in by hand
 */
export function stamped(path: string, coats: SpriteCoats | null, species: number): string {
  const stamp = coats?.stamps[String(species)];

  return stamp == null ? path : `${path}?v=${stamp}`;
}

/**
 * Whether this drawing is worth asking for.
 *
 * Unknown means yes: the list says what was packed, and a species
 * missing from it is a species nothing has been recorded about rather
 * than one that has been ruled out
 */
export function drawn(coats: SpriteCoats | null, species: Species, coat: Coat): boolean {
  const known = coats?.coats[String(species)];

  return known == null || known.includes(coat);
}
