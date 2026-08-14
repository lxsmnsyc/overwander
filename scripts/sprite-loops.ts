import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import decode, { type Image } from './png.ts';

/**
 * Work out which effect sheets can be played on a loop, and write the
 * answer into the description beside each one.
 *
 * The sheets under `directional`, `effects` and `particles` are single
 * animations — a flame, a swirl of notes, a beam — and a caller wanting
 * one to last as long as something else has two ways to get there:
 * stretch one pass over the whole window, or run it round and round.
 * Looping is the right answer for a flame and the wrong one for an
 * explosion, and the difference is not in the description: it is in
 * whether the **last frame flows back into the first**. An explosion
 * ends as smoke and starts as a flash, so a loop of it flickers once a
 * pass; a flame ends mid-flicker and starts mid-flicker, so a loop of it
 * is a flame.
 *
 * Nothing but the pictures can say which is which, so this reads them.
 * Every frame is drawn back into the cell it was trimmed out of — the
 * frames of a compact sheet are different sizes, and two pictures can
 * only be compared in the same box — and then two questions are asked
 * about the seam between the last frame and the first:
 *
 * 1. **Is it a bigger jump than the animation's own steps?** The
 *    difference between neighbouring frames is what this animation
 *    considers ordinary motion, so a seam no worse than the middle of
 *    those is a seam nobody will see. A cut from smoke to a flash is
 *    several times any step in the clip.
 * 2. **Does the picture change into something else?** A fast animation
 *    can have a seam the size of its ordinary steps and still be a hard
 *    cut — a dissolving fire ring and a bright yellow star differ about
 *    as much as any two frames of the dissolve. What gives that away is
 *    the colour: the palette of the last frame is nothing like the
 *    palette of the first. It is only asked when both ends have enough
 *    drawn on them to have a palette, since an effect that fades to two
 *    pixels can be any colour it likes.
 *
 * Both questions are answered conservatively, because the two mistakes
 * are not equal. A sheet wrongly marked as not looping is played once
 * and stretched, which is what every effect does today and looks
 * perfectly fine. A sheet wrongly marked as looping flickers on screen
 * for as long as it is held.
 *
 * Usage:
 *
 * ```
 * pnpm sprite-loops              # every effect sheet
 * pnpm sprite-loops --dry-run    # say what it would write
 * pnpm sprite-loops public/sprites/effects
 * ```
 */

/**
 * The trees this looks at. Each holds one animation per folder: a
 * `data.json` naming the frames and an `image.png` holding them
 */
const EFFECT_ROOTS = [
  'public/sprites/directional',
  'public/sprites/effects',
  'public/sprites/particles',
];

/**
 * How different two frames of the same animation may be at the seam,
 * as a mean absolute difference over the cell's premultiplied bytes,
 * whatever the animation's own steps look like.
 *
 * It is what makes a near-still sheet readable: a sheet whose frames
 * barely differ has a median step of nothing, and dividing by that says
 * every seam is infinitely bad. Three is well below anything visible
 * and well above the rounding in a resampled sprite
 */
const SEAM_FLOOR = 3;

/**
 * How much of the palette may change across the seam before the picture
 * counts as having turned into something else, as a share of the frame's
 * coverage
 */
const PALETTE_FLOOR = 0.15;

/**
 * How many times the animation's ordinary palette drift the seam may be
 */
const PALETTE_SLACK = 2;

/**
 * How much of a cell has to be covered before its colours mean
 * anything. A frame with a dozen lit pixels has no palette to speak of
 */
const FAINT = 0.01;

/**
 * How faint a pixel can be and still count as drawn
 */
const FAINTEST = 8;

