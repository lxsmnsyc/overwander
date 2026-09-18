import { Moves } from '../ids/moves';

/**
 * The moves that are danced rather than thrown.
 *
 * The mainline marks these with a flag of their own, which is what a
 * Dancer copies and what Petilil's line shares with the pokemon
 * standing beside it. Kept as data so the engine and anything that
 * reads a move's shape cannot disagree about what counts as a dance
 */
export const DANCE_MOVES = new Set<Moves>([
  Moves.DragonDance,
  Moves.FeatherDance,
  Moves.LunarDance,
  Moves.PetalDance,
  Moves.QuiverDance,
  Moves.SwordsDance,
  Moves.TeeterDance,
]);

export function isDanceMove(move: Moves): boolean {
  return DANCE_MOVES.has(move);
}
