import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import decode, {
  depthFor,
  encodeIndexed,
  encodeTruecolor,
  paletteOf,
  sameImage,
} from '../src/server/sprites/png.ts';
import now, {
  type Ledger,
  digestOf,
  prune,
  readLedger,
  record,
  sheetKey,
  writeLedger,
} from './sprite-ledger.ts';

/**
 * Shrink the sprite sheets under `public/sprites` without changing a
 * single pixel of them.
 *
 * Everything the game draws is pixel art: a pokemon sheet is a dozen
 * colours and an item sheet is not many more, and every one of them is
 * either fully solid or fully invisible — there is no half-transparent
 * pixel anywhere in the collection. The tools they come out of write
 * them as 8-bit-per-channel truecolour with an alpha channel, which
 * spends 32 bits a pixel describing a picture that needs four, and
 * hangs an EXIF block off the end for good measure. Written as an
 * indexed PNG instead the same pixels come back out of about a fifth of
 * the bytes.
 *
 * So this rewrites the container and leaves the picture alone. It is
 * not a quantiser: the palette is whatever colours the sheet actually
 * uses, and a sheet using more than 256 of them is left as truecolour
 * rather than being made to fit. Nothing is cropped, nothing is
 * repacked, and no description beside a sheet is touched, so a sheet
 * that was compact yesterday reads exactly the same way today.
 *
 * Two things worth knowing, because both look like obvious wins and
 * neither is:
 *
 * - **Padding is already free.** The sheets are a little over three
 *   quarters full, and repacking the sub-images into a tighter canvas
 *   is worth a few hundred bytes out of fifty thousand: the empty space
 *   is one long run of the transparent index, and a wholly empty
 *   1672x1344 sheet compresses to about 1.2K. Moving sub-images around
 *   would mean rewriting every sheet description to buy nothing.
 * - **PNG's adaptive filtering makes pixel art bigger.** Filtering
 *   exists to turn photographic gradients into small differences; on a
 *   sheet of flat colour it turns long runs of one palette index into
 *   noise. Filtering Bulbasaur costs a third more bytes than not
 *   filtering him. Both are tried below and the smaller one wins, but
 *   it is nearly always `None`.
 *
 * Usage:
 *
 * ```
 * pnpm compact-sprites                  # every sheet under public/sprites
 * pnpm compact-sprites --dry-run        # say what it would do
 * pnpm compact-sprites public/sprites/ui/items
 * ```
 */

const SPRITE_ROOT = 'public/sprites';

/**
 * The one place this script writes to the terminal. A reporting script
 * is all console, and one disabled line here is better than one above
 * every message
 */
function say(message: string): void {
  // oxlint-disable-next-line eslint/no-console
  console.log(message);
}

/* -------------------------------------------------------------------
 * The sheets themselves
 * ---------------------------------------------------------------- */

/**
 * What the description of a sheet says the sheet is.
 *
 * There are two shapes in the collection and this script cares about
 * neither's contents. A pokemon sheet from
 * [`SpeciesSpriteAnimation`](../src/canvas/species-sprite-animation.ts)
 * wraps its size and sub-images in a `sheet` key and adds animations
 * and anchors, and it is not beside the image at all: a coat and its
 * recolour share one description under `meta`, which is the point of
 * keeping it there. An item or move-category sheet from
 * [`BasicSprite`](../src/canvas/basic-sprite.ts) is the same size and
 * sub-images at the top level of a `data.json` beside the image, with
 * nothing else.
 *
 * Both are read only to check they still describe the image that came
 * back, and neither is rewritten — the pixels do not move, so the
 * coordinates cannot go stale
 */
