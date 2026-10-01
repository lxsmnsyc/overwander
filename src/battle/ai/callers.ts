import { Moves } from '../../data/ids/moves';

/**
 * The moves scored as whatever they call. Whatever applies to the called
 * move is already in that score, so rules that weigh the aim leave these
 * alone rather than count it twice
 */
const CALLERS = new Set<Moves>([
  Moves.Copycat,
  Moves.MirrorMove,
  Moves.MeFirst,
  Moves.SleepTalk,
  Moves.Assist,
  Moves.NaturePower,
]);

export default CALLERS;
