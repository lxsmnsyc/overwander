import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every pokemon description written the way version 2 writes them.
 *
 * The marks an archive paints belong to the picture: a pose packed once
 * and played by nine frames has its head in the same place in all nine,
 * and the first shape wrote all nine copies. This lifts them onto
 * `sheet.pictures`, leaves a frame's own marks behind only where it
 * disagrees with its picture, and drops the fields that were derivable
 * or duplicated. It halves the files.
 *
 * The marks are already on disk, so nothing has to be processed again.
 * Every frame is resolved back out of the new shape and compared with
 * what the old one said before anything is written, and a file that
 * does not match is left alone.
 *
 * ```bash
 * pnpm lift-marks              # every meta file under public/sprites/pokemon
 * pnpm lift-marks --dry-run    # say what it would do
 * ```
 */

const ROOT = 'public/sprites/pokemon';

/** Which shape this writes. `sprite-sheet.ts` is the contract. */
const VERSION = 2;

type Point = [number, number];

type Marks = (Point | null)[];

/** A version 1 frame: its own marks, then which picture it draws. */
type OldFrame = [
  shadow: Point | null,
  center: Point | null,
  head: Point | null,
  left: Point | null,
  right: Point | null,
  cell: number,
  flip: 0 | 1,
  at: Point,
];

type Picture = [number, number, number, number] | [number, number, number, number, Marks];

type Frame = [Point | null, number, 0 | 1, Point] | [Point | null, number, 0 | 1, Point, Marks];

interface OldTarget {
  frameWidth: number;
  frameHeight: number;
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  trim: Point;
  columns: number;
  rows: number;
  directions?: unknown;
  frames: OldFrame[];
}

interface OldAnim {
  name: number;
  index: number;
  frameWidth?: number;
  frameHeight?: number;
  durations: number[];
  target: number;
}

interface NewSheet {
  version: number;
  sheet: { width: number; height: number; pictures: Picture[] };
  anims: { shadowSize: number; anims: NewAnim[] };
  sprites: Record<string, NewTarget>;
}

interface NewAnim {
  name: number;
  index: number;
  durations: number[];
  target?: number;
}

interface NewTarget {
  frameWidth: number;
  frameHeight: number;
  sourceFrameWidth: number;
  sourceFrameHeight: number;
  trim: Point;
  columns: number;
  rows: number;
  frames: Frame[];
}

interface OldSheet {
  version?: number;
  compact?: boolean;
  sheet: { width: number; height: number; pictures: [number, number, number, number][] };
  anims: { shadowSize: number; anims: OldAnim[] };
  sprites: Record<string, OldTarget>;
}

/** Every description that ships, whatever region it is filed under. */
function metaFiles(): string[] {
  const found: string[] = [];

  for (const region of readdirSync(ROOT, { withFileTypes: true })) {
    const folder = join(ROOT, region.name, 'meta');

    if (!region.isDirectory() || !existsSync(folder)) {
      continue;
    }
    for (const file of readdirSync(folder)) {
      if (file.endsWith('.json')) {
        found.push(join(folder, file));
      }
    }
  }
  return found.sort();
}

/** A frame's marks, moved into the pixels of the picture it draws. */
function onPicture(frame: OldFrame, width: number): Marks {
  const [, ...rest] = frame;
  const at = frame[7];
  const flip = frame[6] === 1;

  return rest.slice(0, 4).map((point) => {
    if (!Array.isArray(point)) {
      return null;
    }
    const x = point[0] - at[0];

    return [flip ? width - 1 - x : x, point[1] - at[1]] as Point;
  });
}

/** And back out again, which is what the game does when it draws. */
function onFrame(marks: Marks, at: Point, flip: boolean, width: number): Marks {
  return marks.map((point) =>
    point == null ? null : [(flip ? width - 1 - point[0] : point[0]) + at[0], point[1] + at[1]],
  );
}

/** What the old file said the marks of one frame were. */
function markedOn(frame: OldFrame): Marks {
  return [frame[1], frame[2], frame[3], frame[4]];
}

/** Whether two frames put the same parts in the same places. */
function same(one: Marks, two: Marks): boolean {
  return one.every((point, at) => {
    const other = two[at];

    return point == null || other == null
      ? point === other
      : point[0] === other[0] && point[1] === other[1];
  });
}

