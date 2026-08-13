import BasicSprite from './basic-sprite';

/**
 * The still sheets, loaded once each.
 *
 * A [`BasicSprite`](./basic-sprite.ts) has no state of its own, which
 * is what makes one shared copy enough for every caller: thirty rows
 * of a bag drawing thirty different berries is one image and one
 * description. This is the cache that makes that true — asking for a
 * sheet twice waits on the first request rather than starting a
 * second, and a sheet that will not load is remembered as a failure so
 * a missing one costs one 404 rather than one per caller.
 */

/**
 * Where the sheets the interface draws from live
 */
export const UI_SPRITE_ROOT = '/sprites/ui';

const SHEETS = new Map<string, Promise<BasicSprite | null>>();

async function fetchSheet(basePath: string): Promise<BasicSprite | null> {
  try {
    const sprite = await BasicSprite.fetch(basePath);

    await sprite.load();
    return sprite;
  } catch {
    return null;
  }
}

/**
 * One sheet, by the path it lives at. Answers null when it will not
 * load — a caller with nothing to draw draws nothing, and whatever it
 * was illustrating is written beside it in words
 */
export default async function loadBasicSprite(basePath: string): Promise<BasicSprite | null> {
  const known = SHEETS.get(basePath);

  if (known != null) {
    return known;
  }

  const loading = fetchSheet(basePath);

  SHEETS.set(basePath, loading);
  return loading;
}
