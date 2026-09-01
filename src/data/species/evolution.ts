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
 * What an evolution check is measured against: the catch itself, its
 * level, the items its owner carries (for an item used on it, and for
 * the Linking Cord that stands in for a trade), the items it holds,
 * and the handover it has already been through
 */
export interface EvolutionContext {
  /**
   * What it is now. A handover is measured against it, so the check
   * can tell a Machoke that was traded from a Machoke that was traded
   * as a Machop
   */
  species: Species;
  level: number;
  carried: ReadonlySet<Items>;
  held: ReadonlySet<Items>;
  /**
   * Whether a handover has already met the condition a trade
   * evolution asks for.
   *
   * The mainline evolves one **during** the trade, which is a moment
   * this game has nowhere to put: an evolution here is something a
   * player asks for from the catch sheet. So a handover opens the
   * evolution rather than performing it, and the answer is worked out
   * once, there, by `opensTradeEvolution`
   */
  canEvolve: boolean;
}

/**
 * Whether a handover of this species, against whatever came the other
 * way, opens one of its trade evolutions. Asked at the handover, and
 * the answer is the whole of what the record keeps.
 *
 * Two questions, and a bare "has been traded" answers neither. It has
 * to have changed hands **as what it is now**: four Gen 1 lines evolve
 * by trade and every one of them sits a level evolution above the
 * stage that is usually traded, so a Machop passed between two players
 * and then levelled is a Machoke nobody ever traded. And where the
 * evolution names a partner it has to be **what came back**, which is
 * a fact about somebody else's pokemon and the only one of its kind in
 * the family.
 *
 * One answer covers every trade evolution a species has, which is
 * enough while no species has two of them
 */
export function opensTradeEvolution(species: Species, partner: Species | null): boolean {
  return (getSpeciesData(species).evolvesInto ?? []).some((evolution) =>
    coversHandover(evolution, partner),
  );
}

/**
 * Whether this one evolution is what the handover covered. Split out
 * so the partner rule can be read on its own: nothing registered
 * names a partner yet, so the line above can never exercise it
 */
export function coversHandover(evolution: EvolutionData, partner: Species | null): boolean {
  return (
    (evolution.method & EvolutionMethod.Trade) !== 0 &&
    (evolution.partner == null || evolution.partner === partner)
  );
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
  if (
    (method & EvolutionMethod.Trade) !== 0 &&
    !context.canEvolve &&
    !pullsCord(evolution, context)
  ) {
    return false;
  }
  return true;
}

/**
 * Whether a Linking Cord is standing in for the trade this evolution
 * asks for: its owner is carrying one.
 *
 * A line asking for a used item as well is left out, because it would
 * then want two items spent and an evolution spends one. No registered
 * line asks for both; the day one does it keeps needing a real trade
 * rather than quietly taking the cord and charging for the stone.
 *
 * A line naming a **partner** is left out for a different reason: a
 * cord replaces the handover, and what a Karrablast is waiting for is
 * not a handover but a Shelmet. Nothing in a bag is one
 */
function pullsCord(evolution: EvolutionData, context: EvolutionContext): boolean {
  return (
    evolution.partner == null &&
    (evolution.method & EvolutionMethod.UsedItem) === 0 &&
    context.carried.has(Items.LinkingCord)
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
 * Every evolution the catch can take right now, in data order. The
 * species is the context's, since a handover is measured against it
 */
export function getAvailableEvolutions(context: EvolutionContext): EvolutionData[] {
  const evolutions = getSpeciesData(context.species).evolvesInto ?? [];

  return evolutions.filter((evolution) => meetsEvolutionCriteria(evolution, context));
}

/**
 * The item this evolution spends, if any. Only a used item is
 * consumed: a held item stays with the pokemon.
 *
 * A trade evolution whose handover does not cover it spends a Linking
 * Cord instead. It is answered from that one fact rather than from a
 * whole context, because the caller reads the bag for whatever comes
 * back from here and cannot know what to read until it does — see
 * `opensTradeEvolution` for who works the fact out
 */
export function getConsumedItem(evolution: EvolutionData, covered = false): Items | null {
  const { method } = evolution;

  if ((method & EvolutionMethod.UsedItem) !== 0) {
    return evolution.item ?? null;
  }
  if ((method & EvolutionMethod.Trade) !== 0 && !covered) {
    return Items.LinkingCord;
  }
  return null;
}
