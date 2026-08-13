import { Species } from '../data/ids/species';
import SpeciesSpriteAnimation from './species-sprite-animation';

/**
 * Which sheet belongs to which pokemon, and how to get one.
 *
 * The sheets live under `public/sprites/pokemon/{coat}/{species}`,
 * where the coat is `regular` or `shiny` and the folder under it is
 * the species id — so nothing has to keep a table of names beside the
 * enum that already numbers them. Species 0, 1 and 2 are Missingno, an
 * egg and a substitute: things that appear on a field without being
 * anybody's pokemon, numbered alongside the rest so they are asked for
 * exactly the same way — the placeholders included, which is why they
 * are numbered a long way past the dex rather than in front of it: a
 * species id **is** its dex number now, and Missingno, an egg and a
 * substitute are not pokemon and have no dex number to take.
 *
 * The two coats are **siblings** rather than one nested inside the
 * other. A shiny sheet used to live in a `shiny` folder inside the
 * ordinary one, which reads as the shiny belonging to the regular
 * sprite; they are two drawings of the same pokemon, and a directory
 * of every shiny is a thing worth being able to look at on its own.
 *
 * Sheets are shared. A sheet is one download and one description; a
 * playhead is not, so a caller gets its own animation cloned off the
 * one loaded copy — six pokemon on a field are six playheads over one
 * image.
 */

export const SPRITE_ROOT = '/sprites/pokemon';

/**
 * How much of a frame's height is empty ground under the pokemon's
 * feet.
 *
 * A sheet is cut as one box per frame with the pokemon standing in
 * the middle of it, so a frame drawn with its bottom edge on a line
 * puts the pokemon well above that line — floating over its own
 * health bar on the field, and leaving a gap between it and its name
 * in a dialog. Every caller that stands a sprite on something takes
 * this off the bottom, which is the same fix in both places because
 * it is the same band of nothing.
 *
 * It is a fraction rather than a number of pixels: the frames are cut
 * at different sizes and drawn at whatever scale the caller wants
 */
export const FLOOR_SLACK = 0.16;

/**
 * How far past a line a sprite has to be drawn for its feet to land
 * on it, at the scale it is being drawn at
 */
export function floorSlack(sprite: SpeciesSpriteAnimation, scale: number): number {
  return sprite.frameSize.height * scale * FLOOR_SLACK;
}

/**
 * What is drawn when a pokemon has no sheet of its own. Only a
 * handful are drawn so far, and the rest of the dex has to look like
 * *something* — Missingno is what the game has always shown when it
 * did not know what to show
 */
export const FALLBACK_SPECIES = Species.Missingno;

export function spriteBasePath(species: Species, shiny = false): string {
  return `${SPRITE_ROOT}/${shiny ? 'shiny' : 'regular'}/${species}`;
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
