import { COMMON_CAST } from '../../data/constants/cast';
import { SpriteAnim } from '../../data/ids/sprite-anims';

/**
 * What a sheet with a hole in it does instead.
 *
 * Every sheet is meant to carry the eleven common clips and most do,
 * but a collection assembled by hand has gaps: a pokemon drawn without
 * an Attack, another without a Hurt. Falling back to Idle draws a
 * pokemon standing perfectly still through its own attack, which reads
 * as the game having stopped rather than as an approximation.
 *
 * So the fallback is Idle **plus a movement**: the body goes where the
 * missing clip would have taken it. A lunge is an attack, a knock back
 * is a hurt, a bounce in place is a hop. The movement is drawn by the
 * field rather than by the sheet, so it costs nothing and works on any
 * pokemon.
 *
 * Only the battle canvas patches sheets this way. Everywhere else a
 * sprite is a picture being looked at, and a picture of a pokemon
 * standing still is a fair picture of it.
 */

/** Every movement that can stand in for a clip the sheet has not got. */
export const SPRITE_SHIMS = ['lunge', 'hop', 'spin', 'knock', 'spring'] as const;

export type SpriteShim = (typeof SPRITE_SHIMS)[number];

/** Which clip is played, and what is done with the body while it runs. */
export interface Shimmed {
  animation: SpriteAnim;
  shim: SpriteShim | null;
  /**
   * Whether the clip is held on one frame rather than played. A Rotate
   * standing in for an Idle is a pokemon turning on the spot if it is
   * allowed to run
   */
  still: boolean;
}

/**
 * Where the body is, against where it stands. Both offsets are shares
 * of the pokemon's own frame, so the same movement reads the same on a
 * Diglett and on an Onix
 */
export interface ShimMotion {
  /** Toward whatever it is facing. Negative is away from it */
  along: number;
  /** Off the ground */
  lift: number;
  /** Turned on the spot, in radians */
  spin: number;
}

/** What stands in for each clip a sheet can be missing. */
const INSTEAD: Partial<Record<SpriteAnim, SpriteShim | null>> = {
  [SpriteAnim.Attack]: 'lunge',
  [SpriteAnim.Hurt]: 'knock',
  [SpriteAnim.Hop]: 'hop',
  [SpriteAnim.Double]: 'spring',
  [SpriteAnim.Rotate]: 'spin',
  // Asleep and walking are both a pokemon that is simply there, so
  // standing about is the whole of the substitute
  [SpriteAnim.Sleep]: null,
  [SpriteAnim.Walk]: null,
};

/** How long one pass of each movement takes, in milliseconds. */
export const SHIM_SPANS: Record<SpriteShim, number> = {
  lunge: 480,
  hop: 520,
  spin: 1200,
  knock: 420,
  spring: 560,
};

/** How far a lunge reaches, in its own frame widths. */
const REACH = 0.55;

/** How high a hop leaves the ground, in its own frame heights. */
const RISE = 0.45;

/** How far a knock carries it back. */
const KNOCK = 0.4;

/** How far a spring swings each way, and how many times it crosses. */
const SWAY = 0.3;
const SWINGS = 3;

/**
 * How much of a knock is the blow. The rest is the pokemon getting its
 * feet back: a hit that returns as slowly as it left is a pokemon
 * swaying rather than one being struck
 */
const SNAP = 0.25;

const STILL: ShimMotion = { along: 0, lift: 0, spin: 0 };

/**
 * Which clip to play for the one that was asked for, and what to do
 * with the body while it runs.
 *
 * `has` is the sheet's own answer, so the decision is made against the
 * sheet in hand rather than against a table of which species owns
 * what, which would be a second copy of the truth and would rot.
 *
 * Standing still is itself a clip a sheet can be missing. Rotate is
 * the one that holds the pokemon at every angle, so its first frame,
 * held, is the pokemon standing the way it was asked to stand
 */
export function shimFor(wanted: SpriteAnim, has: (anim: SpriteAnim) => boolean): Shimmed {
  if (has(wanted)) {
    return { animation: wanted, shim: null, still: false };
  }

  const shim = INSTEAD[wanted] ?? null;

  if (has(SpriteAnim.Idle)) {
    return { animation: SpriteAnim.Idle, shim, still: false };
  }
  if (has(SpriteAnim.Rotate)) {
    return { animation: SpriteAnim.Rotate, shim, still: true };
  }

  // Neither of the two that can stand for standing about. Anything
  // else the sheet carries is a worse picture and *a* picture: a clip
  // that will not play leaves the playhead unset, and a sprite with no
  // playhead draws no body and no shadow, so the pokemon is absent
  // from the fight rather than approximated in it
  const anything = COMMON_CAST.find((name) => has(name));

  return { animation: anything ?? wanted, shim, still: false };
}

/** What each movement looks like, a share of the way through it. */
const MOTIONS: Record<SpriteShim, (held: number) => ShimMotion> = {
  // Out and back on a half sine: fastest leaving, and still for an
  // instant at the far end, which is where the hit lands
  lunge: (held) => ({ along: Math.sin(Math.PI * held) * REACH, lift: 0, spin: 0 }),
  hop: (held) => ({ along: 0, lift: Math.sin(Math.PI * held) * RISE, spin: 0 }),
  // Straight back on the blow and eased home afterwards
  knock: (held) => ({
    along: -KNOCK * (held < SNAP ? held / SNAP : (1 - held) / (1 - SNAP)),
    lift: 0,
    spin: 0,
  }),
  // Side to side, dying away: a spring rather than a wobble that never
  // settles
  spring: (held) => ({
    along: Math.sin(held * Math.PI * 2 * SWINGS) * (1 - held) * SWAY,
    lift: 0,
    spin: 0,
  }),
  spin: (held) => ({ along: 0, lift: 0, spin: held * Math.PI * 2 }),
};

/** Where the body is at this point through the movement. */
export function shimMotion(shim: SpriteShim | null, share: number): ShimMotion {
  if (shim == null) {
    return STILL;
  }
  return MOTIONS[shim](Math.max(0, Math.min(1, share)));
}
