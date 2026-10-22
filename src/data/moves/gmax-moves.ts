import { Types } from '../constants/types';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import { FIXED_G_MAX_MOVES, GMAX_SPECIES } from '../battle';
import { maxPowerOf } from './max-moves';

/**
 * The G-Max Moves: what a Gigantamax throws in place of the Max Move
 * of one type. The battle side is in `src/battle/gimmicks/dynamax/gmax-moves.ts`
 * https://bulbapedia.bulbagarden.net/wiki/G-Max_Move
 *
 * Which species throws which, and the three with a fixed power, are
 * `src/data/battle/gmax.yaml`
 */
export { FIXED_G_MAX_MOVES, GMAX_SPECIES };

/** Every G-Max Move. None of them is learned, copied, called or remembered */
export const G_MAX_MOVES = new Set<Moves>();

for (const { move } of GMAX_SPECIES.values()) {
  G_MAX_MOVES.add(move);
}

/** Whether a species has a Gigantamax form, which is what Max Mushrooms ask */
export function canGigantamax(species: Species): boolean {
  return GMAX_SPECIES.has(species);
}

/**
 * The G-Max Move a Gigantamax of this species throws for a damaging
 * move of this type, or null where its Max Move stays the plain one
 */
export function getGMaxMove(species: Species, type: Types): Moves | null {
  const entry = GMAX_SPECIES.get(species);

  return entry?.type === type ? entry.move : null;
}

/**
 * What a G-Max Move hits with for the move it replaces: the Max Move
 * table, so the two never disagree. No move known at all reads as the
 * table's lowest
 */
export function gMaxPowerOf(base: Moves | undefined, type: Types): number {
  if (base != null) {
    return maxPowerOf(base);
  }
  return type === Types.Fighting || type === Types.Poison ? 70 : 90;
}
