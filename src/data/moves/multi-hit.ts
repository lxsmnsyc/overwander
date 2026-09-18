import { Moves } from '../ids/moves';

/**
 * How many times a move strikes, and how often that is worth.
 *
 * The table is data rather than mechanics because two sides read it:
 * [`src/battle/moves/multi-hit.ts`](../../battle/moves/multi-hit.ts)
 * throws the strikes, and the expert builder prices a move at what all
 * of them come to rather than at one. Kept in one place so the two
 * cannot disagree about how many times anything lands
 */
export interface MultiHitConfig {
  min: number;
  max: number;
  /**
   * Each strike lands harder than the last, by its own number: a
   * Triple Kick's third kick is three times the first
   */
  escalating?: boolean;
}

/**
 * Moves that strike several times in one use. Each strike is a full
 * attack, so per-hit secondary effects (e.g. Twineedle's poison) roll
 * on every strike.
 */
export const MULTI_HIT_MOVES: { [key in Moves]?: MultiHitConfig } = {
  [Moves.FuryAttack]: { min: 2, max: 5 },
  [Moves.PinMissile]: { min: 2, max: 5 },
  [Moves.Twineedle]: { min: 2, max: 2 },
  [Moves.DoubleHit]: { min: 2, max: 2 },
  [Moves.FurySwipes]: { min: 2, max: 5 },
  [Moves.DoubleKick]: { min: 2, max: 2 },
  [Moves.DoubleSlap]: { min: 2, max: 5 },
  [Moves.SpikeCannon]: { min: 2, max: 5 },
  [Moves.Barrage]: { min: 2, max: 5 },
  [Moves.Bonemerang]: { min: 2, max: 2 },
  [Moves.CometPunch]: { min: 2, max: 5 },
  [Moves.BoneRush]: { min: 2, max: 5 },
  [Moves.TripleKick]: { min: 3, max: 3, escalating: true },
  // However many of the party pile in, which Beat Up works out itself
  [Moves.BeatUp]: { min: 1, max: 6 },
  [Moves.ArmThrust]: { min: 2, max: 5 },
  [Moves.BulletSeed]: { min: 2, max: 5 },
  [Moves.IcicleSpear]: { min: 2, max: 5 },
  [Moves.RockBlast]: { min: 2, max: 5 },
  [Moves.DualChop]: { min: 2, max: 2 },
  [Moves.GearGrind]: { min: 2, max: 2 },
  [Moves.TailSlap]: { min: 2, max: 5 },
};

/** What the 2-5 distribution below averages out at */
const EXPECTED_HITS = 3.1;

/**
 * How many times a multi-hit move is expected to land, for anything
 * weighing the move before it is cast. One for everything else, so a
 * caller can multiply by it unconditionally
 */
export function estimateMoveHits(move: Moves, everyStrike = false): number {
  const config = MULTI_HIT_MOVES[move];

  if (config == null) {
    return 1;
  }
  if (config.min === config.max) {
    return config.min;
  }
  // Skill Link lands the lot, which is the whole of what it is for
  return everyStrike ? config.max : EXPECTED_HITS;
}
