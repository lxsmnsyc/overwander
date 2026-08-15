import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';

/**
 * What has been done to every sheet under `public/sprites`, and to
 * which version of it.
 *
 * The sprites arrive from outside this repository and are put through a
 * couple of passes before they ship: `compact-sprites` rewrites the PNG
 * container, `sprite-loops` measures whether an effect's last frame
 * flows back into its first. Both are quiet about what they did once
 * they have done it — a compacted sheet looks like any other PNG — so
 * without a record there is no way to answer the two questions that
 * come up every time a new batch lands: *has this one been through the
 * mill yet*, and *what did it look like before*.
 *
 * So each pass writes what it did here. The entry is keyed by the
 * sheet's path and carries a **digest of the image as it stands**,
 * which is what makes the record falsifiable: a sheet re-exported by
 * the packing tool no longer matches its entry, and that mismatch is
 * the signal that the passes have to run again. A record that could
 * only ever agree with itself would be decoration.
 *
 * It is a build record rather than an asset, so it lives outside
 * `public` — nothing serves it to a browser — and it is written sorted
 * and indented, because the thing it is most often read as is a diff.
 */

const LEDGER_PATH = 'sprite-pipeline.json';

/**
 * How much of the digest is kept. Sixteen hex characters is eight
 * bytes of SHA-256: far past any accidental collision among a few
 * hundred sheets, and short enough to read in a diff
 */
const DIGEST_LENGTH = 16;

/**
 * What the compaction pass did to a sheet
 */
export interface CompactStep {
  at: string;
  /** What the picture was stored as, e.g. `indexed 4-bit, none` */
  as: string;
  /** The file's size before this pass, and after it */
  was: number;
  bytes: number;
}

/**
 * What the loop pass decided about an effect sheet
 */
export interface LoopStep {
  at: string;
  loops: boolean;
  /** The measurement behind it, in the words the pass reports */
  why: string;
}

export interface SheetRecord {
  /** The first `DIGEST_LENGTH` characters of the image's SHA-256 */
  digest: string;
  bytes: number;
  width: number;
  height: number;
  compact?: CompactStep;
  loops?: LoopStep;
}

export interface Ledger {
  /**
   * The shape of this file. A pass that reads a version it does not
   * know starts the record again rather than writing a shape the other
   * passes cannot read
   */
  version: number;
  /**
   * Kept as a map rather than a plain object, since the whole file is
   * keys nobody knows in advance
   */
  sheets: Map<string, SheetRecord>;
}

const VERSION = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function numberOf(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * One step of a record, read back off the file. A step that has lost a
 * field is a step to run again rather than one to half-believe, so it
 * reads as nothing at all
 */
function compactStepOf(value: unknown): CompactStep | undefined {
  if (
    !isRecord(value) ||
    typeof value.at !== 'string' ||
    typeof value.as !== 'string' ||
    typeof value.was !== 'number' ||
    typeof value.bytes !== 'number'
  ) {
    return undefined;
  }
  return { at: value.at, as: value.as, was: value.was, bytes: value.bytes };
}

function loopStepOf(value: unknown): LoopStep | undefined {
  if (
    !isRecord(value) ||
    typeof value.at !== 'string' ||
    typeof value.loops !== 'boolean' ||
    typeof value.why !== 'string'
  ) {
    return undefined;
  }
  return { at: value.at, loops: value.loops, why: value.why };
}

export function digestOf(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, DIGEST_LENGTH);
}

/**
 * The path a sheet is recorded under: from the root of the project, so
 * the record reads the same on every machine
 */
export function sheetKey(imagePath: string): string {
  return relative(process.cwd(), imagePath).split('\\').join('/');
}

export function readLedger(): Ledger {
  const empty: Ledger = { version: VERSION, sheets: new Map() };

  if (!existsSync(LEDGER_PATH)) {
    return empty;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));
  } catch {
    // A ledger nobody can read is a ledger to start again, since every
    // entry in it can be rebuilt by running the passes
    return empty;
  }

  if (!isRecord(parsed) || parsed.version !== VERSION || !isRecord(parsed.sheets)) {
    return empty;
  }

  for (const [key, entry] of Object.entries(parsed.sheets)) {
    if (isRecord(entry) && typeof entry.digest === 'string') {
      empty.sheets.set(key, {
        digest: entry.digest,
        bytes: numberOf(entry.bytes),
        width: numberOf(entry.width),
        height: numberOf(entry.height),
        compact: compactStepOf(entry.compact),
        loops: loopStepOf(entry.loops),
      });
    }
  }
  return empty;
}

/**
 * Whether this sheet is the one the record was written about. A `false`
 * is the whole point of keeping the record: the sheet has been
 * re-exported since, and whatever was done to it was done to a
 * different picture
 */
export function isRecorded(ledger: Ledger, key: string, digest: string): boolean {
  return ledger.sheets.get(key)?.digest === digest;
}

/**
 * Whether a pass has just done what it had already recorded doing. The
 * timestamp is left out of the comparison on purpose — it is *when* the
 * answer was reached, and an unchanged answer reached again is the same
 * answer
 */
function same(before: CompactStep | LoopStep, after: CompactStep | LoopStep): boolean {
  const { at: _wasAt, ...was } = before;
  const { at: _isAt, ...is } = after;

  return JSON.stringify(was) === JSON.stringify(is);
}

/**
 * Note what a pass did to a sheet.
 *
 * Two things are deliberate here. A digest that differs from the one on
 * file drops the other passes' entries, since they were about the
 * picture that used to be there and keeping them would be the record
 * telling a comfortable lie. And a pass that reached the answer it had
 * already recorded keeps the **old timestamp**, so running the tools
 * over an unchanged collection leaves this file untouched rather than
 * filling a diff with new dates
 */
export function record(
  ledger: Ledger,
  key: string,
  sheet: { digest: string; bytes: number; width: number; height: number },
  step: { compact?: CompactStep; loops?: LoopStep },
): void {
  const known = ledger.sheets.get(key);
  const carried = known != null && known.digest === sheet.digest ? known : null;
  let compact = carried?.compact;
  let loops = carried?.loops;

  if (step.compact != null) {
    compact = compact != null && same(compact, step.compact) ? compact : step.compact;
  }
  if (step.loops != null) {
    loops = loops != null && same(loops, step.loops) ? loops : step.loops;
  }
  ledger.sheets.set(key, { ...sheet, compact, loops });
}

/**
 * Drop the sheets that are no longer on disk, so a deleted sprite does
 * not haunt the record
 */
export function prune(ledger: Ledger, present: Set<string>): string[] {
  const gone = [...ledger.sheets.keys()].filter((key) => !present.has(key));

  for (const key of gone) {
    ledger.sheets.delete(key);
  }
  return gone;
}

export function writeLedger(ledger: Ledger): void {
  const sheets: Record<string, SheetRecord> = {};

  // Sorted, because this file is read as a diff more often than it is
  // read as a file
  for (const key of [...ledger.sheets.keys()].sort()) {
    const entry = ledger.sheets.get(key);

    if (entry != null) {
      sheets[key] = entry;
    }
  }
  writeFileSync(LEDGER_PATH, `${JSON.stringify({ version: ledger.version, sheets }, null, 2)}\n`);
}

/**
 * The moment a pass ran, to the second. Sharper than that is noise in
 * a file that is mostly read to answer "before or after the packer
 * changed?"
 */
export default function now(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}