interface Described {
  width: number;
  height: number;
  images: number;
  kind: 'animated' | 'basic';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

/**
 * Where the description of the sheet at this path lives: beside it,
 * or under `meta`, named after the drawing. A pokemon's regular and
 * shiny coats are one drawing recoloured and share a description; a
 * female is drawn again and carries the `_f` into its own
 */
function describedBy(imagePath: string): string[] {
  const directory = dirname(imagePath);

  // A pokemon is a folder holding every coat and one `sheet.json`; an
  // atlas is a folder holding `image.png` and `data.json`
  return [join(directory, 'sheet.json'), join(directory, 'data.json')];
}

function describe(imagePath: string): Described | null {
  let parsed: unknown;

  const found = describedBy(imagePath).find((path) => existsSync(path));

  if (found == null) {
    return null;
  }

  try {
    parsed = JSON.parse(readFileSync(found, 'utf8'));
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  // The animated shape is the one that wraps everything in `sheet`;
  // the basic shape is the same fields at the top level
  const nested = parsed.sheet;
  const animated = isRecord(nested);
  const sheet = animated ? nested : parsed;

  if (typeof sheet.width !== 'number' || typeof sheet.height !== 'number') {
    return null;
  }
  return {
    width: sheet.width,
    height: sheet.height,
    images: Array.isArray(sheet.images) ? sheet.images.length : 0,
    kind: animated ? 'animated' : 'basic',
  };
}

/**
 * Every sheet under a root, as the path of its image.
 *
 * A sheet is a PNG, wherever it is: the item atlases are a folder each
 * with an `image.png` and a `data.json` in it, and a pokemon is a
 * `{species}.png` per coat with one description under `meta` for both.
 * Both are found by looking for pictures rather than by knowing either
 * layout, so neither has to be taught here again
 */
function findSheets(root: string): string[] {
  const found: string[] = [];

  const walk = (directory: string): void => {
    let entries: string[];

    try {
      entries = readdirSync(directory, { withFileTypes: true }).map((entry) => entry.name);
    } catch {
      return;
    }

    for (const entry of entries) {
      const path = join(directory, entry);

      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (entry.endsWith('.png')) {
        found.push(path);
      }
    }
  };

  if (statSync(root).isDirectory()) {
    walk(root);
  } else if (root.endsWith('.png')) {
    found.push(root);
  }
  return found.sort();
}

interface Result {
  sheet: string;
  before: number;
  after: number;
  note: string;
  /** What the sheet is now, for the record kept in `sprite-pipeline.json` */
  key: string;
  digest: string;
  width: number;
  height: number;
  /** How the picture ended up stored, or null when it was left alone */
  as: string | null;
}

/**
 * Try every encoding this script knows for one sheet and keep the
 * smallest that reads back as the same picture.
 *
 * Verification is not optional and not a flag: the whole promise is
 * that the pixels do not change, so a candidate is decoded again and
 * compared against what came off disk before it is allowed to win
 */
function compact(imagePath: string, dryRun: boolean): Result {
  const original = readFileSync(imagePath);
  // Named the way it was asked for. A sheet inside the project reads
  // best as a path from its root, and one outside it — a scratch copy
  // somebody is testing this on — reads worse as a ladder of `..`
  const fromHere = relative(process.cwd(), imagePath);
  const sheet = fromHere.startsWith('..') ? imagePath : fromHere;
  const image = decode(original);
  const described = describe(imagePath);
  const at = {
    key: sheetKey(imagePath),
    digest: digestOf(original),
    width: image.width,
    height: image.height,
  };

  if (described != null && (described.width !== image.width || described.height !== image.height)) {
    return {
      ...at,
      sheet,
      before: original.length,
      after: original.length,
      as: null,
      note: `its description says ${described.width}x${described.height}, image is ${image.width}x${image.height} — left alone`,
    };
  }

  const palette = paletteOf(image);
  const candidates: { label: string; bytes: Buffer }[] = [];

  if (palette != null) {
    for (const filtering of ['none', 'adaptive'] as const) {
      candidates.push({
        label: `indexed ${depthFor(palette.colors.length)}-bit, ${filtering}`,
        bytes: encodeIndexed(image, palette, filtering),
      });
    }
  }
  for (const filtering of ['none', 'adaptive'] as const) {
    candidates.push({
      label: `truecolour, ${filtering}`,
      bytes: encodeTruecolor(image, filtering),
    });
  }

  candidates.sort((a, b) => a.bytes.length - b.bytes.length);

  const kind =
    described == null ? 'no description' : `${described.kind}, ${described.images} sub-images`;
  const colors = palette == null ? 'over 256 colours' : `${palette.colors.length} colours`;

  for (const candidate of candidates) {
    if (candidate.bytes.length >= original.length) {
      break;
    }
    if (!sameImage(image, decode(candidate.bytes))) {
      continue;
    }
    if (!dryRun) {
      writeFileSync(imagePath, candidate.bytes);
    }
    return {
      ...at,
      // The record is about the sheet as it now stands, which after a
      // rewrite is the candidate rather than what was read in
      digest: digestOf(candidate.bytes),
      sheet,
      before: original.length,
      after: candidate.bytes.length,
      as: candidate.label,
      note: `${kind}, ${colors} — ${candidate.label}`,
    };
  }
  return {
    ...at,
    sheet,
    before: original.length,
    after: original.length,
    as: 'already compact',
    note: `${kind}, ${colors} — already compact`,
  };
}

/**
 * Note what this run did, so a later one — or a person wondering why a
 * sheet is a quarter of the size it came in at — can look it up.
 *
 * A sheet this could not touch is recorded as **skipped, with the
 * reason**, rather than passed over. The reason is otherwise printed
 * once and lost, and a sheet that cannot be processed is a different
 * problem from one nobody has run the tools over yet
 */
function keepRecord(results: Result[], roots: string[]): number {
  const ledger: Ledger = readLedger();
  const stamp = now();
  let kept = 0;

  for (const result of results) {
    const sheet = {
      digest: result.digest,
      bytes: result.after,
      width: result.width,
      height: result.height,
    };

    if (result.as == null) {
      record(ledger, result.key, sheet, { skipped: { at: stamp, why: result.note } });
      continue;
    }

    // A run that found nothing to do must not overwrite the run that
    // did something. `already compact` is true of a sheet this pass
    // rewrote last week and true of one that arrived that way, and only
    // the first of those knows what it used to weigh — which is the
    // question this file exists to answer
    const known = ledger.sheets.get(result.key);
    const untouched = result.after === result.before;
    const older =
      untouched && known?.digest === result.digest && known.compact != null ? known.compact : null;

    record(
      ledger,
      result.key,
      sheet,
      older == null
        ? { compact: { at: stamp, as: result.as, was: result.before, bytes: result.after } }
        : {},
    );
    kept += 1;
  }

  // Only a run over the whole collection can say a sheet has gone; one
  // pointed at a single folder has no opinion about the rest
  if (roots.length === 0) {
    prune(ledger, new Set(results.map((result) => result.key)));
  }
  writeLedger(ledger);
  return kept;
}

/* -------------------------------------------------------------------
 * Running it
 * ---------------------------------------------------------------- */

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const roots = args.filter((arg) => !arg.startsWith('--'));
const sheets = (roots.length > 0 ? roots : [SPRITE_ROOT]).flatMap(findSheets);

if (sheets.length === 0) {
  say(
    `compact-sprites: no sheets found under ${(roots.length > 0 ? roots : [SPRITE_ROOT]).join(', ')}`,
  );
  process.exit(1);
}

const kb = (bytes: number): string => `${(bytes / 1024).toFixed(1)}K`;

const results = sheets.map((path) => compact(path, dryRun));

if (!dryRun) {
  keepRecord(results, roots);
}
const before = results.reduce((total, result) => total + result.before, 0);
const after = results.reduce((total, result) => total + result.after, 0);
const width = Math.max(...results.map((result) => result.sheet.length));

say(dryRun ? 'compact-sprites: dry run, nothing written\n' : 'compact-sprites\n');

for (const result of results) {
  const saved = result.before - result.after;
  const change = saved === 0 ? '     —' : `${((-saved / result.before) * 100).toFixed(1)}%`;

  say(
    `  ${result.sheet.padEnd(width)}  ${kb(result.before).padStart(8)} -> ${kb(result.after).padStart(8)}  ${change.padStart(7)}  ${result.note}`,
  );
}

say(
  `\n  ${sheets.length} sheets, ${kb(before)} -> ${kb(after)}, ${(((after - before) / before) * 100).toFixed(1)}%`,
);
