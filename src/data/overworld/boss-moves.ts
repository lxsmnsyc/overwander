import { Types } from '../constants/types';
import { Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import { getSpeciesData } from '../species';

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
 * **Bide** returns double everything it was dealt while it channels,
 * and a lobby is up to ten parties: the harder the raid hits, the
 * more certainly the answer wipes it. **Belly Drum** and a Ghost's
 * **Curse** each cost half the pool, and the pool is the fight's
 * clock, so both hand the party half the raid.
 *
 * **Rest** is the one heal still barred. A boss may put back an
 * eighth of its pool, which is what the other heals are worth to it
 * now, but Rest buys that eighth with a sleep the boss inflicted on
 * itself, so it lands in full: the party gets the fight handed to it
 * while the boss lies there.
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
  Moves.Bide,
  Moves.BellyDrum,
  Moves.Rest,
  // TODO: temporary. A boss is already immune to Perishing, so the
  // song costs it a move slot and does nothing. Drop this line when
  // there is something for it to do
  Moves.PerishSong,
]);

/**
 * What a boss is barred from on top of the list, by what it is.
 *
 * Curse is two moves in one entry: a Ghost pays half its health to
 * lay it, and anything else takes the stages instead. Only the first
 * is a problem, so only a Ghost is refused it
 */
export function getBannedBossMoves(species: Species): Set<Moves> {
  if (!getSpeciesData(species).types.includes(Types.Ghost)) {
    return BANNED_BOSS_MOVES;
  }
  return new Set([...BANNED_BOSS_MOVES, Moves.Curse]);
}

export default BANNED_BOSS_MOVES;
