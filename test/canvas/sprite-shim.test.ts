import { describe, expect, it } from 'vitest';
import { SPRITE_SHIMS, shimFor, shimMotion } from '../../src/canvas/battle/sprite-shim';
import { COMMON_CAST } from '../../src/data/constants/cast';
import { SpriteAnim } from '../../src/data/ids/sprite-anims';

/**
 * A sheet with a hole in it plays the clip it has and moves the body
 * the way the missing one would have. So what these check is that the
 * substitution is made, that the movement is a movement rather than a
 * constant, and that it starts and ends where the pokemon stands.
 */

/** A sheet that carries everything except the named clips. */
function sheet(...without: SpriteAnim[]): (anim: SpriteAnim) => boolean {
  const missing = new Set<SpriteAnim>(without);

  return (anim) => !missing.has(anim);
}

describe('a sheet with a hole in it', () => {
  it('plays the clip it was asked for when the sheet has one', () => {
    for (const anim of COMMON_CAST) {
      const shimmed = shimFor(anim, sheet());

      expect(shimmed.animation, String(anim)).toBe(anim);
      expect(shimmed.shim, String(anim)).toBeNull();
      expect(shimmed.still, String(anim)).toBe(false);
    }
  });

  it('stands in with Idle, and moves the body the way the clip would have', () => {
    const patched: [missing: SpriteAnim, shim: string | null][] = [
      [SpriteAnim.Attack, 'lunge'],
      [SpriteAnim.Hurt, 'knock'],
      [SpriteAnim.Hop, 'hop'],
      [SpriteAnim.Double, 'spring'],
      [SpriteAnim.Rotate, 'spin'],
      // Asleep and walking are both a pokemon that is simply there
      [SpriteAnim.Sleep, null],
      [SpriteAnim.Walk, null],
    ];

    for (const [missing, shim] of patched) {
      const shimmed = shimFor(missing, sheet(missing));

      expect(shimmed.animation, String(missing)).toBe(SpriteAnim.Idle);
      expect(shimmed.shim, String(missing)).toBe(shim);
      expect(shimmed.still, String(missing)).toBe(false);
    }
  });

  it('holds a Rotate still where there is no Idle to stand in with', () => {
    const shimmed = shimFor(SpriteAnim.Idle, sheet(SpriteAnim.Idle));

    expect(shimmed.animation).toBe(SpriteAnim.Rotate);
    expect(shimmed.still).toBe(true);
    // Standing still is what it is doing, so nothing moves it
    expect(shimmed.shim).toBeNull();
  });

  it('still moves the body when the stand-in is a held Rotate', () => {
    const shimmed = shimFor(SpriteAnim.Attack, sheet(SpriteAnim.Attack, SpriteAnim.Idle));

    expect(shimmed.animation).toBe(SpriteAnim.Rotate);
    expect(shimmed.still).toBe(true);
    expect(shimmed.shim).toBe('lunge');
  });

  it('takes any clip at all over drawing nothing', () => {
    // A clip that will not play leaves the playhead unset, and a
    // sprite with no playhead draws no body and no shadow: the pokemon
    // is missing from the fight rather than drawn approximately
    const shimmed = shimFor(
      SpriteAnim.Attack,
      sheet(SpriteAnim.Attack, SpriteAnim.Idle, SpriteAnim.Rotate),
    );

    expect(shimmed.animation).toBe(SpriteAnim.Sleep);
    expect(shimmed.shim).toBe('lunge');
    expect(shimmed.still).toBe(false);
  });

  it('has nothing left to offer for a sheet that carries nothing', () => {
    const shimmed = shimFor(SpriteAnim.Attack, () => false);

    expect(shimmed.animation).toBe(SpriteAnim.Attack);
  });
});

describe('the movement that stands in for a clip', () => {
  it('starts and ends where the pokemon stands', () => {
    for (const shim of SPRITE_SHIMS) {
      for (const at of [0, 1]) {
        const motion = shimMotion(shim, at);

        expect(motion.along, `${shim} at ${at}`).toBeCloseTo(0);
        expect(motion.lift, `${shim} at ${at}`).toBeCloseTo(0);
      }
    }
  });

  it('is somewhere else in the middle of every one of them', () => {
    // A movement that never leaves the spot is a pokemon standing
    // still, which is the thing this exists to avoid
    for (const shim of SPRITE_SHIMS) {
      const motion = shimMotion(shim, 0.5);
      const moved = Math.abs(motion.along) + Math.abs(motion.lift) + Math.abs(motion.spin);

      expect(moved, shim).toBeGreaterThan(0);
    }
  });

  it('goes forward to attack and backward to be hurt', () => {
    expect(shimMotion('lunge', 0.5).along).toBeGreaterThan(0);
    expect(shimMotion('knock', 0.25).along).toBeLessThan(0);
    // The blow is quick and the recovery is not: a hit that comes back
    // as slowly as it left reads as swaying rather than being struck
    expect(shimMotion('knock', 0.25).along).toBeLessThan(shimMotion('knock', 0.6).along);
  });

  it('lifts a hop off the ground without moving it along', () => {
    const motion = shimMotion('hop', 0.5);

    expect(motion.lift).toBeGreaterThan(0);
    expect(motion.along).toBe(0);
  });

  it('swings a spring both ways and settles it', () => {
    const swung: number[] = [];

    for (let step = 0; step <= 20; step += 1) {
      swung.push(shimMotion('spring', step / 20).along);
    }
    expect(Math.max(...swung)).toBeGreaterThan(0);
    expect(Math.min(...swung)).toBeLessThan(0);
    // Dying away rather than swinging on for ever
    expect(Math.abs(swung[18])).toBeLessThan(Math.abs(swung[2]));
  });

  it('turns a spin the whole way round and no further', () => {
    expect(shimMotion('spin', 0).spin).toBe(0);
    expect(shimMotion('spin', 0.5).spin).toBeCloseTo(Math.PI);
    expect(shimMotion('spin', 1).spin).toBeCloseTo(Math.PI * 2);
  });

  it('holds still for a clip the sheet actually has', () => {
    expect(shimMotion(null, 0.5)).toEqual({ along: 0, lift: 0, spin: 0 });
  });

  it('clamps a share that ran past its window', () => {
    expect(shimMotion('lunge', 2)).toEqual(shimMotion('lunge', 1));
    expect(shimMotion('lunge', -1)).toEqual(shimMotion('lunge', 0));
  });
});
