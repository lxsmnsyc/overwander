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
  'Idle',
  'Sleep',
  'Hurt',
  'Attack',
  'Charge',
  'Shoot',
  'Double',
  'Hop',
  'Rotate',
  'Walk',
  'Swing',
] as const;

/**
 * The clips a sheet may or may not carry. Asking for one is free —
 * a sheet without it falls through to the next name in the list
 */
export const UNCOMMON_CAST = [
  'SpAttack',
  'Shock',
  'QuickStrike',
  'Strike',
  'Jab',
  'Punch',
  'Kick',
  'MultiStrike',
  'Slam',
  'Withdraw',
  'Twirl',
  'RearUp',
  'Shake',
  'Lick',
  'Dance',
  'Uppercut',
  'Gas',
  'Stomp',
  'Emit',
  'Swell',
  'Ricochet',
  'MultiScratch',
  'Bite',
] as const;

export type CommonCast = (typeof COMMON_CAST)[number];
export type UncommonCast = (typeof UNCOMMON_CAST)[number];

/**
 * Every clip a move may ask for
 */
export type CastAnimation = CommonCast | UncommonCast;

export const CAST_ANIMATIONS: CastAnimation[] = [...COMMON_CAST, ...UNCOMMON_CAST];

const COMMON = new Set<string>(COMMON_CAST);

/**
 * Whether the clip is one every sheet carries, which is what makes it
 * a valid last resort
 */
export function isCommonCast(animation: string): boolean {
  return COMMON.has(animation);
}

/**
 * The clip every sheet has and nothing can be missing: what a walk
 * ends on when a caller hands over a list of things this sprite has
 * never heard of
 */
export const DEFAULT_CAST: CommonCast = 'Attack';

/**
 * The first clip in the list this sprite actually has.
 *
 * `has` is the sprite's own answer — `SpeciesSpriteAnimation.has` —
 * so the decision is made against the sheet in hand rather than
 * against a table of which species owns what, which would be a second
 * copy of the truth and would rot
 */
export function pickCast(cast: readonly CastAnimation[], has: (name: string) => boolean): string {
  for (const animation of cast) {
    if (has(animation)) {
      return animation;
    }
  }
  return has(DEFAULT_CAST) ? DEFAULT_CAST : 'Idle';
}
