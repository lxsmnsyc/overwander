import { Moves } from '../ids/moves';

/**
 * The signature moves only the Move Tutor teaches. No machine is sold
 * or handed out for one, and he teaches it only to a pokemon at the
 * most friendship it can have
 */
export const TUTOR_ONLY_MOVES = new Set<Moves>([
  Moves.DragonAscent,
  Moves.SecretSword,
  Moves.RelicSong,
]);

export function isTutorOnlyMove(move: Moves): boolean {
  return TUTOR_ONLY_MOVES.has(move);
}
