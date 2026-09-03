import { SpriteAnim } from '../ids/sprite-anims';

/**
 * What a pokemon looks like it is doing while it uses a move.
 *
 * A sprite sheet is a set of named clips, and the sheets are not all
 * the same. Six of them are the **bare minimum**, which a sheet cannot
 * be drawn at all without; four more make up the ten a renderer may
 * assume; the rest are there or not depending on what the pokemon was
 * drawn doing. A Machop has a Punch; a Magikarp does not.
 *
 * So a move does not name one animation, it names a **preference**:
 * an ordered list read left to right, and the first clip the sprite
 * actually has is the one that plays. A Fire Punch asks for `Punch`
 * and settles for `Attack`; a Blizzard asks for `Emit`, then `Shoot`,
 * then `Charge`. That way a move can be given the animation it
 * deserves without every sprite having to own it.
 *
 * The last entry of every list is a **common** clip, so the walk
 * always ends somewhere — see the registry test, which checks it of
 * every registered move rather than trusting each entry to remember
 */

/**
 * The clips a sheet cannot be put on screen without: standing, acting,
 * moving, sleeping, being hit, and getting off the ground.
 *
 * They are the floor every other clip falls to. A sheet short of one of
 * these is unfinished art rather than a pokemon drawn differently, and
 * the collection says which sheets those are: see `missing` in
 * `compact/index.json` there
 */
export const MINIMUM_CAST = [
  SpriteAnim.Idle,
  SpriteAnim.Attack,
  SpriteAnim.Walk,
  SpriteAnim.Sleep,
  SpriteAnim.Hurt,
  SpriteAnim.Hop,
] as const;

/**
 * The clips a renderer may assume: the six above, and the four more
 * that every finished sheet carries. A list ending in one of these can
 * never run out of fallbacks
 */
export const COMMON_CAST = [
  SpriteAnim.Idle,
  SpriteAnim.Sleep,
  SpriteAnim.Hurt,
  SpriteAnim.Attack,
  SpriteAnim.Charge,
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
  // Was one of the common ones, and is not: the Clefairy and Togepi
  // lines were drawn throwing nothing
  SpriteAnim.Shoot,
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
  SpriteAnim.Appeal,
  SpriteAnim.Chop,
  SpriteAnim.Hover,
  SpriteAnim.Rumble,
  SpriteAnim.Sound,
  SpriteAnim.FlapAround,
  SpriteAnim.TailWhip,
  SpriteAnim.Scratch,
  SpriteAnim.CarefulWalk,
  SpriteAnim.RaiseArms,
  SpriteAnim.Sing,
  SpriteAnim.Yawn,
  SpriteAnim.Slap,
] as const;

export type MinimumCast = (typeof MINIMUM_CAST)[number];
export type CommonCast = (typeof COMMON_CAST)[number];
export type UncommonCast = (typeof UNCOMMON_CAST)[number];

/**
 * Every clip a move may ask for
 */
export type CastAnimation = CommonCast | UncommonCast;

export const CAST_ANIMATIONS: CastAnimation[] = [...COMMON_CAST, ...UNCOMMON_CAST];

const MINIMUM = new Set<SpriteAnim>(MINIMUM_CAST);
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
 * Whether the clip is one of the six a sheet cannot be drawn without.
 * A sheet missing one of these is worth saying so about; a sheet
 * missing one of the other four is drawn a little plainer
 */
export function isMinimumCast(animation: SpriteAnim): boolean {
  return MINIMUM.has(animation);
}

/**
 * The clip every sheet has and nothing can be missing: what a walk
 * ends on when a caller hands over a list of things this sprite has
 * never heard of. It is one of the six, as is the Idle behind it
 */
export const DEFAULT_CAST: MinimumCast = SpriteAnim.Attack;

/**
 * The first clip in the list this sprite actually has.
 *
 * `has` is the sprite's own answer, `SpeciesSpriteAnimation.has`, so
 * the decision is made against the sheet in hand rather than against a
 * table of which species owns what, which would be a second copy of
 * the truth and would rot
 */
export function pickCast(
  cast: readonly CastAnimation[],
  has: (anim: SpriteAnim) => boolean,
): SpriteAnim {
  for (const animation of cast) {
    if (has(animation)) {
      return animation;
    }
  }
  // Named rather than checked. A sheet without even this is a sheet
  // with a hole in it, and a hole is the shim's business: it stands in
  // with Idle and moves the body the way the missing clip would have
  return DEFAULT_CAST;
}
