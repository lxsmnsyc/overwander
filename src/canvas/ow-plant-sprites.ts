import OWPlantSprite, { type OWPlantLayout } from './ow-plant-sprite';
import { OW_SPRITE_ROOT } from './ow-char-sprites';

/**
 * The plant sheets, loaded once each and **shared** rather than
 * cloned.
 *
 * A charset carries a playhead, so every walker wearing one needs a
 * copy of it. A plant carries none: its frame is a function of the
 * clock the caller draws with, so a dozen bushes on a board are one
 * sprite drawn a dozen times. A sheet that will not load is forgotten
 * rather than remembered as a failure, since a plant the script is
 * writing this minute is missing now and there in a moment.
 */

/** The folder one plant lives in, drawing and description together. */
export function owPlantPath(name: string): string {
  return `${OW_SPRITE_ROOT}/${name}`;
}

const SHEETS = new Map<string, Promise<OWPlantSprite | null>>();

async function fetchSheet(name: string, layout: OWPlantLayout): Promise<OWPlantSprite | null> {
  try {
    const sprite = await OWPlantSprite.fetch(owPlantPath(name), layout);

    await sprite.load();
    return sprite;
  } catch {
    return null;
  }
}

/**
 * One plant, ready to draw. Answers null where there is no such sheet,
 * and a caller with nothing to draw draws what it drew before there
 * were plants at all
 */
export default async function loadOWPlant(
  name: string,
  layout: OWPlantLayout = {},
): Promise<OWPlantSprite | null> {
  const known = SHEETS.get(name);

  if (known != null) {
    const sheet = await known;

    if (sheet != null) {
      return sheet;
    }
  }

  const loading = fetchSheet(name, layout);

  SHEETS.set(name, loading);

  const sheet = await loading;

  if (sheet == null) {
    // Only this ask's own entry: a newer retry may already be waiting
    if (SHEETS.get(name) === loading) {
      SHEETS.delete(name);
    }
    return null;
  }
  return sheet;
}
