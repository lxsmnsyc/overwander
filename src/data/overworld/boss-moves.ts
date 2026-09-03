import { Moves } from '../ids/moves';

/**
 * Moves a boss is never staged with.
 *
 * **Transform** copies a player, which throws away the raid-sized
 * health pool the fight is built around. **Metronome**, **Mirror
 * Move**, **Mimic** and **Sketch** are each a way back to it, so
 * banning them is simpler than teaching four kinds of copy what a
 * boss may not become.
 *
 * The rest are moves a raid pool breaks. **Pain Split** averages the
 * two, and a boss pays the half it gives away while the half that
 * would come back is refused as a heal. **Baton Pass** looks for a
 * bench a lone boss does not have. **Destiny Bond** takes whoever
 * lands the last hit down with it, which taxes the party for winning
 * rather than making the fight harder.
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
  Moves.Sketch,
  Moves.PainSplit,
  Moves.BatonPass,
  Moves.DestinyBond,
  // TODO: temporary. A boss is already immune to Perishing, so the
  // song costs it a move slot and does nothing. Drop this line when
  // there is something for it to do
  Moves.PerishSong,
]);

export default BANNED_BOSS_MOVES;
