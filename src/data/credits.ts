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
 * charset's path for an overworld one. It is what the scanners find,
 * on the way to the list they write
 */
export interface CreditWork {
  work: string;
  credit: string;
}

/**
 * Everything one artist drew, keyed by the name they are shown under.
 *
 * A list per artist rather than a flat pair per drawing, so a name is
 * written once however much of the game it signed
 */
export type CreditWorks = Record<string, string[]>;

/**
 * Two spellings the fold below cannot see as one. A placeholder is a
 * placeholder however it is abbreviated, and nobody is being credited
 * by either
 */
const CREDIT_ALIASES: Record<string, string> = { anon: 'Anonymous' };

/**
 * The name a credit is shown under.
 *
 * A trailing bracket is the artist noting which drawing it was rather
 * than a different artist, so it comes off: Kazan(Red) and
 * Kazan(TrainerRed) are Kazan
 */
export function creditName(credit: string): string {
  const named = credit
    .trim()
    .replace(/\s*\([^()]*\)$/, '')
    .trim();

  return CREDIT_ALIASES[named.toLowerCase()] ?? named;
}

/**
 * The pairs as a list per artist, in name order.
 *
 * Names differing only in case are one person, shown under whichever
 * spelling signed the most, and alphabetically where they signed the
 * same amount: figyberries drew four sheets as Figyberries and three
 * as figyberries, and is one artist with seven
 */
export function foldCredits(works: Iterable<CreditWork>): CreditWorks {
  const held = new Map<string, { spellings: Map<string, number>; drawn: Set<string> }>();

  for (const { work, credit } of works) {
    const name = creditName(credit);
    const key = name.toLowerCase();
    const found = held.get(key) ?? {
      spellings: new Map<string, number>(),
      drawn: new Set<string>(),
    };

    found.spellings.set(name, (found.spellings.get(name) ?? 0) + 1);
    found.drawn.add(work);
    held.set(key, found);
  }

  const listed = [...held.values()].map((found) => {
    const [name] = [...found.spellings].sort(
      (one, other) => other[1] - one[1] || one[0].localeCompare(other[0]),
    )[0];

    return { name, drawn: [...found.drawn].sort((one, other) => one.localeCompare(other)) };
  });

  listed.sort((one, other) => one.name.localeCompare(other.name));
  return Object.fromEntries(listed.map((artist) => [artist.name, artist.drawn]));
}

export interface Credits {
  version: 1;
  sources: CreditSource[];
  packages: CreditPackage[];
  /** Pokemon sheets, scanned from each `sheet.json`. */
  sprites: CreditWorks;
  /** Overworld charsets, written as each is packed. */
  overworld: CreditWorks;
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
 * The list in reading order: most work first, alphabetical within a
 * tie. The list itself is already one entry per artist, so this only
 * decides who is read first
 */
export function groupCredits(works: CreditWorks): CreditedArtist[] {
  return Object.entries(works)
    .map(([name, drawn]) => ({ name, works: drawn }))
    .sort((one, other) =>
      one.works.length === other.works.length
        ? one.name.localeCompare(other.name)
        : other.works.length - one.works.length,
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

/**
 * A section of the list, folded on the way in. A file written before
 * the list was kept per artist is read as the pairs it holds, so a
 * browser with the old one cached still shows a credits screen
 */
export function asCreditWorks(value: unknown): CreditWorks {
  if (Array.isArray(value)) {
    return foldCredits(
      value.filter(isRecord).map((row) => ({ work: String(row.work), credit: String(row.credit) })),
    );
  }
  if (!isRecord(value)) {
    return {};
  }
  return foldCredits(
    Object.entries(value).flatMap(([credit, drawn]) =>
      (Array.isArray(drawn) ? drawn : []).map((work) => ({ work: String(work), credit })),
    ),
  );
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
    sprites: asCreditWorks(root.sprites),
    overworld: asCreditWorks(root.overworld),
    scenery: (Array.isArray(root.scenery) ? root.scenery : []).map(String),
  };
}
