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
  const held = typeof value === 'object' && value != null && 'coats' in value ? value.coats : null;

  if (typeof held === 'object' && held != null) {
    for (const [species, coats] of Object.entries(held)) {
      if (Array.isArray(coats)) {
        listed[species] = coats.filter((coat): coat is Coat => typeof coat === 'string');
      }
    }
  }
  return { version: 1, coats: listed };
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
