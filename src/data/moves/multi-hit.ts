import { MULTI_HIT_MOVES, type MultiHitConfig } from '../battle';
import type { Moves } from '../ids/moves';

export { MULTI_HIT_MOVES };
export type { MultiHitConfig };

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
