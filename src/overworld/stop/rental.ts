import AleaRNG from '../../core/alea';
import {
  FRONTIER_RENTAL_OFFER,
  FRONTIER_TEAM_SIZE,
  getRentalPool,
} from '../../data/overworld/experts';
import type { Species } from '../../data/ids/species';
import {
  TYPE_EFFECTIVENESS,
  TYPE_EFFECTIVENESS_FACTOR,
  type Types,
} from '../../data/constants/types';
import { getSpeciesData } from '../../data/species';
import type { Spawn } from '../chunk-snapshot';

/** The Factory crate, the hand drawn out of it, and the party the Dome answers with */
/**
 * The six the Factory lays out for one challenge.
 *
 * Derived from the stop rather than stored: the dialog that offers
 * them and the server that fields them run the same roll, so what is
 * on the table cannot be rerolled by walking away and back, and a
 * pick is an index into a list both sides already agree on
 */
export function rentalOffer(stop: string): Spawn[] {
  const rng = new AleaRNG(`${stop}:rental`);
  const pool = getRentalPool();

  return Array.from({ length: FRONTIER_RENTAL_OFFER }, (): Spawn => [
    pool[Math.floor(rng.random() * pool.length)],
    rng.int32(),
    rng.int32(),
  ]);
}

/**
 * The three a challenger took off the table, or null for a hand that
 * is not three distinct ones off it. The picks are indexes into
 * `rentalOffer`, which is what a rented fight carries instead of
 * catch ids
 */
export function rentedHand(stop: string, picks: string[]): Spawn[] | null {
  const offer = rentalOffer(stop);
  const at = picks.map(Number);

  if (at.length !== FRONTIER_TEAM_SIZE || new Set(at).size !== at.length) {
    return null;
  }
  if (at.some((one) => !Number.isInteger(one) || one < 0 || one >= offer.length)) {
    return null;
  }
  return at.map((one) => offer[one]);
}

/**
 * How hard one set of types hits another: the best any of them
 * manages against the whole combination, so a pokemon is weighed by
 * the type it would actually reach for
 */
function bestFactor(attacking: Types[], defending: Types[]): number {
  let best = 0;

  for (const type of attacking) {
    let factor = 1;

    for (const against of defending) {
      const effect = TYPE_EFFECTIVENESS[type][against];

      if (effect != null) {
        factor *= TYPE_EFFECTIVENESS_FACTOR[effect];
      }
    }
    best = Math.max(best, factor);
  }
  return best;
}

/**
 * The three the Dome answers a named party with.
 *
 * One per pokemon brought, weighed both ways round: what it does to
 * that pokemon, less what that pokemon does back. Nobody is picked
 * twice, so three answers come out however alike the three they are
 * answering, and the seed is the stop, so the fight restages as the
 * fight it was
 */
export function counterParty(stop: string, against: Species[]): Spawn[] {
  const rng = new AleaRNG(`${stop}:counter`);
  const pool = getRentalPool();
  const taken = new Set<Species>();
  const party: Spawn[] = [];

  for (const target of against) {
    const theirs = getSpeciesData(target).types;
    let best: Species[] = [];
    let highest = 0;

    for (const species of pool) {
      if (taken.has(species)) {
        continue;
      }

      const mine = getSpeciesData(species).types;
      const score = bestFactor(mine, theirs) - bestFactor(theirs, mine);

      if (best.length === 0 || score > highest) {
        best = [species];
        highest = score;
      } else if (score === highest) {
        best.push(species);
      }
    }

    // Nothing left in the crate to answer with, which only happens
    // once the pool is smaller than the party
    if (best.length === 0) {
      break;
    }

    const picked = best[Math.floor(rng.random() * best.length)];

    taken.add(picked);
    party.push([picked, rng.int32(), rng.int32()]);
  }
  return party;
}
