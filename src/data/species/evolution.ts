import { Items } from '../ids/items';
import { EvolutionMethod, type Species } from '../ids/species';
import { type EvolutionData, getSpeciesData } from './__create';

/**
 * The conditions the game can actually verify today. Everything else
 * — friendship, weather, party composition — has no stored
 * counterpart yet, so an evolution requiring it is never offered
 * rather than silently treated as met
 */
export const SUPPORTED_METHODS =
  EvolutionMethod.Level |
  EvolutionMethod.UsedItem |
  EvolutionMethod.HeldItem |
  EvolutionMethod.Trade;

/**
 * What an evolution check is measured against: the catch's level,
 * the items its owner carries (for an item used on it, and for the
 * Linking Cord that stands in for a trade), the items the catch itself
 * holds, and whether it has ever changed hands
 */
export interface EvolutionContext {
  level: number;
  carried: ReadonlySet<Items>;
  held: ReadonlySet<Items>;
  /**
   * Whether this pokemon has been traded — the catch's own `traded`
   * field.
   *
   * The mainline evolves one **during** the trade, which is a moment
   * this game has nowhere to put: an evolution here is something a
   * player asks for from the catch sheet. So a trade opens the
   * evolution rather than performing it, and the record carries the
   * fact for good — a Machoke traded once is a Machamp waiting to be
   * asked, whatever happens to it afterwards
   */
  traded: boolean;
}

/**
 * Whether one evolution's every condition is met. An evolution whose
 * method carries a flag outside SUPPORTED_METHODS fails here even if
 * its other conditions hold — the unverifiable part cannot be waved
 * through
 */
export function meetsEvolutionCriteria(
  evolution: EvolutionData,
  context: EvolutionContext,
): boolean {
  const { method } = evolution;

  if (method === 0 || (method & ~SUPPORTED_METHODS) !== 0) {
    return false;
  }
  /**
   * An Everstone answers every evolution at once, and it answers
   * here rather than at the moment of evolving so that the catch
   * sheet stops offering what the stone would refuse. The pokemon is
   * not held back from anything else: it levels, it learns, it
   * fights — it simply stays what it is
   */
  if (context.held.has(Items.Everstone)) {
    return false;
  }
  if ((method & EvolutionMethod.Level) !== 0) {
    if (evolution.level == null || context.level < evolution.level) {
      return false;
    }
  }
  if ((method & EvolutionMethod.UsedItem) !== 0) {
    if (evolution.item == null || !context.carried.has(evolution.item)) {
      return false;
    }
  }
  if ((method & EvolutionMethod.HeldItem) !== 0) {
    if (evolution.item == null || !context.held.has(evolution.item)) {
      return false;
    }
  }
  if ((method & EvolutionMethod.Trade) !== 0 && !context.traded && !pullsCord(evolution, context)) {
    return false;
  }
  return true;
}

/**
 * Whether a Linking Cord is standing in for the trade this evolution
 * asks for: the pokemon has never changed hands and its owner is
 * carrying one.
 *
 * A line asking for a used item as well is left out, because it would
 * then want two items spent and an evolution spends one. No registered
 * line asks for both; the day one does it keeps needing a real trade
 * rather than quietly taking the cord and charging for the stone
 */
function pullsCord(evolution: EvolutionData, context: EvolutionContext): boolean {
  return (
    (evolution.method & EvolutionMethod.UsedItem) === 0 && context.carried.has(Items.LinkingCord)
  );
}

/**
 * Whether the species has nothing left to become.
 *
 * It is asked of the species rather than of a catch, so it says
 * nothing about whether *this* pokemon could evolve today — a
 * Charmander is not fully evolved whatever its level or the bag it is
 * carrying. It is what "still growing" means to an Eviolite, and what
 * a demo means by wanting a field of finished pokemon
 */
export function isFullyEvolved(species: Species): boolean {
  return (getSpeciesData(species).evolvesInto ?? []).length === 0;
}

/**
 * Every evolution the species can take right now, in data order
 */
export function getAvailableEvolutions(
  species: Species,
  context: EvolutionContext,
): EvolutionData[] {
  const evolutions = getSpeciesData(species).evolvesInto ?? [];

  return evolutions.filter((evolution) => meetsEvolutionCriteria(evolution, context));
}

/**
 * The item this evolution spends, if any. Only a used item is
 * consumed: a held item stays with the pokemon.
 *
 * A trade evolution asked for by a pokemon that has never changed
 * hands spends a Linking Cord instead. It is answered from `traded`
 * alone rather than from a whole context, because the caller reads the
 * bag for whatever comes back from here and cannot know what to read
 * until it does
 */
export function getConsumedItem(evolution: EvolutionData, traded = false): Items | null {
  const { method } = evolution;

  if ((method & EvolutionMethod.UsedItem) !== 0) {
    return evolution.item ?? null;
  }
  if ((method & EvolutionMethod.Trade) !== 0 && !traded) {
    return Items.LinkingCord;
  }
  return null;
}
