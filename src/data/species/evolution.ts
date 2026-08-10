import type { Items } from '../ids/items';
import { EvolutionMethod, type Species } from '../ids/species';
import { type EvolutionData, getSpeciesData } from './__create';

/**
 * The conditions the game can actually verify today. Everything else
 * — trades, friendship, weather, party composition — has no stored
 * counterpart yet, so an evolution requiring it is never offered
 * rather than silently treated as met
 */
export const SUPPORTED_METHODS =
  EvolutionMethod.Level | EvolutionMethod.UsedItem | EvolutionMethod.HeldItem;

/**
 * What an evolution check is measured against: the catch's level,
 * the items its owner carries (for an item used on it) and the items
 * the catch itself holds
 */
export interface EvolutionContext {
  level: number;
  carried: ReadonlySet<Items>;
  held: ReadonlySet<Items>;
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
  return true;
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
 * consumed — a held item stays with the pokemon
 */
export function getConsumedItem(evolution: EvolutionData): Items | null {
  if ((evolution.method & EvolutionMethod.UsedItem) === 0) {
    return null;
  }
  return evolution.item ?? null;
}
