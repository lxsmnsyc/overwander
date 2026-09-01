import { deflateSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import SpeciesSpriteAnimation, { SPRITE_TICK } from '../../src/canvas/species-sprite-animation';
import {
  spriteFramesPath,
  spriteImagePath,
  spriteSheetPath,
} from '../../src/canvas/species-sprites';
import type { Coat } from '../../src/canvas/sprite-coats';
import asSpriteSheetJSON, {
  type FrameTable,
  type Point,
  SPRITE_DIRECTIONS,
  type SheetRect,
  type SpriteSheetJSON,
  type SpriteTargetData,
  readFrameTable,
} from '../../src/canvas/sprite-sheet';
import { Species } from '../../src/data/ids/species';
import { SpriteAnim, asSpriteAnim, spriteAnimName } from '../../src/data/ids/sprite-anims';

/**
 * The real thing: whatever is under `public/sprites` is what the
 * canvases will be handed, so the tests read one rather than a fixture
 * that agrees with the code by construction.
 *
 * A pokemon is a folder named after its species id, holding one
 * `sheet.json`, one `frames.bin` and a PNG per coat. The species id is
 * its dex number, Bulbasaur is 1, except for Missingno, an egg and a
 * substitute, which are numbered past a hundred thousand because they
 * are not pokemon and have no dex number of their own
 */
const ROOT = 'public/sprites/pokemon';

/** Every region with sheets under it: `kanto`, and whatever follows. */
const REGIONS = readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

/** A pokemon's folder is its species id and nothing else. */
const FOLDER = /^\d+$/;

const SHIPPED = REGIONS.flatMap((region) =>
  readdirSync(`${ROOT}/${region}`)
    .filter((name) => FOLDER.test(name))
    .map((name) => ({ region, species: Number(name) })),
).sort((one, two) => one.species - two.species);

/** One pokemon read the way the game reads it. */
async function described(region: string, species: number): Promise<SpriteSheetJSON> {
  const folder = `${ROOT}/${region}/${species}`;
  const frames = await readFrameTable(readFileSync(`${folder}/frames.bin`));

  return asSpriteSheetJSON(JSON.parse(readFileSync(`${folder}/sheet.json`, 'utf8')), frames);
}

/** The descriptions that ship, in species order. */
const DESCRIBED: { species: number; region: string; data: SpriteSheetJSON }[] = await Promise.all(
  SHIPPED.map(async (found) => ({ ...found, data: await described(found.region, found.species) })),
);

const SAMPLE = DESCRIBED[0].data;

/**
 * Every clip of a description, as the pair the tests want: which
 * animation it is, and what the sheet says about it
 */
function clipsOf(data: SpriteSheetJSON): [SpriteAnim, SpriteTargetData][] {
  return Object.entries(data.sprites).flatMap(([name, target]) => {
    const anim = asSpriteAnim(Number(name));

    return anim == null ? [] : [[anim, target] as [SpriteAnim, SpriteTargetData]];
  });
}

/**
 * Somewhere to draw, and a record of what was asked for. The class
 * hands the browser a source rectangle, a destination rectangle and
 * the odd ellipse, so that is the whole of what a test needs back
 */
function recorder(): {
  context: CanvasRenderingContext2D;
  drawn: number[][];
  ellipses: number[][];
} {
  const drawn: number[][] = [];
  const ellipses: number[][] = [];
  const context = {
    globalAlpha: 1,
    fillStyle: '',
    imageSmoothingEnabled: true,
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    fill: () => {},
    translate: () => {},
    scale: () => {},
    drawImage: (_image: unknown, ...rest: number[]) => {
      drawn.push(rest);
    },
    ellipse: (...rest: number[]) => {
      ellipses.push(rest);
    },
  };

  // The stub answers the members `draw` and `drawShadow` touch; the
  // cast is what lets a test hold it where a real context goes
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { context: context as unknown as CanvasRenderingContext2D, drawn, ellipses };
}

/**
 * A sheet with an image already in it, since nothing can be drawn
 * before one has loaded and there is no browser here to load one
 */
function loaded(data: SpriteSheetJSON = SAMPLE): SpeciesSpriteAnimation {
  const sprite = new SpeciesSpriteAnimation('image.png', data);

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (sprite as unknown as { image: unknown }).image = {};
  return sprite;
}

/**
 * A clip of this sheet that moves its own anchors, and how far into it
 * to wind to reach the frame that proves it. Found rather than named,
 * since which pokemon ships first is not this test's business
 */
function travelling(data: SpriteSheetJSON): { anim: SpriteAnim; row: number; at: number } {
  for (const anim of data.anims) {
    const target = data.sprites[anim.target];

    if (target == null) {
      continue;
    }

    for (let row = 0; row < target.rows; row++) {
      const rest = target.frames[row * target.columns]?.shadow;
      let elapsed = 0;

      for (let column = 1; column < target.columns; column++) {
        elapsed += Math.max(1, anim.durations[column - 1] ?? 1) * SPRITE_TICK;

        const shadow = target.frames[row * target.columns + column]?.shadow;

        if (rest != null && shadow != null && (rest[0] !== shadow[0] || rest[1] !== shadow[1])) {
          return { anim: anim.name, row, at: elapsed + 1 };
        }
      }
    }
  }
  throw new Error('no clip on this sheet moves its anchors');
}

describe('sprite metadata', () => {
  it('reads the shipped descriptions', () => {
    expect(DESCRIBED.length).toBeGreaterThan(0);

    for (const { species, data } of DESCRIBED) {
      expect(data.sheet.width, `${species} sheet width`).toBeGreaterThan(0);
      expect(data.sheet.pictures.length, `${species} pictures`).toBeGreaterThan(0);
      expect(data.anims.length, `${species} animations`).toBeGreaterThan(0);
      expect(Object.keys(data.sprites).length, `${species} anchor grids`).toBeGreaterThan(0);
    }
  });

  it('gives every animation anchors and pictures to go with them', () => {
    for (const { species, data } of DESCRIBED) {
      // The pictures belong to the sheet rather than to a clip: two
      // animations that hold the same drawing point at one copy of it
      const pictures = data.sheet.pictures;

      for (const picture of pictures) {
        const corner = `${species} picture`;

        expect(picture.x + picture.width, corner).toBeLessThanOrEqual(data.sheet.width);
        expect(picture.y + picture.height, corner).toBeLessThanOrEqual(data.sheet.height);
      }

      for (const anim of data.anims) {
        const target = data.sprites[anim.target];

        expect(target, `${species} ${anim.name} has anchors`).toBeDefined();

        if (target == null) {
          continue;
        }
        // One entry per frame of every orientation, and the durations
        // say how many frames that is
        expect(target.frames.length, `${species} ${anim.target} frames`).toBe(
          target.rows * target.columns,
        );
        expect(target.rows, `${species} ${anim.target} rows`).toBeLessThanOrEqual(
          SPRITE_DIRECTIONS.length,
        );
        expect(anim.durations.length, `${species} ${anim.name} durations`).toBe(target.columns);

        // Every frame is drawn from one of the sheet's pictures, hung
        // somewhere inside its box
        for (const frame of target.frames) {
          const cell = pictures[frame.cell] as SheetRect | undefined;

          expect(cell, `${species} ${anim.target} cell`).toBeDefined();

          if (cell == null) {
            continue;
          }
          const hangs = `${species} ${anim.target} hangs`;

          expect(frame.at[0] + cell.width, hangs).toBeLessThanOrEqual(target.frameWidth);
          expect(frame.at[1] + cell.height, hangs).toBeLessThanOrEqual(target.frameHeight);
        }
      }
    }
  }, 60_000);

  it('is written in the shape the reader packs for', () => {
    // The collection stamps every sheet it builds, and a shape this
    // reader does not know is a sheet copied in from an older build of
    // it. This is what says so before a canvas draws nothing
    for (const { species, data } of DESCRIBED) {
      expect(data.version, `${species}`).toBe(2);
    }
  });

  /**
   * A clip drawn past the cell its `AnimData.xml` declares.
   *
   * Heracross' female coat reaches one column further than the eighty
   * the archive says the Attack cell is, and the frame box is the
   * union of every coat: the drawing wins over the declaration. Kept
   * as a list so a second one shows up as a failure rather than as
   * nothing
   */
  const OVERDRAWN = new Set(['214 Attack']);

  it('trims frames into the cell they were drawn in', () => {
    const past: string[] = [];

    for (const { species, data } of DESCRIBED) {
      for (const [name, target] of clipsOf(data)) {
        if (
          target.trim[0] + target.frameWidth > target.sourceFrameWidth ||
          target.trim[1] + target.frameHeight > target.sourceFrameHeight
        ) {
          past.push(`${species} ${spriteAnimName(name)}`);
        }
        // Whatever the cell says, a frame is cut out of the drawing
        // rather than out of the air
        expect(target.trim[0], `${species} ${name} trim`).toBeGreaterThanOrEqual(0);
        expect(target.trim[1], `${species} ${name} trim`).toBeGreaterThanOrEqual(0);
      }
    }
    expect(past).toEqual([...OVERDRAWN]);
  });

  it('marks where the parts of a pokemon are, on every frame', () => {
    // Gathered and asserted once rather than asserted per frame: every
    // sheet's every frame is thousands of expectations, and the check
    // costs more in bookkeeping than in reading the files
    const missing: string[] = [];
    const escaped: string[] = [];

    for (const { species, data } of DESCRIBED) {
      for (const [name, target] of clipsOf(data)) {
        for (const frame of target.frames) {
          // The shadow is the one anchor everything else falls back
          // to, since it is what a pokemon stands on
          if (frame.shadow == null) {
            missing.push(`${species} ${name} shadow`);
          }

          // Anchors are in the trimmed frame's coordinates and are
          // allowed to fall outside it: trimming crops to what is
          // drawn, and a flying pokemon's shadow is on the ground
          // below everything drawn. What they may not leave is the
          // cell the frame was cut from
          const parts: [string, Point | null][] = [
            ['shadow', frame.shadow],
            ['center', frame.center],
            ['head', frame.head],
            ['left', frame.left],
            ['right', frame.right],
          ];

          for (const [part, point] of parts) {
            if (point == null) {
              continue;
            }

            const x = point[0] + target.trim[0];
            const y = point[1] + target.trim[1];

            if (x < 0 || x >= target.sourceFrameWidth || y < 0 || y >= target.sourceFrameHeight) {
              escaped.push(`${species} ${name} ${part}`);
            }
          }
        }
      }
    }

    expect(missing).toEqual([]);
    expect(escaped).toEqual([]);
  });

  it('fills in what a broken description leaves out rather than throwing', () => {
    const empty = asSpriteSheetJSON(
      {
        anims: [{ anim: SpriteAnim.Idle }],
        sprites: [{ anim: SpriteAnim.Idle, frameWidth: 24, frameHeight: 32 }],
      },
      { records: [], indices: new Uint16Array(0) },
    );
    const idle = empty.sprites[SpriteAnim.Idle];

    expect(empty.sheet.pictures).toEqual([]);
    expect(empty.anims[0].durations).toEqual([]);
    // An animation with no target of its own plays from the grid named
    // after it
    expect(empty.anims[0].target).toBe(SpriteAnim.Idle);
    expect(idle?.frames).toEqual([]);
    expect(asSpriteSheetJSON(null, { records: [], indices: new Uint16Array(0) }).anims).toEqual([]);
    // A description that says nothing about trimming describes an
    // untrimmed sheet
    expect(idle?.trim).toEqual([0, 0]);
    expect(idle?.sourceFrameWidth).toBe(24);
    expect(idle?.sourceFrameHeight).toBe(32);
  });
});

/**
 * `frames.bin`, which is where every frame actually is.
 *
 * The file is built in the SpriteCollab checkout, so a reader that
 * disagrees with it by a byte reads whole pokemon as gibberish. These
 * build one by hand from the format the collection documents
 */
describe('reading frames.bin', () => {
  const COLUMNS = 14;
  const ABSENT = -32768;

  /** A file in the shape `compact/README.md` describes. */
  function bin(records: number[][], indices: number[], version = 2, magic = 'PMDF'): Uint8Array {
    const head = Buffer.alloc(12);

    head.write(magic, 0, 'ascii');
    head.writeUInt16LE(version, 4);
    head.writeUInt16LE(records.length, 6);
    head.writeUInt32LE(indices.length, 8);

    const table = Buffer.alloc(records.length * COLUMNS * 2);

    // Column-major: every record's column 0, then every record's
    // column 1, which is what makes one column of the whole sheet
    // compress
    for (let column = 0; column < COLUMNS; column += 1) {
      for (const [record, held] of records.entries()) {
        table.writeInt16LE(held[column], (column * records.length + record) * 2);
      }
    }
    const stream = Buffer.alloc(indices.length * 2);

    for (const [at, index] of indices.entries()) {
      stream.writeUInt16LE(index, at * 2);
    }
    return Uint8Array.from(Buffer.concat([head, deflateSync(Buffer.concat([table, stream]))]));
  }

  /** One record with every anchor painted, and one with none. */
  const marked = [3, 20, 4, 12, 5, 2, 1, 9, 8, 9, 7, 1, 2, 3];
  const bare = [
    ABSENT,
    ABSENT,
    ABSENT,
    ABSENT,
    ABSENT,
    ABSENT,
    ABSENT,
    ABSENT,
    ABSENT,
    ABSENT,
    4,
    0,
    0,
    0,
  ];

  it('reads a frame back out of the table', async () => {
    const table = await readFrameTable(bin([marked], [0]));

    expect(table.records).toHaveLength(1);
    expect(table.records[0]).toEqual({
      shadow: [3, 20],
      center: [4, 12],
      head: [5, 2],
      left: [1, 9],
      right: [8, 9],
      cell: 7,
      flip: true,
      at: [2, 3],
    });
  });

  it('reads an unpainted anchor as nothing rather than as a corner', async () => {
    const table = await readFrameTable(bin([bare], [0]));

    expect(table.records[0].shadow).toBeNull();
    expect(table.records[0].center).toBeNull();
    // Its picture is still there: a frame with no marks is drawn, it
    // just has to be placed by a fallback
    expect(table.records[0].cell).toBe(4);
  });

  it('hands every frame holding one pose the same record', async () => {
    const table = await readFrameTable(bin([marked, bare], [0, 0, 1, 0]));

    expect([...table.indices]).toEqual([0, 0, 1, 0]);
    expect(table.records[table.indices[0]]).toBe(table.records[table.indices[1]]);
  });

  it('reads the same frames without the platform inflate', async () => {
    // Safari before 16.4 and Firefox before 113 have no
    // `DecompressionStream`, and fall back to `fflate`
    const file = bin([marked, bare], [0, 1]);
    const platform = await readFrameTable(file);

    vi.stubGlobal('DecompressionStream', undefined);
    try {
      expect((await readFrameTable(file)).records).toEqual(platform.records);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('reads a file it does not know as no frames at all', async () => {
    // Drawing from a file whose shape is a guess is drawing a slice of
    // whatever happens to sit at those coordinates
    expect((await readFrameTable(bin([marked], [0], 1))).records).toEqual([]);
    expect((await readFrameTable(bin([marked], [0], 2, 'JUNK'))).records).toEqual([]);
    expect((await readFrameTable(new Uint8Array(4))).records).toEqual([]);
  });

  it('gives a clip the frames its span points at', async () => {
    const table: FrameTable = await readFrameTable(bin([marked, bare], [1, 0, 0]));
    const data = asSpriteSheetJSON(
      {
        version: 2,
        sheet: { width: 8, height: 8, pictures: [[0, 0, 4, 4]] },
        anims: [{ anim: SpriteAnim.Idle, index: 0, durations: [1, 1] }],
        sprites: [
          {
            anim: SpriteAnim.Idle,
            frameWidth: 8,
            frameHeight: 8,
            columns: 2,
            rows: 1,
            frames: [1, 2],
          },
        ],
      },
      table,
    );
    const frames = data.sprites[SpriteAnim.Idle]?.frames ?? [];

    // The span starts at 1, so the record the first index names is not
    // this clip's business
    expect(frames).toHaveLength(2);
    expect(frames[0].cell).toBe(7);
    expect(frames[1].cell).toBe(7);
  });
});

describe('species sprite animation', () => {
  it('offers every animation the sheet actually holds', () => {
    const sprite = loaded();

    expect(sprite.has(SpriteAnim.Idle)).toBe(true);
    expect(sprite.has(SpriteAnim.Walk)).toBe(true);
    // Bulbasaur was never drawn twirling; asking is how a caller
    // finds out
    expect(sprite.has(SpriteAnim.Twirl)).toBe(false);
    expect(sprite.play(SpriteAnim.Twirl)).toBe(false);
  });

  it('stretches a clip over a window somebody else decided', () => {
    const sprite = loaded();
    const idle = SAMPLE.anims.find((anim) => anim.name === SpriteAnim.Idle);
    const drawn = (idle?.durations ?? []).reduce(
      (total, held) => total + Math.max(1, held) * SPRITE_TICK,
      0,
    );

    expect(drawn).toBeGreaterThan(0);

    // A cast is as long as the move's priority makes it, and the clip
    // is whatever length it was drawn at. Stretched, the two agree:
    // one pass fills the window exactly, whatever the two lengths are
    const window = drawn * 4;

    expect(sprite.play(SpriteAnim.Idle, { loop: false, duration: window })).toBe(true);

    sprite.update(window - 1);
    expect(sprite.finished).toBe(false);
    // The last frame, not the first: the clip ran once over the whole
    // window rather than four times
    expect(sprite.frame).toBe(Math.max(0, (idle?.durations.length ?? 1) - 1));

    sprite.update(1);
    expect(sprite.finished).toBe(true);

    // A shorter window is the same clip played faster, which is what
    // makes a high-priority move visibly a quicker wind-up
    const quick = loaded();

    quick.play(SpriteAnim.Idle, { loop: false, duration: drawn / 2 });
    quick.update(drawn / 2);
    expect(quick.finished).toBe(true);

    // Asked for again with the same window, it keeps its place — a
    // caller playing this every tick of a cast must not restart the
    // clip sixty times a second
    const held = loaded();

    held.play(SpriteAnim.Idle, { loop: false, duration: window });
    held.update(window / 2);
    held.play(SpriteAnim.Idle, { loop: false, duration: window });
    held.update(window / 2);
    expect(held.finished).toBe(true);

    // ...and asked for again once it has run out, `restart` gives it
    // a fresh pass over a fresh window. That is what the next step of
    // a multi-step move is
    held.play(SpriteAnim.Idle, { loop: false, duration: window, restart: true });
    expect(held.finished).toBe(false);
    held.update(window - 1);
    expect(held.finished).toBe(false);
    held.update(1);
    expect(held.finished).toBe(true);

    // Left out, a clip plays at the speed it was drawn at
    const plain = loaded();

    plain.play(SpriteAnim.Idle, { loop: false });
    plain.update(drawn);
    expect(plain.finished).toBe(true);
  });

  it('holds each frame for the duration the sheet gives it', () => {
    const sprite = loaded();
    const idle = SAMPLE.anims.find((anim) => anim.name === SpriteAnim.Idle);

    expect(idle).toBeDefined();
    expect(sprite.play(SpriteAnim.Idle)).toBe(true);
    expect(sprite.frame).toBe(0);

    // One tick short of the first frame's end is still the first frame
    sprite.update((idle?.durations[0] ?? 0) * SPRITE_TICK - 1);
    expect(sprite.frame).toBe(0);

    sprite.update(1);
    expect(sprite.frame).toBe(1);
  });

  it('loops back round, so an idle pokemon idles for ever', () => {
    const sprite = loaded();

    sprite.play(SpriteAnim.Idle, { loop: true });
    sprite.update(60_000);

    expect(sprite.finished).toBe(false);
    expect(sprite.paused).toBe(false);
    expect(sprite.frame).toBeGreaterThanOrEqual(0);
  });

  it('holds the last frame of a one-shot and stops there', () => {
    const sprite = loaded();

    sprite.play(SpriteAnim.Hurt, { loop: false });
    sprite.update(60_000);

    expect(sprite.finished).toBe(true);
    // Stopped rather than vanished: a fainting pokemon should stay on
    // screen wearing its last frame
    expect(sprite.paused).toBe(true);
  });

  it('carries on when asked again for what is already playing', () => {
    const sprite = loaded();

    sprite.play(SpriteAnim.Walk);
    sprite.update(SPRITE_TICK * 4);

    const at = sprite.frame;

    // A canvas that plays Walk on every tick of a walk must not redraw
    // the first frame every tick
    sprite.play(SpriteAnim.Walk);
    expect(sprite.frame).toBe(at);

    sprite.play(SpriteAnim.Walk, { restart: true });
    expect(sprite.frame).toBe(0);
  });

  it('pauses where it stands and carries on from there', () => {
    const sprite = loaded();

    sprite.play(SpriteAnim.Walk);
    sprite.update(SPRITE_TICK * 2);
    sprite.pause();

    const at = sprite.frame;

    sprite.update(SPRITE_TICK * 20);
    expect(sprite.frame).toBe(at);
    expect(sprite.paused).toBe(true);

    sprite.resume();
    sprite.update(SPRITE_TICK * 20);
    expect(sprite.paused).toBe(false);

    sprite.stop();
    expect(sprite.frame).toBe(0);
    expect(sprite.paused).toBe(true);
  });

  it('remembers which way it is facing', () => {
    const sprite = loaded();

    sprite.play(SpriteAnim.Walk, { direction: 'UpLeft' });
    expect(sprite.direction).toBe('UpLeft');

    sprite.setDirection('Right');
    expect(sprite.direction).toBe('Right');
  });

  it('says how big a frame is, for whatever is drawn around it', () => {
    const sprite = loaded();

    expect(sprite.frameSize).toEqual({ width: 0, height: 0 });
    expect(sprite.sourceFrameSize).toEqual({ width: 0, height: 0 });

    sprite.play(SpriteAnim.Idle);

    const idle = SAMPLE.sprites[SpriteAnim.Idle]!;

    // What is painted is the trimmed frame; the cell it was drawn in is
    // asked for separately, and the two only agree on a sheet that was
    // never trimmed
    expect(sprite.frameSize).toEqual({ width: idle.frameWidth, height: idle.frameHeight });
    expect(sprite.sourceFrameSize).toEqual({
      width: idle.sourceFrameWidth,
      height: idle.sourceFrameHeight,
    });
    expect(sprite.frameTrim).toEqual(idle.trim);
    expect(sprite.frameSize.width).toBeLessThanOrEqual(sprite.sourceFrameSize.width);
  });

  it('has nothing to draw before a sheet has arrived', () => {
    const sprite = new SpeciesSpriteAnimation('image.png', SAMPLE);

    expect(sprite.ready).toBe(false);
    expect(sprite.playing).toBeNull();
  });
});

describe('where the parts of a pokemon are', () => {
  /**
   * The anchors are the whole reason the description is worth a
   * quarter of a megabyte: they are what lets a canvas put a pokemon
   * on a cell, hang a bar over its head or fly a move at its body
   * without knowing anything about how a frame is drawn
   */
  it('reads the frame the playhead is on, for the direction it faces', () => {
    const sprite = loaded();

    // Nothing is playing yet, so there is no frame to have anchors
    expect(sprite.anchor('shadow')).toBeNull();

    sprite.play(SpriteAnim.Idle, { direction: 'Down' });

    const idle = SAMPLE.sprites[SpriteAnim.Idle]!;
    const down = idle.frames[SPRITE_DIRECTIONS.indexOf('Down') * idle.columns];

    expect(sprite.anchor('shadow')).toEqual(down.shadow);
    expect(sprite.anchor('head')).toEqual(down.head);

    // Turning about reads a different row of the same grid, and the
    // sheets do not agree between rows — a pokemon seen from behind
    // stands differently in its box
    sprite.setDirection('Up');

    const up = idle.frames[SPRITE_DIRECTIONS.indexOf('Up') * idle.columns];

    expect(sprite.anchor('shadow')).toEqual(up.shadow);
  });

  it('places by the body mark the sheet carries', () => {
    const sprite = loaded();

    sprite.play(SpriteAnim.Idle, { direction: 'Down' });

    const idle = SAMPLE.sprites[SpriteAnim.Idle]!;
    const frame = idle.frames[SPRITE_DIRECTIONS.indexOf('Down') * idle.columns];

    expect(frame.center).not.toBeNull();
    expect(sprite.anchor('center')).toEqual(frame.center);
    expect(sprite.anchor('head')).toEqual(frame.head);
    // Which is above where it stands, on every sheet that ships
    expect(sprite.anchor('center')?.[1]).toBeLessThan(sprite.anchor('shadow')?.[1] ?? 0);
  });

  it('falls back to somewhere every frame has', () => {
    // Two markers landing on one pixel leaves whichever was painted
    // last, so a frame can reach the game with no body mark on it. The
    // head and the two hands sit around the body, so their middle is
    // the body however they are arranged
    const head: Point = [4, 2];
    const left: Point = [2, 6];
    const right: Point = [8, 6];
    const data = asSpriteSheetJSON(
      {
        version: 2,
        sheet: { width: 12, height: 12, pictures: [[0, 0, 12, 12]] },
        anims: [{ anim: SpriteAnim.Idle, index: 0, durations: [1] }],
        sprites: [
          {
            anim: SpriteAnim.Idle,
            frameWidth: 12,
            frameHeight: 12,
            columns: 1,
            rows: 1,
            frames: [0, 1],
          },
        ],
      },
      {
        records: [
          { shadow: [5, 11], center: null, head, left, right, cell: 0, flip: false, at: [0, 0] },
        ],
        indices: Uint16Array.from([0]),
      },
    );
    const sprite = loaded(data);

    sprite.play(SpriteAnim.Idle, { direction: 'Down' });

    const marked = [head, left, right];

    expect(sprite.anchor('center')?.[0]).toBeCloseTo(
      marked.reduce((total, point) => total + point[0], 0) / marked.length,
    );
    expect(sprite.anchor('center')?.[1]).toBeCloseTo(
      marked.reduce((total, point) => total + point[1], 0) / marked.length,
    );
  });

  it('ignores a facing a clip has no row for', () => {
    const sprite = loaded();

    // A sleeping pokemon faces nowhere in particular: its grid has one
    // row, and asking it to face away reads that row rather than off
    // the end of the sheet
    expect(sprite.play(SpriteAnim.Sleep, { direction: 'Up' })).toBe(true);
    expect(SAMPLE.sprites[SpriteAnim.Sleep]?.rows).toBe(1);
    expect(sprite.anchor('shadow')).toEqual(SAMPLE.sprites[SpriteAnim.Sleep]?.frames[0].shadow);
  });
});

describe('drawing a pokemon somewhere', () => {
  it('puts the anchor the caller named on the point it gave', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    sprite.play(SpriteAnim.Idle, { direction: 'Down' });

    const scale = 3;
    const shadow = sprite.anchor('shadow');
    // The picture it is stored as, not the cell it was drawn in: the
    // sheet holds each frame cropped to what is lit, and the source
    // rectangle has to be that crop
    const picture = sprite.frameBox;
    const inset = sprite.frameInset;

    sprite.draw(context, 100, 200, { scale, anchor: 'shadow' });

    const [sx, sy, sw, sh, dx, dy, dw, dh] = drawn[0];

    // The picture it took, wherever the packer put it
    expect([sx, sy]).toEqual([picture?.x, picture?.y]);
    expect([sw, sh]).toEqual([picture?.width, picture?.height]);
    expect([dw, dh]).toEqual([(picture?.width ?? 0) * scale, (picture?.height ?? 0) * scale]);
    // And where it put it: the middle of the marked pixel lands on the
    // point, and the picture hangs where its box hangs it
    expect(dx).toBeCloseTo(100 - ((shadow?.[0] ?? 0) + 0.5) * scale + inset[0] * scale);
    expect(dy).toBeCloseTo(200 - ((shadow?.[1] ?? 0) + 0.5) * scale + inset[1] * scale);
  });

  it('answers where anything else on the pokemon landed', () => {
    const sprite = loaded();

    sprite.play(SpriteAnim.Idle, { direction: 'Down' });

    const scale = 2;
    const placement = { scale, anchor: 'center' } as const;

    // The point a sprite is placed by comes back as itself, which is
    // what makes a projectile aimed at a body land on it
    expect(sprite.locate('center', 40, 60, placement)).toEqual([40, 60]);

    const head = sprite.anchor('head');
    const center = sprite.anchor('center');
    const spot = sprite.locate('head', 40, 60, placement);

    expect(spot?.[0]).toBeCloseTo(40 + ((head?.[0] ?? 0) - (center?.[0] ?? 0)) * scale);
    expect(spot?.[1]).toBeCloseTo(60 + ((head?.[1] ?? 0) - (center?.[1] ?? 0)) * scale);
  });

  it('mirrors the anchors along with the picture', () => {
    const sprite = loaded();

    sprite.play(SpriteAnim.Idle, { direction: 'Down' });

    const scale = 2;
    const head = sprite.anchor('head');
    const center = sprite.anchor('center');
    const flipped = sprite.locate('head', 40, 60, { scale, anchor: 'center', flip: true });

    // A pokemon turned around has its head as far the other side of
    // where it stands: the two are the same distance from the anchor,
    // in opposite directions
    expect(flipped?.[0]).toBeCloseTo(40 - ((head?.[0] ?? 0) - (center?.[0] ?? 0)) * scale);
    expect(flipped?.[1]).toBeCloseTo(60 + ((head?.[1] ?? 0) - (center?.[1] ?? 0)) * scale);
  });

  it('keeps the motion the sheet was drawn with', () => {
    const moving = travelling(SAMPLE);

    expect(moving, 'a clip whose anchors travel').toBeDefined();

    const sprite = loaded();
    const { context, drawn } = recorder();

    // The anchors travel with the body, so registering each frame on
    // its own mark would put the drawing back where the last one was
    // and the pokemon would hold still. Registering the clip once — on
    // the pose it rests in — leaves the movement on screen
    sprite.play(moving.anim, { direction: SPRITE_DIRECTIONS[moving.row], restart: true });

    const scale = 2;
    const held = sprite.frameInset;

    sprite.draw(context, 100, 200, { scale, anchor: 'shadow' });

    const first = sprite.anchor('shadow');

    sprite.update(moving.at);

    const moved = sprite.frameInset;

    sprite.draw(context, 100, 200, { scale, anchor: 'shadow' });

    const later = sprite.anchor('shadow');

    expect(sprite.frame, 'the playhead moved on').toBeGreaterThan(0);
    expect(later, 'and the frame it landed on is marked somewhere else').not.toEqual(first);
    // A different frame of the sheet...
    expect(drawn[1][0]).not.toBe(drawn[0][0]);
    // ...whose box is in the same place, which is what makes the
    // difference between the two frames visible. The pictures
    // themselves hang wherever their own crop leaves them
    expect([drawn[1][4] - moved[0] * scale, drawn[1][5] - moved[1] * scale]).toEqual([
      drawn[0][4] - held[0] * scale,
      drawn[0][5] - held[1] * scale,
    ]);
  });

  it('leaves the ground where it was while the pokemon moves over it', () => {
    const moving = travelling(SAMPLE);
    const sprite = loaded();
    const { context, ellipses } = recorder();

    const placement = { scale: 2, anchor: 'shadow' } as const;

    sprite.play(moving.anim, { direction: SPRITE_DIRECTIONS[moving.row], restart: true });
    sprite.drawShadow(context, 100, 200, placement);

    const body = sprite.locate('center', 100, 200, placement);

    sprite.update(moving.at);
    sprite.drawShadow(context, 100, 200, placement);

    // Whatever the body is doing, the patch it stands on is the spot
    // the caller named: ground that rose with a pokemon mid-leap would
    // read as a shadow stuck to its feet
    expect([ellipses[1][0], ellipses[1][1]]).toEqual([100, 200]);
    // The body has moved over it, so a move aimed at the body follows
    // the body rather than the ground
    expect(sprite.locate('center', 100, 200, placement)).not.toEqual(body);
  });

  it('draws the shadow where the pokemon stands, at the size the sheet says', () => {
    const sprite = loaded();
    const { context, ellipses } = recorder();

    sprite.play(SpriteAnim.Idle, { direction: 'Down' });
    sprite.drawShadow(context, 100, 200, { scale: 2, anchor: 'shadow' });

    const [x, y, across, down] = ellipses[0];
    const radius = sprite.shadowRadius(2);

    expect([x, y]).toEqual([100, 200]);
    expect(across).toBeCloseTo(radius.x);
    // Sized off the cell the frame was drawn in, so trimming a
    // wingspan down to a tucked-in pose does not shrink the shadow
    // under it
    expect(across).toBeCloseTo(
      sprite.sourceFrameSize.width * (SAMPLE.shadowSize === 2 ? 0.28 : 0.22) * 2,
    );
    // Flatter than it is wide: it is lying on the ground
    expect(down).toBeLessThan(across);

    // A caller whose ground is laid back under a camera flattens it
    // further, and says so rather than being told
    sprite.drawShadow(context, 100, 200, { scale: 2, anchor: 'shadow', squash: 0.1 });
    expect(ellipses[1][3]).toBeCloseTo(across * 0.1);
  });

  it('draws nothing before there is a sheet or an animation', () => {
    const { context, drawn } = recorder();
    const waiting = new SpeciesSpriteAnimation('image.png', SAMPLE);

    waiting.play(SpriteAnim.Idle);
    waiting.draw(context, 0, 0);

    const ready = loaded();

    ready.draw(context, 0, 0);
    expect(drawn).toEqual([]);
  });
});

describe('where the sheets are', () => {
  /**
   * The tree on disk and the paths the code builds have to agree, and
   * nothing else checks that: a sheet asked for at the wrong path is a
   * 404 the loader swallows on purpose, so the pokemon silently draws
   * as Missingno rather than anything failing.
   *
   * So every file that ships is walked back through the path builders
   * and has to come out as itself
   */
  const COATS: [coat: Coat, file: string, shiny: boolean, female: boolean][] = [
    ['regular', 'regular.png', false, false],
    ['shiny', 'shiny.png', true, false],
    ['female', 'female.png', false, true],
    ['shinyFemale', 'shiny_female.png', true, true],
  ];

  it('builds the path of every file that ships', () => {
    let drawings = 0;

    for (const { region, species } of SHIPPED) {
      const held = new Set(readdirSync(`${ROOT}/${region}/${species}`));
      const folder = `/sprites/pokemon/${region}/${species}`;

      // Filed under its region, which the path builder works out from
      // the dex number rather than being told
      expect(spriteSheetPath(species)).toBe(`${folder}/sheet.json`);
      expect(spriteFramesPath(species)).toBe(`${folder}/frames.bin`);
      expect(held.has('sheet.json'), `${species} is described`).toBe(true);
      expect(held.has('frames.bin'), `${species} has frames`).toBe(true);

      for (const [, file, shiny, female] of COATS) {
        if (!held.has(file)) {
          continue;
        }
        expect(spriteImagePath(species, shiny, female)).toBe(`${folder}/${file}`);
        drawings += 1;
      }
      // Every coat that is there is one of the four, and nothing else
      // in the folder is a drawing
      expect([...held].filter((name) => name.endsWith('.png')).length).toBe(
        COATS.filter(([, file]) => held.has(file)).length,
      );
    }
    expect(drawings).toBeGreaterThan(0);
  });

  it('says which coats a pokemon was drawn in', () => {
    for (const { region, species, data } of DESCRIBED) {
      const held = new Set(readdirSync(`${ROOT}/${region}/${species}`));

      // The description lists them, and the folder has to hold exactly
      // those: a coat listed and not drawn is a request that 404s
      expect(data.coats, `${species} coats`).toEqual(
        COATS.filter(([, file]) => held.has(file)).map(([coat]) => coat),
      );
    }
  });

  it('keeps the coats apart, and shares one description between them', () => {
    expect(spriteImagePath(Species.Bulbasaur)).not.toBe(spriteImagePath(Species.Bulbasaur, true));
    expect(spriteImagePath(Species.Bulbasaur)).not.toBe(
      spriteImagePath(Species.Bulbasaur, false, true),
    );
    // Every coat is packed to one layout, so there is one description
    // for the pokemon rather than one per coat
    expect(spriteSheetPath(Species.Bulbasaur)).toBe('/sprites/pokemon/kanto/1/sheet.json');
    expect(spriteImagePath(Species.Bulbasaur, true, true)).toBe(
      '/sprites/pokemon/kanto/1/shiny_female.png',
    );
  });

  it('lays the sheets out in the order the rows are drawn', () => {
    // Every grid that turns names its rows in the same order, which is
    // the order everything that works out a facing counts in
    for (const { species, data } of DESCRIBED) {
      for (const [name, target] of clipsOf(data)) {
        expect(target.rows, `${species} ${name}`).toBeLessThanOrEqual(SPRITE_DIRECTIONS.length);
      }
    }
  });
});

/**
 * Where a frame is actually read from.
 *
 * A deduped sheet keeps one of every repeated picture, so the source
 * rectangle is no longer the frame's own square in a grid: it is
 * whichever square the frame points at, drawn mirrored where it was
 * kept the other way round. Nothing else about drawing changed, which
 * is why this asks the drawing rather than the description.
 */
describe('drawing from a deduped sheet', () => {
  /** A stub that records what was asked of `drawImage`. */
  function taking(): {
    context: CanvasRenderingContext2D;
    rects: [number, number, number, number][];
    mirrored: () => boolean;
  } {
    const rects: [number, number, number, number][] = [];
    let flipped = false;
    const context = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: (x: number) => {
        if (x < 0) {
          flipped = true;
        }
      },
      beginPath: () => {},
      ellipse: () => {},
      fill: () => {},
      imageSmoothingEnabled: true,
      globalAlpha: 1,
      fillStyle: '',
      drawImage: (_image: unknown, left: number, top: number, width: number, height: number) => {
        rects.push([left, top, width, height]);
      },
    };

    return {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      context: context as unknown as CanvasRenderingContext2D,
      rects,
      mirrored: () => flipped,
    };
  }

  it('reads each frame from the picture it was packed as', () => {
    for (const { species, data } of DESCRIBED.slice(0, 6)) {
      const sprite = loaded(data);
      const [name, target] = clipsOf(data)[0];

      sprite.play(name, { loop: true });

      const { context, rects } = taking();

      sprite.draw(context, 0, 0);
      expect(rects, `${species} ${name} drew once`).toHaveLength(1);

      const [left, top, width, height] = rects[0];
      const picture = data.sheet.pictures[target.frames[0].cell];

      expect(width).toBe(picture.width);
      expect(height).toBe(picture.height);
      expect(left).toBe(picture.x);
      expect(top).toBe(picture.y);
      // And it stays on the sheet
      expect(left + width).toBeLessThanOrEqual(data.sheet.width);
      expect(top + height).toBeLessThanOrEqual(data.sheet.height);
    }
  });

  it('hands a background the same picture it draws itself', () => {
    for (const { species, data } of DESCRIBED) {
      for (const [name, target] of clipsOf(data)) {
        const at = target.frames.findIndex((frame) => frame.flip);

        if (at < 0) {
          continue;
        }
        const sprite = loaded(data);
        const direction = SPRITE_DIRECTIONS[Math.floor(at / target.columns)];

        sprite.play(name, { loop: true, direction });

        const frame = sprite.frameBox;
        const showing = target.frames[Math.floor(at / target.columns) * target.columns];
        const picture = data.sheet.pictures[showing.cell];

        // The same rectangle `draw` reads, and the same answer about
        // whether it is stored the other way round: a background has
        // to turn it over itself
        expect(frame?.x).toBe(picture.x);
        expect(frame?.y).toBe(picture.y);
        expect(frame?.width).toBe(picture.width);
        expect(frame?.mirrored, `${species} ${name} ${direction}`).toBe(
          target.frames[Math.floor(at / target.columns) * target.columns].flip,
        );
        return;
      }
    }
  });

  it('mirrors a frame that was kept the other way round', () => {
    for (const { species, data } of DESCRIBED) {
      for (const [name, target] of clipsOf(data)) {
        const at = target.frames.findIndex((frame) => frame.flip);

        if (at < 0) {
          continue;
        }
        const sprite = loaded(data);
        const direction = SPRITE_DIRECTIONS[Math.floor(at / target.columns)];

        sprite.play(name, { loop: true, direction });

        const { context, mirrored } = taking();

        sprite.draw(context, 0, 0);
        // The row this frame sits in is one the packer kept as a
        // reflection, so drawing it un-flipped is drawing it backwards
        expect(mirrored(), `${species} ${name} ${direction}`).toBe(true);
        return;
      }
    }
  });
});
