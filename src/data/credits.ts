/**
 * Who and what this game is built out of, as data rather than prose.
 *
 * [docs/credits.md](../../docs/credits.md) is still where the terms
 * are explained and where the reasoning lives. What it no longer
 * holds is the lists: those are here, so the credits screen can show
 * the same names the page does rather than a shorter set kept beside
 * it and left to drift.
 *
 * Two of the four sections are **derived** and must not be edited by
 * hand. `sprites` is scanned out of every `sheet.json` by
 * `pnpm import-sprites`, and `overworld` is upserted a row at a time
 * by the sprite processor as it packs a charset.
 */

/** Where the list is served from. */
export const CREDITS_PATH = '/credits.json';

/** A body of somebody else's work, whole, and what its terms are. */
export interface CreditSource {
  what: string;
  who: string;
  href: string;
  terms: string;
}

/** Whether a package ships in the app or only builds it. */
export type PackageKind = 'runtime' | 'build';

export interface CreditPackage {
  name: string;
  href?: string;
  what: string;
  licence: string;
  kind: PackageKind;
}

/**
 * One drawing and who drew it: a species for a pokemon sheet, a
 * charset's path for an overworld one.
 *
 * Flat pairs rather than a list per artist, because that is the shape
 * both writers want: one names the work it has just packed, the other
 * scans the sheets and finds whoever is on them. Grouping them by
 * artist is the reader's job, and `groupCredits` does it
 */
export interface CreditWork {
  work: string;
  credit: string;
}

export interface Credits {
  version: 1;
  sources: CreditSource[];
  packages: CreditPackage[];
  /** Pokemon sheets, scanned from each `sheet.json`. */
  sprites: CreditWork[];
  /** Overworld charsets, written as each is packed. */
  overworld: CreditWork[];
  /**
   * The landmark, decoration and tree tiles: names alone.
   *
   * Nobody wrote down which of them drew which tile, and inventing
   * the mapping would be worse than not having it. So this half is a
   * list of people rather than a list of works
   */
  scenery: string[];
}

/** An artist and everything of theirs that ships, in name order. */
export interface CreditedArtist {
  name: string;
  works: string[];
}

/**
 * The pairs gathered by artist, most work first and alphabetical
 * within a tie. A name that appears on both a pokemon's regular coat
 * and its shiny is one name against one work
 */
export function groupCredits(works: CreditWork[]): CreditedArtist[] {
  const held = new Map<string, Set<string>>();

  for (const { work, credit } of works) {
    const found = held.get(credit);

    if (found) {
      found.add(work);
    } else {
      held.set(credit, new Set([work]));
    }
  }

  return [...held]
    .map(([name, listed]) => ({ name, works: [...listed].sort((a, b) => a.localeCompare(b)) }))
    .sort((one, other) =>
      one.works.length === other.works.length
        ? one.name.localeCompare(other.name)
        : other.works.length - one.works.length,
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function asWorks(value: unknown): CreditWork[] {
  return (Array.isArray(value) ? value : []).filter(isRecord).map((row) => ({
    work: String(row.work),
    credit: String(row.credit),
  }));
}

/** Reads whatever was fetched, keeping only what has the right shape. */
export function asCredits(value: unknown): Credits {
  const root = isRecord(value) ? value : {};

  return {
    version: 1,
    sources: (Array.isArray(root.sources) ? root.sources : []).filter(isRecord).map((row) => ({
      what: String(row.what),
      who: String(row.who),
      href: String(row.href),
      terms: String(row.terms),
    })),
    packages: (Array.isArray(root.packages) ? root.packages : []).filter(isRecord).map((row) => ({
      name: String(row.name),
      href: typeof row.href === 'string' ? row.href : undefined,
      what: String(row.what),
      licence: String(row.licence),
      kind: row.kind === 'build' ? 'build' : 'runtime',
    })),
    sprites: asWorks(root.sprites),
    overworld: asWorks(root.overworld),
    scenery: (Array.isArray(root.scenery) ? root.scenery : []).map(String),
  };
}
