import { Moves } from '../ids/moves';

/**
 * Moves a boss is never staged with.
 *
 * **Transform** copies a player, which throws away the raid-sized
 * health pool the fight is built around. **Metronome**, **Mirror
 * Move** and **Mimic** are each a way back to it, so banning them is
 * simpler than teaching three kinds of copy what a boss may not
 * become.
 *
 * It is data rather than engine: the list is filtered out of the
 * boss' learnset as the raid is staged, which happens where a raid is
 * written down rather than where one is fought
 */
const BANNED_BOSS_MOVES = new Set<Moves>([
  Moves.Transform,
  Moves.Metronome,
  Moves.MirrorMove,
  Moves.Mimic,
]);

export default BANNED_BOSS_MOVES;