function say(message: string): void {
  // oxlint-disable-next-line eslint/no-console
  console.log(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * One frame of a sheet, as its description gives it. An untrimmed sheet
 * reads as a trim of nothing over a cell the size of the frame, which is
 * the same bargain the runtime makes
 */
interface Frame {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
  trim: [number, number];
}

function framesOf(images: unknown[]): Frame[] {
  const frames: Frame[] = [];

  images.forEach((entry, at) => {
    if (!isRecord(entry)) {
      return;
    }

    const width = asNumber(entry.width);
    const height = asNumber(entry.height);

    if (width <= 0 || height <= 0) {
      return;
    }

    const trim = Array.isArray(entry.trim) ? entry.trim : [];
    // The frames are named after the files they were cut from —
    // `000.png`, `001.png` — which is also the order they play in
    const named = Number.parseInt(typeof entry.name === 'string' ? entry.name : '', 10);

    frames.push({
      index: Number.isFinite(named) ? named : at,
      x: asNumber(entry.x),
      y: asNumber(entry.y),
      width,
      height,
      sourceWidth: asNumber(entry.sourceWidth) || width,
      sourceHeight: asNumber(entry.sourceHeight) || height,
      trim: [asNumber(trim[0]), asNumber(trim[1])],
    });
  });
  return frames.sort((a, b) => a.index - b.index);
}

/**
 * A frame drawn back into its cell, premultiplied.
 *
 * Both parts matter. The cell is what makes two frames comparable at
 * all, since a trimmed sheet holds them at whatever size their content
 * needed; premultiplying is what makes a transparent pixel the same
 * pixel whatever colour was left underneath it, which is exactly what a
 * canvas will do with it
 */
function cellOf(sheet: Image, frame: Frame): Buffer {
  const cell = Buffer.alloc(frame.sourceWidth * frame.sourceHeight * 4);

  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const from = ((frame.y + y) * sheet.width + frame.x + x) * 4;
      const alpha = sheet.rgba[from + 3];
      const to = ((frame.trim[1] + y) * frame.sourceWidth + frame.trim[0] + x) * 4;

      cell[to] = Math.round((sheet.rgba[from] * alpha) / 255);
      cell[to + 1] = Math.round((sheet.rgba[from + 1] * alpha) / 255);
      cell[to + 2] = Math.round((sheet.rgba[from + 2] * alpha) / 255);
      cell[to + 3] = alpha;
    }
  }
  return cell;
}

/**
 * How different two frames are, as a mean absolute difference over
 * every byte of the cell. Nought is the same picture; the scale runs to
 * 255 and never gets near it
 */
function difference(one: Buffer, two: Buffer): number {
  let total = 0;

  for (let at = 0; at < one.length; at++) {
    total += Math.abs(one[at] - two[at]);
  }
  return total / one.length;
}

/**
 * How much of a cell is drawn on at all
 */
function coverage(cell: Buffer): number {
  let lit = 0;

  for (let at = 3; at < cell.length; at += 4) {
    if (cell[at] > FAINTEST) {
      lit += 1;
    }
  }
  return lit / (cell.length / 4);
}

/**
 * What colours a frame is made of, as a share of its coverage.
 *
 * Four bits a channel, which is coarse on purpose: two frames of one
 * flame are the same flame in slightly different places, and a
 * histogram fine enough to tell those apart would call every animation
 * a hard cut
 */
function palette(cell: Buffer): Map<number, number> {
  const bins = new Map<number, number>();
  let total = 0;

  for (let at = 0; at < cell.length; at += 4) {
    const alpha = cell[at + 3];

    if (alpha <= FAINTEST) {
      continue;
    }

    // Un-premultiplied again, so a faint pixel of a colour bins with a
    // solid one
    const key =
      ((Math.round((cell[at] * 255) / alpha) >> 4) << 8) |
      ((Math.round((cell[at + 1] * 255) / alpha) >> 4) << 4) |
      (Math.round((cell[at + 2] * 255) / alpha) >> 4);
    const weight = alpha / 255;

    bins.set(key, (bins.get(key) ?? 0) + weight);
    total += weight;
  }

  if (total > 0) {
    for (const [key, weight] of bins) {
      bins.set(key, weight / total);
    }
  }
  return bins;
}

/**
 * How much of one palette is not the other, from nought for the same
 * colours to one for nothing in common
 */
