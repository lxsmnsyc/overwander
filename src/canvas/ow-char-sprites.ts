import OWCharSprite, { type OWCharLayout } from './ow-char-sprite';

/**
 * The character sheets, loaded once each.
 *
 * The same bargain [`species-sprites`](./species-sprites.ts) makes: one
 * download a sheet, and a **clone** for every caller, since two people
 * wearing the same charset stand on different cells facing different
 * ways. A sheet that will not load is remembered as a failure, so a
 * missing charset costs one 404 rather than one per cell it is asked
 * for.
 */

/** Where the sheets the processor writes are served from. */
export const OW_SPRITE_ROOT = '/sprites/overworld';

/** The folder one charset lives in, drawing and description together. */
export function owCharPath(name: string): string {
  return `${OW_SPRITE_ROOT}/${name}`;
}

const SHEETS = new Map<string, Promise<OWCharSprite | null>>();

async function fetchSheet(name: string, layout: OWCharLayout): Promise<OWCharSprite | null> {
  try {
    const sprite = await OWCharSprite.fetch(owCharPath(name), layout);

    await sprite.load();
    return sprite;
  } catch {
    return null;
  }
}

/**
 * One character, ready to walk. Answers null where there is no such
 * sheet — a caller with nothing to draw draws what it drew before
 * there were charsets at all.
 *
 * Only a sheet that landed is remembered: a miss is forgotten so the
 * next ask fetches again, since a sheet the processor is writing this
 * minute is missing now and there in a moment
 */
export default async function loadOWChar(
  name: string,
  layout: OWCharLayout = {},
): Promise<OWCharSprite | null> {
  const known = SHEETS.get(name);

  if (known != null) {
    const sheet = await known;

    if (sheet != null) {
      return sheet.clone();
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
  return sheet.clone();
}
