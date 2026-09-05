import AleaRNG from '../../core/alea';
import type { Moves } from '../../data/ids/moves';
import type { Species } from '../../data/ids/species';
import { getEggMoves, getSpeciesData } from '../../data/species';
import { MOVE_LIMIT } from './traits';

/** What it knows when it is met, and what it was hatched knowing */
/**
 * The last four level-up moves the species knows at that level
 */
export function deriveMoves(species: Species, level: number, banned?: Set<Moves>): Moves[] {
  const data = getSpeciesData(species);
  const learned = Object.keys(data.learnSet.level)
    .map(Number)
    .filter((threshold) => threshold <= level)
    .sort((a, b) => a - b)
    .flatMap((threshold) => data.learnSet.level[threshold])
    // Dropped before the four are taken rather than after, so a
    // pokemon barred from one move still comes with four
    .filter((move) => banned?.has(move) !== true);

  /**
   * The same move twice is one move. A learn set lists a move at every
   * level it is offered at — Kadabra is handed Confusion at 1 and
   * again at 16 — and taken as a run that is four slots holding two
   * moves. The **last** of each is kept, so the four are still the
   * four most recently learned
   */
  const unique: Moves[] = [];
  const seen = new Set<Moves>();

  for (let at = learned.length - 1; at >= 0; at--) {
    const move = learned[at];

    if (!seen.has(move)) {
      seen.add(move);
      unique.unshift(move);
    }
  }

  return unique.slice(-MOVE_LIMIT);
}

/**
 * The moves a hatchling knows: what its species has learned by its
 * hatch level, plus one off its line's egg list. The inherited move
 * goes first so it survives the four-move limit — it is the reason to
 * walk an egg at all
 */
export function deriveEggMoves(species: Species, level: number, random: () => number): Moves[] {
  const learned = deriveMoves(species, level);
  const inheritable = getEggMoves(species);

  if (inheritable.length === 0) {
    return learned;
  }

  const inherited = inheritable[Math.floor(random() * inheritable.length)];

  return [inherited, ...learned.filter((move) => move !== inherited)].slice(0, MOVE_LIMIT);
}

/**
 * The stream a fogbow's inherited move is picked from. Its own seed
 * rather than a slice of the trait value, so it takes nothing away
 * from the slices the level, gender, ability and nature already read
 */
export function eggMoveRoll(traitValue: number): () => number {
  const rng = new AleaRNG(`${traitValue}:eggmove`);

  return () => rng.random();
}