function paletteDistance(one: Map<number, number>, two: Map<number, number>): number {
  let sum = 0;

  for (const key of new Set([...one.keys(), ...two.keys()])) {
    sum += Math.abs((one.get(key) ?? 0) - (two.get(key) ?? 0));
  }
  return sum / 2;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

interface Verdict {
  loops: boolean;
  frames: number;
  /** The seam, and the animation's own ordinary step, in cell bytes */
  seam: number;
  step: number;
  /** The same two for the palette, or null when the ends are too faint */
  paletteSeam: number | null;
  paletteStep: number;
  why: string;
}

function judge(sheet: Image, frames: Frame[]): Verdict {
  const cells = frames.map((frame) => cellOf(sheet, frame));

  // A single picture is the same picture every time round
  if (cells.length <= 1) {
    return {
      loops: true,
      frames: cells.length,
      seam: 0,
      step: 0,
      paletteSeam: null,
      paletteStep: 0,
      why: 'one frame',
    };
  }

  const first = cells[0];
  const last = cells[cells.length - 1];
  const steps: number[] = [];

  for (let at = 0; at + 1 < cells.length; at++) {
    steps.push(difference(cells[at], cells[at + 1]));
  }

  const seam = difference(last, first);
  const step = median(steps);
  const allowed = Math.max(SEAM_FLOOR, step);

  const paletteSteps: number[] = [];
  const palettes = cells.map(palette);

  for (let at = 0; at + 1 < palettes.length; at++) {
    paletteSteps.push(paletteDistance(palettes[at], palettes[at + 1]));
  }

  // Colours are only worth comparing when both ends have some
  const compareColours = coverage(first) >= FAINT && coverage(last) >= FAINT;
  const paletteSeam = compareColours
    ? paletteDistance(palettes[palettes.length - 1], palettes[0])
    : null;
  const paletteStep = median(paletteSteps);
  const paletteAllowed = Math.max(PALETTE_FLOOR, paletteStep * PALETTE_SLACK);

  const smooth = seam <= allowed;
  const sameThing = paletteSeam == null || paletteSeam <= paletteAllowed;
  const shared = { frames: cells.length, seam, step, paletteSeam, paletteStep };

  if (!smooth) {
    return { ...shared, loops: false, why: `seam ${(seam / allowed).toFixed(1)}x its own motion` };
  }
  if (!sameThing) {
    return {
      ...shared,
      loops: false,
      why: `ends on other colours (${(paletteSeam / paletteAllowed).toFixed(1)}x)`,
    };
  }
  return { ...shared, loops: true, why: 'seam is within its own motion' };
}

/**
 * The description with `loops` written into it, in the order the file
 * already had, and minified the way the packer writes it.
 *
 * Rebuilt key by key rather than spread, so `loops` lands beside
 * `compact` — the other thing about a sheet as a whole — instead of
 * after a few hundred frames
 */
function withLoops(data: Record<string, unknown>, loops: boolean): string {
  const next: Record<string, unknown> = {};

  if ('compact' in data) {
    next.compact = data.compact;
  }
  next.loops = loops;

  for (const [key, value] of Object.entries(data)) {
    if (key !== 'compact' && key !== 'loops') {
      next[key] = value;
    }
  }
  return `${JSON.stringify(next)}\n`;
}

interface Result {
  sheet: string;
  verdict: Verdict | null;
  changed: boolean;
  note: string;
}

function look(directory: string, dryRun: boolean): Result {
  const sheet = relative(process.cwd(), directory);
  const descriptionPath = join(directory, 'data.json');
  const imagePath = join(directory, 'image.png');
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(descriptionPath, 'utf8'));
  } catch {
    return { sheet, verdict: null, changed: false, note: 'no description to read' };
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.images)) {
    return { sheet, verdict: null, changed: false, note: 'not an atlas' };
  }

  const image = decode(readFileSync(imagePath));
  const frames = framesOf(parsed.images);

  if (frames.length === 0) {
    return { sheet, verdict: null, changed: false, note: 'no frames' };
  }

  const verdict = judge(image, frames);
  const changed = parsed.loops !== verdict.loops;

  if (changed && !dryRun) {
    writeFileSync(descriptionPath, withLoops(parsed, verdict.loops));
  }
  return { sheet, verdict, changed, note: verdict.why };
}

/**
 * Every animation under a root: a folder with a description and an
 * image in it
 */
function findSheets(root: string): string[] {
  if (!existsSync(root)) {
    return [];
  }

  const found: string[] = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const directory = join(root, entry.name);

    if (entry.isDirectory() && existsSync(join(directory, 'image.png'))) {
      found.push(directory);
    }
  }
  return found.sort((a, b) => Number(a.split('/').pop()) - Number(b.split('/').pop()));
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const roots = args.filter((arg) => !arg.startsWith('--'));
const sheets = (roots.length > 0 ? roots : EFFECT_ROOTS).flatMap(findSheets);

if (sheets.length === 0) {
  say(
    `sprite-loops: no effect sheets under ${(roots.length > 0 ? roots : EFFECT_ROOTS).join(', ')}`,
  );
  process.exit(1);
}

say(dryRun ? 'sprite-loops: dry run, nothing written\n' : 'sprite-loops\n');

const results = sheets.map((directory) => look(directory, dryRun));
const width = Math.max(...results.map((result) => result.sheet.length));

for (const result of results) {
  const verdict = result.verdict;

  if (verdict == null) {
    say(`  ${result.sheet.padEnd(width)}  ${result.note}`);
    continue;
  }

  const measured =
    `seam ${verdict.seam.toFixed(1)} vs step ${verdict.step.toFixed(1)}` +
    (verdict.paletteSeam == null
      ? ', colours too faint to compare'
      : `, colours ${verdict.paletteSeam.toFixed(2)} vs ${verdict.paletteStep.toFixed(2)}`);

  say(
    `  ${result.sheet.padEnd(width)}  ${verdict.loops ? 'loops    ' : 'one pass '} ` +
      `${String(verdict.frames).padStart(3)} frames  ${measured.padEnd(52)} ${result.note}` +
      (result.changed ? '' : ' (unchanged)'),
  );
}

const looping = results.filter((result) => result.verdict?.loops === true).length;
const changed = results.filter((result) => result.changed).length;

say(
  `\n  ${results.length} sheets, ${looping} loop, ${results.length - looping} play once, ${changed} rewritten`,
);
