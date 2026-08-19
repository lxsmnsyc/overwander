import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SpeciesSpriteAnimation, { SPRITE_TICK } from '../../src/canvas/species-sprite-animation';
import { spriteImagePath, spriteMetaPath } from '../../src/canvas/species-sprites';
import asSpriteSheetJSON, {
  type Point,
  SPRITE_DIRECTIONS,
  type SpriteSheetJSON,
} from '../../src/canvas/sprite-sheet';
import { Species } from '../../src/data/ids/species';

/**
 * The real thing: whatever is under `public/sprites` is what the
 * canvases will be handed, so the tests read one rather than a fixture
 * that agrees with the code by construction.
 *
 * A pokemon ships as `regular/{species}.png`, `shiny/{species}.png` and
 * one `meta/{species}.json` describing the animation both coats share.
 * The species id is its dex number — Bulbasaur is 1 — except for
 * Missingno, an egg and a substitute, which are numbered past a hundred
 * thousand because they are not pokemon and have no dex number of their
 * own
 */
const META_ROOT = 'public/sprites/pokemon/meta';

function speciesOf(file: string): number {
  return Number(file.slice(0, -'.json'.length));
}

const META_FILES = readdirSync(META_ROOT)
  .filter((name) => name.endsWith('.json'))
  .sort((a, b) => speciesOf(a) - speciesOf(b));

/**
 * The descriptions that ship, in species order.
 *
 * A file with nothing in it is one the sprite pipeline has not written
 * yet, and it is left out rather than failed on: an empty description
 * is a pokemon the game draws as Missingno, which is exactly what the
 * loader does with it
 */
const DESCRIBED: { species: number; data: SpriteSheetJSON }[] = META_FILES.map((name) => ({
  species: speciesOf(name),
  raw: readFileSync(`${META_ROOT}/${name}`, 'utf8'),
}))
  .filter((entry) => entry.raw.trim().length > 0)
  .map((entry) => ({
    species: entry.species,
    data: asSpriteSheetJSON(JSON.parse(entry.raw) as unknown),
  }));

const SAMPLE = DESCRIBED[0].data;

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
function travelling(data: SpriteSheetJSON): { anim: string; row: number; at: number } {
  for (const anim of data.anims.anims) {
    const target = data.sprites[anim.target];

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
      expect(data.sheet.images.length, `${species} sub-images`).toBeGreaterThan(0);
      expect(data.anims.anims.length, `${species} animations`).toBeGreaterThan(0);
      expect(Object.keys(data.sprites).length, `${species} anchor grids`).toBeGreaterThan(0);
    }
  });

  it('gives every animation a grid on the sheet and anchors to go with it', () => {
    for (const { species, data } of DESCRIBED) {
      const images = new Map(data.sheet.images.map((image) => [image.name, image]));

      for (const anim of data.anims.anims) {
        const packed = images.get(anim.target);

        expect(packed, `${species} ${anim.name} is packed`).toBeDefined();

        const target = data.sprites[anim.target];

        expect(target, `${species} ${anim.name} has anchors`).toBeDefined();
        // One entry per frame of every orientation, and the durations
        // say how many frames that is
        expect(target.frames.length, `${species} ${anim.target} frames`).toBe(
          target.rows * target.columns,
        );
        expect(target.directions.length, `${species} ${anim.target} rows`).toBe(target.rows);
        expect(anim.durations.length, `${species} ${anim.name} durations`).toBe(target.columns);
        // The grid on the sheet is cut at the size the frames are
        // actually stored at, which on a compact sheet is the trimmed
        // one
        expect(packed?.width, `${species} ${anim.target} grid width`).toBe(
          target.columns * target.frameWidth,
        );
        expect(packed?.height, `${species} ${anim.target} grid height`).toBe(
          target.rows * target.frameHeight,
        );
        // `anims` stays faithful to the file it came from, so its sizes
        // are the untrimmed ones however the sheet was packed
        expect(anim.frameWidth, `${species} ${anim.name} source width`).toBe(
          target.sourceFrameWidth,
        );
        expect(anim.frameHeight, `${species} ${anim.name} source height`).toBe(
          target.sourceFrameHeight,
        );
      }
    }
  });

  it('trims frames into the cell they were drawn in', () => {
    for (const { species, data } of DESCRIBED) {
      for (const [name, target] of Object.entries(data.sprites)) {
        expect(target.frameWidth, `${species} ${name} width`).toBeLessThanOrEqual(
          target.sourceFrameWidth,
        );
        expect(target.frameHeight, `${species} ${name} height`).toBeLessThanOrEqual(
          target.sourceFrameHeight,
        );
        // The trimmed frame sits inside the cell, so putting it back
        // where it came from cannot fall off the edge
        expect(target.trim[0] + target.frameWidth).toBeLessThanOrEqual(target.sourceFrameWidth);
        expect(target.trim[1] + target.frameHeight).toBeLessThanOrEqual(target.sourceFrameHeight);

        if (!data.compact) {
          expect(target.trim, `${species} ${name} untrimmed`).toEqual([0, 0]);
        }
      }
    }
  });

  it('marks where the parts of a pokemon are, on every frame', () => {
    // Gathered and asserted once rather than asserted per frame: every
    // sheet's every frame is thousands of expectations, and the check
    // costs more in bookkeeping than in reading the files
    const missing: string[] = [];
    const escaped: string[] = [];

    for (const { species, data } of DESCRIBED) {
      for (const [name, target] of Object.entries(data.sprites)) {
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
    const empty = asSpriteSheetJSON({
      anims: { anims: [{ name: 'Idle' }] },
      sprites: { Idle: { frameWidth: 24, frameHeight: 32 } },
    });

    expect(empty.sheet.images).toEqual([]);
    expect(empty.anims.anims[0].durations).toEqual([]);
    // An animation with no target of its own plays from the grid named
    // after it
    expect(empty.anims.anims[0].target).toBe('Idle');
    expect(empty.sprites.Idle.frames).toEqual([]);
    expect(asSpriteSheetJSON(null).anims.anims).toEqual([]);
    // A description that says nothing about trimming describes an
    // untrimmed sheet, so its frames are their own source cells
    expect(empty.compact).toBe(false);
    expect(empty.sprites.Idle.trim).toEqual([0, 0]);
    expect(empty.sprites.Idle.sourceFrameWidth).toBe(24);
    expect(empty.sprites.Idle.sourceFrameHeight).toBe(32);
  });
});

