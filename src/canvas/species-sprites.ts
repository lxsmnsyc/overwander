import type { Species } from '../data/ids/species';
import SpeciesSpriteAnimation from './species-sprite-animation';

/**
 * Which sheet belongs to which pokemon, and how to get one.
 *
 * The sheets live under `public/sprites/pokemon/{species}` — the
 * folder is the species id, so nothing has to keep a table of names
 * beside the enum that already numbers them. Species 0, 1 and 2 are
 * Missingno, an egg and a substitute: things that appear on a field
 * without being anybody's pokemon, numbered alongside the rest so
 * they are asked for exactly the same way.
 *
 * Sheets are shared. A sheet is one download and one description; a
 * playhead is not, so a caller gets its own animation cloned off the
 * one loaded copy — six pokemon on a field are six playheads over one
 * image.
 */

export const SPRITE_ROOT = '/sprites/pokemon';

/**
 * What is drawn when a pokemon has no sheet of its own. Only a
 * handful are drawn so far, and the rest of the dex has to look like
 * *something* — Missingno is what the game has always shown when it
 * did not know what to show
 */
export const FALLBACK_SPECIES = 0 as Species;

export function spriteBasePath(species: Species, shiny = false): string {
  return shiny ? `${SPRITE_ROOT}/${species}/shiny` : `${SPRITE_ROOT}/${species}`;
}

/**
 * Every sheet asked for so far, by path. A failed load is remembered
 * as a failure: a pokemon with no sheet should cost one 404, not one
 * per frame
 */
const SHEETS = new Map<string, Promise<SpeciesSpriteAnimation | null>>();

async function loadSheet(path: string): Promise<SpeciesSpriteAnimation | null> {
  try {
    const sprite = await SpeciesSpriteAnimation.fetch(path);

    await sprite.load();
    return sprite;
  } catch {
    return null;
  }
}

async function sheet(path: string): Promise<SpeciesSpriteAnimation | null> {
  const known = SHEETS.get(path);

  if (known != null) {
    return known;
  }

  const loading = loadSheet(path);

  SHEETS.set(path, loading);
  return loading;
}

export interface SpriteRequest {
  shiny?: boolean;
  /**
   * Whether to fall back to Missingno when the species has no sheet.
   * On by default: a canvas asking for a pokemon wants something to
   * draw, and a caller that would rather draw nothing says so
   */
  fallback?: boolean;
}

/**
 * An animation for one pokemon, ready to play.
 *
 * It is a clone of the shared sheet, so playing, pausing and facing
 * it about affects this caller alone. Resolves null only when there
 * is no sheet and no fallback either
 */
export default async function loadSpeciesSprite(
  species: Species,
  request: SpriteRequest = {},
): Promise<SpeciesSpriteAnimation | null> {
  // A shiny with no shiny sheet is still that pokemon: the ordinary
  // sheet is a better answer than Missingno
  const paths =
    request.shiny === true
      ? [spriteBasePath(species, true), spriteBasePath(species)]
      : [spriteBasePath(species)];

  if (request.fallback !== false) {
    paths.push(spriteBasePath(FALLBACK_SPECIES));
  }

  for (const path of paths) {
    const loaded = await sheet(path);

    if (loaded != null) {
      return loaded.clone();
    }
  }
  return null;
}