function lift(sheet: OldSheet): NewSheet {
  const widthOf = (cell: number): number => sheet.sheet.pictures[cell]?.[2] ?? 0;
  const shared = new Map<number, Marks>();

  for (const target of Object.values(sheet.sprites)) {
    for (const frame of target.frames) {
      if (!shared.has(frame[5])) {
        shared.set(frame[5], onPicture(frame, widthOf(frame[5])));
      }
    }
  }
  const sprites: Record<string, NewTarget> = {};

  for (const [name, target] of Object.entries(sheet.sprites)) {
    sprites[name] = {
      frameWidth: target.frameWidth,
      frameHeight: target.frameHeight,
      sourceFrameWidth: target.sourceFrameWidth,
      sourceFrameHeight: target.sourceFrameHeight,
      trim: target.trim,
      columns: target.columns,
      rows: target.rows,
      frames: target.frames.map((frame): Frame => {
        const marks = onPicture(frame, widthOf(frame[5]));
        const held: Frame = [frame[0], frame[5], frame[6], frame[7]];
        const common = shared.get(frame[5]);

        return common != null && same(common, marks) ? held : [...held, marks];
      }),
    };
  }

  return {
    version: VERSION,
    sheet: {
      width: sheet.sheet.width,
      height: sheet.sheet.height,
      pictures: sheet.sheet.pictures.map((picture, at): Picture => {
        const marks = shared.get(at);

        return marks == null ? picture : [...picture, marks];
      }),
    },
    anims: {
      shadowSize: sheet.anims.shadowSize,
      anims: sheet.anims.anims.map((anim): NewAnim => ({
        name: anim.name,
        index: anim.index,
        durations: anim.durations,
        ...(anim.target === anim.name ? {} : { target: anim.target }),
      })),
    },
    sprites,
  };
}

/**
 * Every frame read back out of the new shape and compared with what the
 * old one said. A description is the only copy of where a pokemon's
 * parts are, so it is not rewritten on the strength of the arithmetic
 * looking right
 */
function agrees(was: OldSheet, lifted: NewSheet): boolean {
  for (const [name, target] of Object.entries(was.sprites)) {
    const frames = lifted.sprites[name].frames;

    if (frames.length !== target.frames.length) {
      return false;
    }

    for (let at = 0; at < target.frames.length; at += 1) {
      const frame = target.frames[at];
      const held = frames[at];

      if (held[1] !== frame[5] || held[2] !== frame[6]) {
        return false;
      }
      const picture = lifted.sheet.pictures[frame[5]];
      const marks = held[4] ?? picture[4] ?? [];

      if (!same(onFrame(marks, frame[7], frame[6] === 1, picture[2]), markedOn(frame))) {
        return false;
      }
    }
  }
  return true;
}

const dryRun = process.argv.includes('--dry-run');
let done = 0;
let already = 0;
let refused = 0;
let was = 0;
let now = 0;

for (const path of metaFiles()) {
  const raw = readFileSync(path, 'utf8');
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const sheet = JSON.parse(raw) as OldSheet;

  if ((sheet.version ?? 1) >= VERSION) {
    already += 1;
    continue;
  }
  const lifted = lift(sheet);

  if (!agrees(sheet, lifted)) {
    process.stdout.write(`lift-marks: ${path} does not read back the same, left alone\n`);
    refused += 1;
    continue;
  }
  const body = JSON.stringify(lifted);

  was += raw.length;
  now += body.length;
  done += 1;
  if (!dryRun) {
    // Through a second name, so an interrupted run leaves the
    // description it had rather than half of a new one
    writeFileSync(`${path}.writing`, body);
    renameSync(`${path}.writing`, path);
  }
}

const saved = was === 0 ? 0 : Math.round((1 - now / was) * 100);

process.stdout.write(
  `lift-marks${dryRun ? ' (dry run)' : ''}: ${done} lifted, ${already} already, ` +
    `${refused} refused, ${(was / 1024).toFixed(0)}K to ${(now / 1024).toFixed(0)}K (${saved}% off)\n`,
);
