import { Items } from '../ids/items';
import type { Species } from '../ids/species';
import { GENERAL_STAT_BOOSTERS } from './stat-boosters';
import { MARKET_GEAR } from './gear';
import { ORBS } from './orbs';
import { TYPE_BOOSTERS } from './type-boosters';
import { getSpeciesData } from '../species/__create';
import { getSpeciesHeldItems } from '../species/held-items';
import { isFullyEvolved } from '../species/evolution';

/**
 * What an expert's pokemon fights carrying.
 *
 * A gym leader and everybody above them hand their party gear, which
 * is most of what separates their six from the same six met in the
 * grass. What each one carries is its own rather than the trainer's:
 * a Pikachu on a gym team holds the Light Ball because it is a
 * Pikachu, not because of whose team it is on.
 *
 * The ranking is read off the wild held-item table, which already
 * says what each species is worth carrying, narrowed to the things
 * that do something in a fight. A Chansey's rare slot is a Lucky Egg
 * and a Gengar's is a Smoke Ball: worth having, worth nothing here.
 */

/**
 * The items that double a stat for one species and do nothing at all
 * for anybody else. Nothing beats one of these for the species it
 * belongs to, so nothing is put in front of one
 */
const SPECIES_RELICS = new Set<Items>([
  Items.LightBall,
  Items.ThickClub,
  Items.MetalPowder,
  Items.QuickPowder,
  Items.LuckyPunch,
  Items.Stick,
]);

/**
 * The gear that acts in a fight but never in this one. A Smoke Ball
 * buys a way out of a wild meeting and nothing leaves a trainer
 * battle; the rest hand the other side an advantage, which is what
 * they are for and not what an expert wants
 */
const NOT_FOR_A_TRAINER = new Set<Items>([
  Items.SmokeBall,
  Items.IronBall,
  Items.LaggingTail,
  Items.RingTarget,
  Items.DestinyKnot,
  Items.FloatStone,
  Items.BindingBand,
  Items.GripClaw,
]);

/** The gear an expert may hand out: everything that acts in a fight. */
const BATTLE_HELD = new Set<Items>([
  ...TYPE_BOOSTERS.keys(),
  ...[...MARKET_GEAR.keys()].filter((item) => !NOT_FOR_A_TRAINER.has(item)),
  ...GENERAL_STAT_BOOSTERS.keys(),
  ...ORBS.keys(),
  ...SPECIES_RELICS,
  Items.Leftovers,
]);

export function isBattleHeldItem(item: Items): boolean {
  return BATTLE_HELD.has(item);
}

/**
 * Everything this species could sensibly be handed, best first: its
 * own held table richest slot down, then Eviolite where it still has
 * somewhere to evolve to, then a booster for each of its types, and
 * gear that suits anybody for the slots nothing else fills
 */
function preferences(species: Species): Items[] {
  const held = getSpeciesHeldItems(species);
  const boosters = getSpeciesData(species).types.flatMap((type) =>
    [...TYPE_BOOSTERS].filter(([, boosted]) => boosted === type).map(([item]) => item),
  );

  const own = [held?.rare, held?.uncommon, held?.common].filter(
    (item): item is Items => item != null,
  );

  return [
    // A relic of its own beats everything, since it is worth nothing
    // in any other hands and a great deal in these
    ...own.filter((item) => SPECIES_RELICS.has(item)),
    // Then the thing that answers being half-grown. A middle stage on
    // an expert's team is there because the trainer is known for it,
    // so it is worth propping up
    ...(isFullyEvolved(species) ? [] : [Items.Eviolite]),
    // Then the rest of its own table, richest slot down
    ...own,
    ...boosters,
    // And then what suits anybody, for the tiers that hand out more
    // gear than a species has anything of its own to fill
    Items.Leftovers,
    Items.LifeOrb,
    Items.FocusBand,
  ];
}

/**
 * The items one of an expert's pokemon holds, at most `count` of
 * them. Deterministic: the same species on two teams carries the same
 * gear, because what suits it does not change with whose team it is
 */
export function getExpertHeldItems(species: Species, count: number): Items[] {
  if (count <= 0) {
    return [];
  }

  const chosen: Items[] = [];

  for (const item of preferences(species)) {
    if (chosen.length >= count) {
      break;
    }
    if (isBattleHeldItem(item) && !chosen.includes(item)) {
      chosen.push(item);
    }
  }
  return chosen;
}
