import { spriteUrl } from './sprite-origin';
/**
 * The digest each sheet is asked for with.
 *
 * A sheet path is the same address for the life of the game, so the
 * browser has to check with the server on every visit to learn whether
 * the drawing changed, and each check is a request. The stamps make the
 * address change instead: a sheet is fetched at `?v=<stamp>`, so it can
 * be kept for a year and a repacked one is a different URL.
 *
 * `scripts/sprite-stamps.ts` writes the list at build time, keyed by
 * the folder a sheet lives in. The pokemon sheets are stamped by
 * `coats.json` instead, per species, which is older and stays as it is.
 *
 * A failure resolves to nothing rather than throwing: the list is an
 * optimisation, so a game that cannot read it asks for the bare paths
 * and gets whatever the server says about them.
 */

/**
 * Where the list is served from. The query is a new address for
 * browsers still holding a copy from when the list was cached for a year
 */
const STAMPS_PATH = spriteUrl('/sprites/stamps.json?fresh=1');

/** What every sheet path starts with, and what a stamp key does not */
const SPRITE_ROOT = spriteUrl('/sprites/');

let listed: Promise<Map<string, string> | null> | undefined;

function asStamps(value: unknown): Map<string, string> | null {
  if (typeof value !== 'object' || value == null) {
    return null;
  }
  const held: unknown = (value as { stamps?: unknown }).stamps;

  if (typeof held !== 'object' || held == null) {
    return null;
  }
  const read = new Map<string, string>();

  for (const [sheet, stamp] of Object.entries(held)) {
    if (typeof stamp === 'string') {
      read.set(sheet, stamp);
    }
  }
  return read;
}

/** The whole list, fetched once for the session */
async function stamps(): Promise<Map<string, string> | null> {
  listed ??= fetch(STAMPS_PATH)
    .then(async (response) => (response.ok ? asStamps(await response.json()) : null))
    .catch(() => null);
  return listed;
}

/**
 * The stamp for one sheet, by the path its files sit under. Null where
 * the sheet is not in the list, which is what a sheet added since the
 * build looks like
 */
export default async function sheetStamp(basePath: string): Promise<string | null> {
  const held = await stamps();
  const key = basePath.startsWith(SPRITE_ROOT) ? basePath.slice(SPRITE_ROOT.length) : basePath;

  return held?.get(key) ?? null;
}

/** One file of a stamped sheet, as it is asked for */
export function stampedFile(url: string, stamp: string | null): string {
  return stamp == null ? url : `${url}?v=${stamp}`;
}
