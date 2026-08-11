import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import SpeciesSpriteAnimation, {
  SPRITE_TICK,
  type SpriteSheetData,
  asSpriteSheetData,
} from '../../src/canvas/species-sprite-animation';

/**
 * The real thing: whatever is under `public/sprites` is what the
 * canvases will be handed, so the tests read one rather than a fixture
 * that agrees with the code by construction
 */
function readSheet(path: string): SpriteSheetData {
  return asSpriteSheetData(JSON.parse(readFileSync(path, 'utf8')));
}

/**
 * Species 3 is Bulbasaur — the folders are numbered by species id,
 * so 0, 1 and 2 are Missingno, an egg and a substitute
 */
const BULBASAUR = readSheet('public/sprites/pokemon/3/data.json');

describe('sprite sheet data', () => {
  it('reads a shipped sheet', () => {
    expect(BULBASAUR.sheet.images.length).toBeGreaterThan(0);
    expect(BULBASAUR.anims.anims.length).toBeGreaterThan(0);
  });

  it('fills in what a broken one leaves out rather than throwing', () => {
    const empty = asSpriteSheetData({ anims: { anims: [{}] } });

    expect(empty.sheet.images).toEqual([]);
    expect(empty.anims.anims[0].durations).toEqual([]);
    expect(empty.anims.anims[0].target).toBeUndefined();
  });
});

describe('species sprite animation', () => {
  it('offers every animation the sheet actually holds', () => {
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);

    expect(sprite.has('Idle')).toBe(true);
    expect(sprite.has('Walk')).toBe(true);
    // Nothing has a Nap; asking is how a caller finds out
    expect(sprite.has('Nap')).toBe(false);
    expect(sprite.play('Nap')).toBe(false);
  });

  it('stretches a clip over a window somebody else decided', () => {
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);
    const idle = BULBASAUR.anims.anims.find((anim) => anim.name === 'Idle');
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
    const quick = new SpeciesSpriteAnimation('image.png', BULBASAUR);

    quick.play('Idle', { loop: false, duration: drawn / 2 });
    quick.update(drawn / 2);
    expect(quick.finished).toBe(true);

    // Asked for again with the same window, it keeps its place — a
    // caller playing this every tick of a cast must not restart the
    // clip sixty times a second
    const held = new SpeciesSpriteAnimation('image.png', BULBASAUR);

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
    const plain = new SpeciesSpriteAnimation('image.png', BULBASAUR);

    plain.play('Idle', { loop: false });
    plain.update(drawn);
    expect(plain.finished).toBe(true);
  });

  it('holds each frame for the duration the sheet gives it', () => {
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);
    const idle = BULBASAUR.anims.anims.find((anim) => anim.name === 'Idle');

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
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);

    sprite.play('Idle', { loop: true });
    sprite.update(60_000);

    expect(sprite.finished).toBe(false);
    expect(sprite.paused).toBe(false);
    expect(sprite.frame).toBeGreaterThanOrEqual(0);
  });

  it('holds the last frame of a one-shot and stops there', () => {
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);

    sprite.play('Hurt', { loop: false });
    sprite.update(60_000);

    expect(sprite.finished).toBe(true);
    // Stopped rather than vanished: a fainting pokemon should stay on
    // screen wearing its last frame
    expect(sprite.paused).toBe(true);
  });

  it('carries on when asked again for what is already playing', () => {
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);

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
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);

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
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);

    sprite.play('Walk', { direction: 'up-left' });
    expect(sprite.direction).toBe('up-left');

    sprite.setDirection('right');
    expect(sprite.direction).toBe('right');
  });

  it('says how big a frame is, for whatever is drawn around it', () => {
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);

    expect(sprite.frameSize).toEqual({ width: 0, height: 0 });

    sprite.play('Idle');
    expect(sprite.frameSize.width).toBeGreaterThan(0);
    expect(sprite.frameSize.height).toBeGreaterThan(0);
  });

  it('has nothing to draw before a sheet has arrived', () => {
    const sprite = new SpeciesSpriteAnimation('image.png', BULBASAUR);

    expect(sprite.ready).toBe(false);
    expect(sprite.playing).toBeNull();
  });
});
