import { SpriteAnim } from '../ids/sprite-anims';

/**
 * What a pokemon looks like it is doing while it uses a move.
 *
 * A sprite sheet is a set of named clips, and the sheets are not all
 * the same: every one of them carries the eleven **common** clips, and
 * the rest are there or not depending on what the pokemon was drawn
 * doing. A Machop has a Punch; a Magikarp does not.
 *
 * So a move does not name one animation, it names a **preference**:
 * an ordered list read left to right, and the first clip the sprite
 * actually has is the one that plays. A Fire Punch asks for `Punch`
 * and settles for `Attack`; a Blizzard asks for `Emit`, then `Shoot`,
 * then `Attack`. That way a move can be given the animation it
 * deserves without every sprite having to own it.
 *
 * The last entry of every list is a **common** clip, so the walk
 * always ends somewhere — see the registry test, which checks it of
 * every registered move rather than trusting each entry to remember
 */

/**
 * The clips every sprite sheet carries. A list ending in one of these
 * can never run out of fallbacks
 */
export const COMMON_CAST = [
  SpriteAnim.Idle,
  SpriteAnim.Sleep,
  SpriteAnim.Hurt,
  SpriteAnim.Attack,
  SpriteAnim.Charge,
  SpriteAnim.Shoot,
  SpriteAnim.Double,
  SpriteAnim.Hop,
  SpriteAnim.Rotate,
  SpriteAnim.Walk,
  SpriteAnim.Swing,
] as const;

/**
 * The clips a sheet may or may not carry. Asking for one is free —
 * a sheet without it falls through to the next name in the list
 */
export const UNCOMMON_CAST = [
  SpriteAnim.Slice,
  SpriteAnim.SpAttack,
  SpriteAnim.Shock,
  SpriteAnim.QuickStrike,
  SpriteAnim.Strike,
  SpriteAnim.Jab,
  SpriteAnim.Punch,
  SpriteAnim.Kick,
  SpriteAnim.MultiStrike,
  SpriteAnim.Slam,
  SpriteAnim.Withdraw,
  SpriteAnim.Twirl,
  SpriteAnim.RearUp,
  SpriteAnim.Shake,
  SpriteAnim.Lick,
  SpriteAnim.Dance,
  SpriteAnim.Uppercut,
  SpriteAnim.Gas,
  SpriteAnim.Stomp,
  SpriteAnim.Emit,
  SpriteAnim.Swell,
  SpriteAnim.Ricochet,
  SpriteAnim.MultiScratch,
  SpriteAnim.Bite,
] as const;

export type CommonCast = (typeof COMMON_CAST)[number];
export type UncommonCast = (typeof UNCOMMON_CAST)[number];

/**
 * Every clip a move may ask for
 */
export type CastAnimation = CommonCast | UncommonCast;

export const CAST_ANIMATIONS: CastAnimation[] = [...COMMON_CAST, ...UNCOMMON_CAST];

const COMMON = new Set<SpriteAnim>(COMMON_CAST);

/**
 * The clips drawn as something a pokemon **keeps doing** rather than
 * as one gesture: standing about, walking, shivering, gathering itself
 * for a move.
 *
 * They are played at the speed they were drawn at and repeated for as
 * long as they are wanted. Stretched over a window instead — the way a
 * swing is, so that it lands exactly when the move does — a loop comes
 * out as one movement in slow motion, which reads as the game hanging
 */
const LOOPING = new Set<SpriteAnim>([
  SpriteAnim.Charge,
  SpriteAnim.Sleep,
  SpriteAnim.Hurt,
  SpriteAnim.Walk,
  SpriteAnim.Idle,
  SpriteAnim.Shake,
  SpriteAnim.Dance,
  SpriteAnim.Rotate,
]);

/**
 * Whether the clip is one that repeats rather than one that is fitted
 * to however long the thing playing it has to fill
 */
export function isLoopingCast(animation: SpriteAnim): boolean {
  return LOOPING.has(animation);
}

/**
 * Whether the clip is one every sheet carries, which is what makes it
 * a valid last resort
 */
export function isCommonCast(animation: SpriteAnim): boolean {
  return COMMON.has(animation);
}

/**
 * The clip every sheet has and nothing can be missing: what a walk
 * ends on when a caller hands over a list of things this sprite has
 * never heard of
 */
export const DEFAULT_CAST: CommonCast = SpriteAnim.Attack;

/**
 * What stands in for a clip the sheet has not got.
 *
 * A move's list is a preference between *different things to look
 * like*: a Blizzard asks for Emit, settles for Shoot, and would rather
 * not be an Attack. That is the right shape for choosing between
 * clips, and the wrong shape for a sheet with a hole in it — falling
 * off the end of a list lands on Idle, and a pokemon standing still
 * through its own attack looks broken rather than looks approximate.
 *
 * `Shoot` is the one that needs this. It is nominally common, so lists
 * end on it and stop looking, but a sheet or two ships without it —
 * see `100001` — and every one of those moves then plays nothing. An
 * Attack in its place is the wrong distance and the right idea
 */
const CAST_INSTEAD: Partial<Record<CastAnimation, CastAnimation>> = {
  [SpriteAnim.Shoot]: SpriteAnim.Attack,
};

/**
 * The first clip in the list this sprite actually has.
 *
 * `has` is the sprite's own answer — `SpeciesSpriteAnimation.has` —
 * so the decision is made against the sheet in hand rather than
 * against a table of which species owns what, which would be a second
 * copy of the truth and would rot.
 *
 * A name the sheet is missing is tried once more as whatever stands in
 * for it **before** the walk moves on, so a hole in a sheet costs the
 * move its first choice rather than costing it the whole list
 */
export function pickCast(
  cast: readonly CastAnimation[],
  has: (anim: SpriteAnim) => boolean,
): SpriteAnim {
  for (const animation of cast) {
    if (has(animation)) {
      return animation;
    }

    const instead = CAST_INSTEAD[animation];

    if (instead != null && has(instead)) {
      return instead;
    }
  }
  return has(DEFAULT_CAST) ? DEFAULT_CAST : SpriteAnim.Idle;
}
