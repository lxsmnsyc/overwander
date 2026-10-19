import { describe, expect, it } from 'vitest';
import { standInFor } from '../../src/canvas/battle/stand-in';
import { COMMON_CAST } from '../../src/data/constants/cast';
import { SpriteAnim } from '../../src/data/ids/sprite-anims';

/** A sheet that carries everything except the named clips. */
function sheet(...without: SpriteAnim[]): (anim: SpriteAnim) => boolean {
  const missing = new Set<SpriteAnim>(without);

  return (anim) => !missing.has(anim);
}

describe('a sheet with a hole in it', () => {
  it('plays the clip it was asked for when the sheet has one', () => {
    for (const anim of COMMON_CAST) {
      expect(standInFor(anim, sheet()), String(anim)).toEqual({ animation: anim, still: false });
    }
  });

  it('stands in with Idle for any clip it has not got', () => {
    for (const missing of [SpriteAnim.Attack, SpriteAnim.Hurt, SpriteAnim.Hop, SpriteAnim.Sleep]) {
      expect(standInFor(missing, sheet(missing)), String(missing)).toEqual({
        animation: SpriteAnim.Idle,
        still: false,
      });
    }
  });

  it('holds a Rotate still where there is no Idle to stand in with', () => {
    expect(standInFor(SpriteAnim.Idle, sheet(SpriteAnim.Idle))).toEqual({
      animation: SpriteAnim.Rotate,
      still: true,
    });
  });

  it('takes any clip at all over drawing nothing', () => {
    // A clip that will not play leaves the playhead unset, and the
    // pokemon is missing from the fight rather than drawn approximately
    const standIn = standInFor(
      SpriteAnim.Attack,
      sheet(SpriteAnim.Attack, SpriteAnim.Idle, SpriteAnim.Rotate),
    );

    expect(standIn).toEqual({ animation: SpriteAnim.Sleep, still: false });
  });

  it('has nothing left to offer for a sheet that carries nothing', () => {
    expect(standInFor(SpriteAnim.Attack, () => false).animation).toBe(SpriteAnim.Attack);
  });
});