describe('species sprite animation', () => {
  it('offers every animation the sheet actually holds', () => {
    const sprite = loaded();

    expect(sprite.has('Idle')).toBe(true);
    expect(sprite.has('Walk')).toBe(true);
    // Nothing has a Nap; asking is how a caller finds out
    expect(sprite.has('Nap')).toBe(false);
    expect(sprite.play('Nap')).toBe(false);
  });

  it('stretches a clip over a window somebody else decided', () => {
    const sprite = loaded();
    const idle = SAMPLE.anims.anims.find((anim) => anim.name === 'Idle');
    const drawn = (idle?.durations ?? []).reduce(
      (total, held) => total + Math.max(1, held) * SPRITE_TICK,
      0,
    );

    expect(drawn).toBeGreaterThan(0);

    // A cast is as long as the move's priority makes it, and the clip
    // is whatever length it was drawn at. Stretched, the two agree:
    // one pass fills the window exactly, whatever the two lengths are
    const window = drawn * 4;

    expect(sprite.play('Idle', { loop: false, duration: window })).toBe(true);

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

    quick.play('Idle', { loop: false, duration: drawn / 2 });
    quick.update(drawn / 2);
    expect(quick.finished).toBe(true);

    // Asked for again with the same window, it keeps its place — a
    // caller playing this every tick of a cast must not restart the
    // clip sixty times a second
    const held = loaded();

    held.play('Idle', { loop: false, duration: window });
    held.update(window / 2);
    held.play('Idle', { loop: false, duration: window });
    held.update(window / 2);
    expect(held.finished).toBe(true);

    // ...and asked for again once it has run out, `restart` gives it
    // a fresh pass over a fresh window. That is what the next step of
    // a multi-step move is
    held.play('Idle', { loop: false, duration: window, restart: true });
    expect(held.finished).toBe(false);
    held.update(window - 1);
    expect(held.finished).toBe(false);
    held.update(1);
    expect(held.finished).toBe(true);

    // Left out, a clip plays at the speed it was drawn at
    const plain = loaded();

    plain.play('Idle', { loop: false });
    plain.update(drawn);
    expect(plain.finished).toBe(true);
  });

  it('holds each frame for the duration the sheet gives it', () => {
    const sprite = loaded();
    const idle = SAMPLE.anims.anims.find((anim) => anim.name === 'Idle');

    expect(idle).toBeDefined();
    expect(sprite.play('Idle')).toBe(true);
    expect(sprite.frame).toBe(0);

    // One tick short of the first frame's end is still the first frame
    sprite.update((idle?.durations[0] ?? 0) * SPRITE_TICK - 1);
    expect(sprite.frame).toBe(0);

    sprite.update(1);
    expect(sprite.frame).toBe(1);
  });

  it('loops back round, so an idle pokemon idles for ever', () => {
    const sprite = loaded();

    sprite.play('Idle', { loop: true });
    sprite.update(60_000);

    expect(sprite.finished).toBe(false);
    expect(sprite.paused).toBe(false);
    expect(sprite.frame).toBeGreaterThanOrEqual(0);
  });

  it('holds the last frame of a one-shot and stops there', () => {
    const sprite = loaded();

    sprite.play('Hurt', { loop: false });
    sprite.update(60_000);

    expect(sprite.finished).toBe(true);
    // Stopped rather than vanished: a fainting pokemon should stay on
    // screen wearing its last frame
    expect(sprite.paused).toBe(true);
  });

  it('carries on when asked again for what is already playing', () => {
    const sprite = loaded();

    sprite.play('Walk');
    sprite.update(SPRITE_TICK * 4);

    const at = sprite.frame;

    // A canvas that plays Walk on every tick of a walk must not redraw
    // the first frame every tick
    sprite.play('Walk');
    expect(sprite.frame).toBe(at);

    sprite.play('Walk', { restart: true });
    expect(sprite.frame).toBe(0);
  });

  it('pauses where it stands and carries on from there', () => {
    const sprite = loaded();

    sprite.play('Walk');
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

    sprite.play('Walk', { direction: 'UpLeft' });
    expect(sprite.direction).toBe('UpLeft');

    sprite.setDirection('Right');
    expect(sprite.direction).toBe('Right');
  });

  it('says how big a frame is, for whatever is drawn around it', () => {
    const sprite = loaded();

    expect(sprite.frameSize).toEqual({ width: 0, height: 0 });
    expect(sprite.sourceFrameSize).toEqual({ width: 0, height: 0 });

    sprite.play('Idle');

    const idle = SAMPLE.sprites.Idle;

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

    sprite.play('Idle', { direction: 'Down' });

    const idle = SAMPLE.sprites.Idle;
    const down = idle.frames[idle.directions.indexOf('Down') * idle.columns];

    expect(sprite.anchor('shadow')).toEqual(down.shadow);
    expect(sprite.anchor('head')).toEqual(down.head);

    // Turning about reads a different row of the same grid, and the
    // sheets do not agree between rows — a pokemon seen from behind
    // stands differently in its box
    sprite.setDirection('Up');

    const up = idle.frames[idle.directions.indexOf('Up') * idle.columns];

    expect(sprite.anchor('shadow')).toEqual(up.shadow);
  });

  it('falls back to somewhere every frame has', () => {
    const sprite = loaded();

    sprite.play('Idle', { direction: 'Down' });

    const shadow = sprite.anchor('shadow');
    const head = sprite.anchor('head');
    const center = sprite.anchor('center');
    const idle = SAMPLE.sprites.Idle;
    const frame = idle.frames[idle.directions.indexOf('Down') * idle.columns];

    expect(shadow).not.toBeNull();
    expect(head).not.toBeNull();
    // No sheet marks the body centre yet, so it is the middle of the
    // parts that are marked: the head and the two hands, which sit
    // around the body rather than on it
    expect(frame.center).toBeNull();

    // Said as a type guard rather than left to be inferred: a plain
    // `!= null` filter still hands back an array that might hold one,
    // and the average below reads into every point it is given
    const marked = [frame.head, frame.left, frame.right].filter(
      (point): point is Point => point != null,
    );

    expect(marked.length).toBe(3);
    expect(center?.[0]).toBeCloseTo(
      marked.reduce((total, point) => total + point[0], 0) / marked.length,
    );
    expect(center?.[1]).toBeCloseTo(
      marked.reduce((total, point) => total + point[1], 0) / marked.length,
    );
    // Which is above where it stands, on every sheet that ships
    expect(center?.[1]).toBeLessThan(shadow?.[1] ?? 0);
  });

  it('ignores a facing a clip has no row for', () => {
    const sprite = loaded();

    // A sleeping pokemon faces nowhere in particular: its grid has one
    // row, and asking it to face away reads that row rather than off
    // the end of the sheet
    expect(sprite.play('Sleep', { direction: 'Up' })).toBe(true);
    expect(SAMPLE.sprites.Sleep.rows).toBe(1);
    expect(sprite.anchor('shadow')).toEqual(SAMPLE.sprites.Sleep.frames[0].shadow);
  });
});

