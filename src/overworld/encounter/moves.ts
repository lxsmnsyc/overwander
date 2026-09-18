import AleaRNG from '../../core/alea';
import type { Moves } from '../../data/ids/moves';
import type { Species } from '../../data/ids/species';
import { getBaseSpecies, getEggMoves, getSpeciesData, getTeachableMoves } from '../../data/species';
import { MOVE_LIMIT } from './traits';

/** What it knows when it is met, and what it was hatched knowing */
/**
 * The last four level-up moves the species knows at that level
 */
export function deriveMoves(species: Species, level: number, banned?: Set<Moves>): Moves[] {
  const data = getSpeciesData(species);
  const thresholds: number[] = [];

  for (const key of Object.keys(data.learnSet.level)) {
    const threshold = Number(key);

    if (threshold <= level) {
      thresholds.push(threshold);
    }
  }
  thresholds.sort((a, b) => a - b);

  const learned: Moves[] = [];

  for (const threshold of thresholds) {
    for (const move of data.learnSet.level[threshold]) {
      // Dropped before the four are taken rather than after, so a
      // pokemon barred from one move still comes with four
      if (banned?.has(move) !== true) {
        learned.push(move);
      }
    }
  }

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
 * How much room a fogbow hands over, out of one roll: two some of the
 * time, one rather more often, and nothing the rest of it
 */
export function bonusMoveSlots(roll: number, chance: number, second: number, most: number): number {
  if (roll < second) {
    return most;
  }
  return roll < chance ? 1 : 0;
}

/**
 * Everything the line could be taught or could have inherited but has
 * not learned by this level: an egg move is as likely as a machine
 * one, which is what makes the extra room a surprise.
 *
 * A line lists its egg moves on the stage it hatches at, so the base
 * stage is what is asked: an evolution has none of its own
 */
function fillableMoves(species: Species, known: Moves[]): Moves[] {
  const held = new Set(known);
  const left: Moves[] = [];

  for (const move of new Set([
    ...getEggMoves(getBaseSpecies(species)),
    ...getTeachableMoves(species),
  ])) {
    if (!held.has(move)) {
      left.push(move);
    }
  }
  return left;
}

/**
 * What a meeting under a fogbow walks out knowing: its own four, and
 * one or two more it would otherwise have had to be bred or taught
 * for. The extras go last, since nothing has to be given up for them
 */
export function deriveBonusMoves(
  species: Species,
  level: number,
  random: () => number,
  slots: number,
): Moves[] {
  const learned = deriveMoves(species, level);

  if (slots < 1) {
    return learned;
  }

  const moves = [...learned];
  const left = fillableMoves(species, learned);

  for (let taken = 0; taken < slots && left.length > 0; taken += 1) {
    const [move] = left.splice(Math.floor(random() * left.length), 1);

    moves.push(move);
  }
  return moves;
}

/**
 * The stream a fogbow's extra moves are drawn from. Its own seed
 * rather than a slice of the trait value, so it takes nothing away
 * from the slices the level, gender, ability and nature already read
 */
export function bonusMoveRoll(traitValue: number): () => number {
  const rng = new AleaRNG(`${traitValue}:bonusmoves`);

  return () => rng.random();
}
