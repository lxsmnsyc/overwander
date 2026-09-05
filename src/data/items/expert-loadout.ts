import Abilities from '../ids/abilities';
import { Items } from '../ids/items';
import { MoveCategories, Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import { Stats } from '../constants/stats';
import type { Types } from '../constants/types';
import { getMoveData, getSpeedCooldownFactor } from '../moves/__create';
import { GENERAL_STAT_BOOSTERS } from './stat-boosters';
import { MARKET_GEAR } from './gear';
import { ORBS } from './orbs';
import { TYPE_BOOSTERS } from './type-boosters';
import { getSpeciesData } from '../species/__create';
import { BuildRole } from '../species/best-moves';
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
 * What a pokemon's built set is made of, by share: how much of its
 * damage is physical, how much is special, and how much comes off
 * each type. Gear is priced against this rather than against the
 * species, since what a pokemon is listed as and what it actually
 * swings with are different questions
 */
interface Split {
  physical: number;
  special: number;
  types: Map<Types, number>;
  /**
   * The biggest share any one type carries. It is what says whether
   * being locked to a single move costs the pokemon much: a set built
   * around one blow gives up almost nothing, a set of four answers
   * gives up three of them
   */
  focus: number;
}

function splitOf(species: Species, moves: Moves[]): Split {
  const types = new Map<Types, number>();
  let physical = 0;
  let special = 0;

  for (const move of moves) {
    const data = getMoveData(move);

    if (data.category === MoveCategories.Status) {
      continue;
    }

    const power = data.power ?? 0;

    types.set(data.type, (types.get(data.type) ?? 0) + power);

    if (data.category === MoveCategories.Physical) {
      physical += power;
    } else {
      special += power;
    }
  }

  const total = physical + special;

  // Nothing to weigh: a set with no attacks in it is read off the
  // species, so a wall is still handed something for its own types
  if (total === 0) {
    const listed = getSpeciesData(species).types;

    for (const type of listed) {
      types.set(type, 1 / listed.length);
    }
    return { physical: 0.5, special: 0.5, types, focus: 1 / listed.length };
  }

  for (const [type, power] of types) {
    types.set(type, power / total);
  }
  return {
    physical: physical / total,
    special: special / total,
    types,
    focus: Math.max(...types.values()),
  };
}

/**
 * What locking a pokemon to one move costs, against what it buys.
 *
 * Steep, because this engine picks a move per cast rather than per
 * turn: a locked pokemon gives up the coverage its other three slots
 * were chosen for, on every cast, for the whole fight
 */
const LOCK_FACTOR = 0.35;

/**
 * How hard the species hits, from its better attacking stat, where 1
 * is as hard as anything in the game hits. Gear that costs health to
 * deal more damage is priced against it
 */
const FULL_PRESSURE = 120;

/**
 * What a Life Orb costs its holder, per fight.
 *
 * It takes a tenth of the holder's health for every blow that lands,
 * and how many blows that is depends on how fast the holder is: Speed
 * buys cooldown here, so a quick attacker pays the tenth far oftener
 * than a slow one for the same fight. A support pays it as well
 * without doing the attacking that would earn it back
 */
const ORB_COST = 0.12;
const SUPPORT_ORB_COST = 1.6;

/**
 * A rough level-100 Speed stat from the base one, trained but with no
 * nature on it. The loadout knows the species rather than the record,
 * and what it needs is the size of the number rather than the number
 */
function trainedSpeed(species: Species): number {
  return 2 * getSpeciesData(species).stats[Stats.Speed] + 99;
}

function orbCost(species: Species, role: BuildRole): number {
  const acting = 1 / getSpeedCooldownFactor(trainedSpeed(species));

  return ORB_COST * acting * (role === BuildRole.Support ? SUPPORT_ORB_COST : 1);
}

function pressure(species: Species): number {
  const stats = getSpeciesData(species).stats;

  return Math.min(1, Math.max(stats[Stats.Attack], stats[Stats.SpecialAttack]) / FULL_PRESSURE);
}

/**
 * The share of a locking item's face value this set actually keeps.
 * A set that leans on one blow keeps all of it; one spread evenly
 * across four keeps half of that
 */
function lockFactor(split: Split, moves: Moves[]): number {
  return LOCK_FACTOR * Math.min(1, split.focus * 2) * castable(moves);
}

/**
 * What share of a locked pokemon's sheet it can still throw.
 *
 * A lock takes the first move it casts and keeps it, so every quiet
 * move on the sheet is a move it may never reach: a Tentacruel
 * carrying a Rain Dance and a Reflect behind Choice Specs is a
 * Tentacruel that either never sets the rain or never attacks.
 * Squared, because losing half the sheet is worse than half as good
 */
function castable(moves: Moves[]): number {
  if (moves.length === 0) {
    return 1;
  }
  const quiet = moves.filter((move) => getMoveData(move).category === MoveCategories.Status).length;

  return ((moves.length - quiet) / moves.length) ** 2;
}

/**
 * What every unpriced piece of battle gear is worth: enough to fill a
 * slot nothing better wants, and never enough to take one
 */
const PLAIN_WORTH = 0.02;

/**
 * What one item is worth to this pokemon, as the share of a fight it
 * changes. Everything is on the one scale, so a 1.5x on half of what
 * a pokemon throws beats a 1.2x on all of it and neither has to be
 * ranked against the other by hand
 */
/**
 * The gear whose worth is the same in anybody's hands: what it buys
 * does not depend on what the pokemon is
 */
const FLAT_WORTH: Partial<Record<Items, number>> = {
  [Items.Leftovers]: 0.12,
  [Items.ExpertBelt]: 0.08,
  [Items.ScopeLens]: 0.07,
  [Items.ShellBell]: 0.06,
  [Items.FocusBand]: 0.05,
  [Items.BrightPowder]: 0.05,
  [Items.WideLens]: 0.05,
  [Items.QuickClaw]: 0.04,
  [Items.RockyHelmet]: 0.04,
};

function itemWorth(
  species: Species,
  item: Items,
  split: Split,
  moves: Moves[],
  abilities: Abilities[],
  role: BuildRole,
): number {
  // A relic doubles a stat for one species and is worth nothing to
  // anybody else, which is why it is never put behind anything
  if (SPECIES_RELICS.has(item)) {
    return 0.9;
  }
  if (item === Items.Eviolite) {
    return isFullyEvolved(species) ? 0 : 0.6;
  }

  const boosted = TYPE_BOOSTERS.get(item);

  if (boosted != null) {
    return 0.2 * (split.types.get(boosted) ?? 0);
  }

  // The Choice band and its kin: half again on one half of what a
  // pokemon throws, against being stuck with the move it opened on
  if (item === Items.ChoiceBand) {
    return 0.5 * split.physical * lockFactor(split, moves);
  }
  if (item === Items.ChoiceSpecs) {
    return 0.5 * split.special * lockFactor(split, moves);
  }
  if (item === Items.ChoiceScarf) {
    return 0.25 * lockFactor(split, moves);
  }

  // Everything it throws, at a price paid in its own health: worth it
  // to something that hits hard enough for the extra to cover the
  // recoil, and a slow way to die for anything else
  if (item === Items.LifeOrb) {
    return 0.3 * pressure(species) - orbCost(species, role);
  }
  if (item === Items.MuscleBand) {
    return 0.1 * split.physical;
  }
  if (item === Items.WiseGlasses) {
    return 0.1 * split.special;
  }

  // The orbs are a cost until something turns the status into a gain,
  // and then they are most of what the pokemon is doing. A burn takes
  // the attack stat down with it, so the poison is the better half of
  // the same trick
  if (item === Items.FlameOrb || item === Items.ToxicOrb) {
    const full = item === Items.ToxicOrb ? 0.3 : 0.2;
    const guts = abilities.includes(Abilities.Guts) ? full * split.physical : 0;

    return guts + (moves.includes(Moves.Facade) ? 0.1 : 0);
  }
  return FLAT_WORTH[item] ?? PLAIN_WORTH;
}

/**
 * The gear a pokemon can only usefully hold one of the kind of.
 *
 * Two Choice items lock twice over and pay once, two orbs leave one
 * status, and a second type booster is for the type the first one
 * already said was the lesser. Worth is what picks inside a group,
 * and a group is picked from once
 */
function groupOf(item: Items): string | null {
  if (item === Items.ChoiceBand || item === Items.ChoiceSpecs || item === Items.ChoiceScarf) {
    return 'lock';
  }
  if (item === Items.FlameOrb || item === Items.ToxicOrb) {
    return 'orb';
  }
  return TYPE_BOOSTERS.has(item) ? 'booster' : null;
}

/**
 * Everything this species could sensibly be handed, best first: its
 * own held table richest slot down, then Eviolite where it still has
 * somewhere to evolve to, then a booster for each of its types, and
 * gear that suits anybody for the slots nothing else fills.
 *
 * What the ranks below the league are handed. It leans on the wild
 * held-item table, so a gym leader's party still reads as that
 * leader's rather than as the best answer to a question
 */
function preferences(species: Species, moves: Moves[]): Items[] {
  const held = getSpeciesHeldItems(species);
  // What the pokemon actually swings with, richest type first. A
  // booster is only worth a slot for a type the set reaches for, so a
  // Gyarados carrying no Water move is handed no Mystic Water
  const swung = new Map<Types, number>();

  for (const move of moves) {
    const data = getMoveData(move);

    if (data.category !== MoveCategories.Status) {
      swung.set(data.type, (swung.get(data.type) ?? 0) + (data.power ?? 0));
    }
  }

  const types =
    swung.size > 0
      ? [...swung].sort((one, two) => two[1] - one[1]).map(([type]) => type)
      : getSpeciesData(species).types;
  const boosters = types.flatMap((type) =>
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
 * Everything the pricing is allowed to reach for. A relic belongs to
 * one species and is only offered where its own table says so;
 * everything else that acts in a fight is offered to everybody, and
 * the worth is what decides
 */
function candidates(species: Species): Items[] {
  const held = getSpeciesHeldItems(species);
  const own = new Set(
    [held?.rare, held?.uncommon, held?.common].filter((item): item is Items => item != null),
  );

  return [...BATTLE_HELD].filter((item) => !SPECIES_RELICS.has(item) || own.has(item));
}

/**
 * The items one of an expert's pokemon holds, at most `count` of
 * them. Deterministic: the same species on two teams carries the same
 * gear, because what suits it does not change with whose team it is.
 *
 * The gear follows what the pokemon is fielding rather than what its
 * species is listed as. Above the league it is priced, so the answer
 * is the best one there is; below it, it is ordered off the species'
 * own table, so a party still reads as that trainer's
 */
export interface HeldLoadout {
  /** The set it is fielding, which the gear is chosen against */
  moves?: Moves[];
  /** What it is fighting with, which is what asks for an orb */
  abilities?: Abilities[];
  /**
   * The job the party gave it. Gear that buys damage with health is
   * for the two doing the attacking, not the four behind them
   */
  role?: BuildRole;
  /**
   * Whether the gear is priced rather than ordered. The ladder's top
   * rungs are handed the best answer there is; everybody below is
   * handed what suits their species, which is what keeps a gym
   * leader's party reading as theirs
   */
  best?: boolean;
}

export function getExpertHeldItems(
  species: Species,
  count: number,
  loadout: HeldLoadout = {},
): Items[] {
  if (count <= 0) {
    return [];
  }

  const moves = loadout.moves ?? [];
  const abilities = loadout.abilities ?? [];

  if (loadout.best !== true) {
    const chosen: Items[] = [];

    for (const item of preferences(species, moves)) {
      if (chosen.length >= count) {
        break;
      }
      if (isBattleHeldItem(item) && !chosen.includes(item)) {
        chosen.push(item);
      }
    }
    return chosen;
  }

  const split = splitOf(species, moves);
  const role = loadout.role ?? BuildRole.Core;
  const ranked = candidates(species)
    .map((item) => ({ item, worth: itemWorth(species, item, split, moves, abilities, role) }))
    .filter((entry) => entry.worth > 0)
    .sort((one, two) => two.worth - one.worth || one.item - two.item);

  const chosen: Items[] = [];
  const taken = new Set<string>();

  for (const { item } of ranked) {
    if (chosen.length >= count) {
      break;
    }

    const group = groupOf(item);

    if (group != null) {
      if (taken.has(group)) {
        continue;
      }
      taken.add(group);
    }
    chosen.push(item);
  }
  return chosen;
}