describe('drawing a pokemon somewhere', () => {
  it('puts the anchor the caller named on the point it gave', () => {
    const sprite = loaded();
    const { context, drawn } = recorder();

    sprite.play('Idle', { direction: 'Down' });

    const scale = 3;
    const shadow = sprite.anchor('shadow');
    // The size it is stored at, not the cell it was drawn in: a
    // compact sheet holds the frames cropped, and the source rectangle
    // has to be the crop
    const { width, height } = sprite.frameSize;

    sprite.draw(context, 100, 200, { scale, anchor: 'shadow' });

    const [sx, sy, sw, sh, dx, dy, dw, dh] = drawn[0];
    const image = SAMPLE.sheet.images.find((entry) => entry.name === 'Idle');

    // The frame it took: the first column of the first row of the Idle
    // grid, wherever the packer put that grid
    expect([sx, sy]).toEqual([image?.x, image?.y]);
    expect([sw, sh]).toEqual([width, height]);
    expect([dw, dh]).toEqual([width * scale, height * scale]);
    // And where it put it: the middle of the marked pixel lands on the
    // point, so the rest of the frame hangs off wherever that leaves it
    expect(dx).toBeCloseTo(100 - ((shadow?.[0] ?? 0) + 0.5) * scale);
    expect(dy).toBeCloseTo(200 - ((shadow?.[1] ?? 0) + 0.5) * scale);
  });

  it('answers where anything else on the pokemon landed', () => {
    const sprite = loaded();

    sprite.play('Idle', { direction: 'Down' });

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

    sprite.play('Idle', { direction: 'Down' });

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
    sprite.draw(context, 100, 200, { scale: 2, anchor: 'shadow' });

    const first = sprite.anchor('shadow');

    sprite.update(moving.at);
    sprite.draw(context, 100, 200, { scale: 2, anchor: 'shadow' });

    const later = sprite.anchor('shadow');

    expect(sprite.frame, 'the playhead moved on').toBeGreaterThan(0);
    expect(later, 'and the frame it landed on is marked somewhere else').not.toEqual(first);
    // A different frame of the sheet...
    expect(drawn[1][0]).not.toBe(drawn[0][0]);
    // ...drawn in the same place, which is what makes the difference
    // between the two frames visible
    expect([drawn[1][4], drawn[1][5]]).toEqual([drawn[0][4], drawn[0][5]]);
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

    sprite.play('Idle', { direction: 'Down' });
    sprite.drawShadow(context, 100, 200, { scale: 2, anchor: 'shadow' });

    const [x, y, across, down] = ellipses[0];
    const radius = sprite.shadowRadius(2);

    expect([x, y]).toEqual([100, 200]);
    expect(across).toBeCloseTo(radius.x);
    // Sized off the cell the frame was drawn in, so trimming a
    // wingspan down to a tucked-in pose does not shrink the shadow
    // under it
    expect(across).toBeCloseTo(
      sprite.sourceFrameSize.width * (SAMPLE.anims.shadowSize === 2 ? 0.28 : 0.22) * 2,
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

    waiting.play('Idle');
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
   * and has to come out as itself. That is what makes moving the tree —
   * the sheets are `{species}.png` beside each other now, rather than a
   * folder each with an `image.png` in it — something the tests notice
   */
  it('builds the path of every drawing that ships', () => {
    for (const [coat, shiny] of [
      ['regular', false],
      ['shiny', true],
    ] as const) {
      const files = readdirSync(`public/sprites/pokemon/${coat}`).filter((name) =>
        name.endsWith('.png'),
      );

      expect(files.length, `${coat} drawings should ship`).toBeGreaterThan(0);

      for (const file of files) {
        // A drawing suffixed `_f` is the female form of the same
        // species, not a species of its own
        const name = file.slice(0, -'.png'.length);
        const female = name.endsWith('_f');
        const species = Number(female ? name.slice(0, -'_f'.length) : name);

        expect(spriteImagePath(species, shiny, female)).toBe(`/sprites/pokemon/${coat}/${file}`);
      }
    }
  });

  it('describes every drawing that ships exactly once', () => {
    const described = new Set(META_FILES.map(speciesOf));

    for (const coat of ['regular', 'shiny']) {
      for (const file of readdirSync(`public/sprites/pokemon/${coat}`)) {
        const name = file.slice(0, -'.png'.length);
        const species = Number(name.endsWith('_f') ? name.slice(0, -'_f'.length) : name);

        // Every drawing of a species is a drawing of the one
        // animation — two coats, and a female form where there is one
        // — so the description is none of theirs: it is the species'
        expect(described.has(species), `${coat}/${file} has a description`).toBe(true);
        expect(spriteMetaPath(species)).toBe(`/sprites/pokemon/meta/${species}.json`);
      }
    }
  });

  it('keeps the two coats, and the two forms, apart', () => {
    expect(spriteImagePath(Species.Bulbasaur)).not.toBe(spriteImagePath(Species.Bulbasaur, true));
    expect(spriteImagePath(Species.Bulbasaur)).not.toBe(
      spriteImagePath(Species.Bulbasaur, false, true),
    );
    // ...and both of them share the one description
    expect(spriteMetaPath(Species.Bulbasaur)).toBe('/sprites/pokemon/meta/1.json');
  });

  it('lays the sheets out in the order the rows are drawn', () => {
    // Every grid that turns names its rows in the same order, which is
    // the order everything that works out a facing counts in
    for (const { species, data } of DESCRIBED) {
      for (const [name, target] of Object.entries(data.sprites)) {
        expect(target.directions, `${species} ${name}`).toEqual(
          SPRITE_DIRECTIONS.slice(0, target.rows),
        );
      }
    }
  });
});
