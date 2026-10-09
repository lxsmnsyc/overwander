import { BASE_FRIENDSHIP } from '../data/constants/friendship';
import type { CatchSnapshot } from '../auth/catch-snapshot';
import { getMaxHealth } from '../auth/health';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  Slots,
  mostSlots,
  packSlots,
} from '../data/constants/slots';
import { getBannedBossMoves } from '../data/overworld/boss-moves';
import { getTotemAlly, getTotemSize } from '../data/overworld/totems';
import { ALPHA_COPIES, getAlphaSize } from '../data/overworld/alphas';
import AleaRNG from '../core/alea';
import { MAX_LEVEL } from '../data/constants/levels';
import {
  MAX_EFFORT_PER_STAT,
  MAX_IV,
  PERFECT_IVS,
  STAT_ORDER,
  Stats,
  setIV,
} from '../data/constants/stats';
import Abilities from '../data/ids/abilities';
import { CRASH_MOVES } from '../battle/moves/crash';
import { OHKO_MOVES } from '../battle/moves/fixed-damage';
import { DELAYED_MOVES } from '../battle/moves/future-sight';
import { RAMPAGE_MOVES } from '../battle/moves/rampage';
import { ROLLING_MOVES } from '../battle/moves/rolling';
import { SELF_DESTRUCT_MOVES } from '../battle/moves/self-destruct';
import { MoveCategories, Moves } from '../data/ids/moves';
import { RECHARGE_MOVES } from '../data/moves/recharge';
import { Z_MOVES } from '../data/moves/z-moves';
import { G_MAX_MOVES, canGigantamax } from '../data/moves/gmax-moves';
import { Species } from '../data/ids/species';
import { getMoveData } from '../data/moves';
import { getLevelUpMoves, getSpeciesData } from '../data/species';
import {
  EncounterType,
  deriveAbility,
  deriveGender,
  deriveMoves,
  deriveNature,
  deriveSize,
} from './encounter';

/**
 * A raid boss is a maxed legendary: the fight is meant to need a
 * party, not a lucky level gap
 */
export const RAID_BOSS_LEVEL = MAX_LEVEL;

/**
 * The alliance the raid boss fights under; every player team shares
 * the other one, so the whole lobby is allied against it
 */
export const BOSS_ALLIANCE = 0;
export const PLAYER_ALLIANCE = 1;

/**
 * The reward comes at a fixed level rather than a rolled one, so
 * clearing the same raid is worth the same to everyone. A legendary
 * arrives half-grown; a shadow, being the commoner prize, arrives
 * lower still
 */
export const LEGENDARY_RAID_REWARD_LEVEL = 50;
export const SHADOW_RAID_REWARD_LEVEL = 25;
/** A Totem is handed over between the two: a strong pokemon, but no legendary */
export const TOTEM_RAID_REWARD_LEVEL = 40;
/** A Max Raid's prize too: the same kind of boss, a final stage of the biome */
export const MAX_RAID_REWARD_LEVEL = 40;
/** And an Alpha's, whatever stage it is: its three perfect stats are the prize */
export const ALPHA_RAID_REWARD_LEVEL = 40;

/**
 * What clearing one pays, on top of the pokemon.
 *
 * A raid pays each fighter the same purse — the boss decides the
 * amount, not who landed the last hit — so these stay flat where a
 * stop's is rolled. What they are worth is read off the same ladder
 * the stops are, at the middle of the rung each raid belongs to: a
 * shadow raid is a gym leader's afternoon and a legendary is one of
 * the Elite Four.
 *
 * A mythical sits under the Champion's middle rather than on it,
 * because a raid pays everybody who fought it where a champion pays
 * one winner. It is still the largest purse in the game, which the
 * relic spent to open it has to be worth
 */
export const SHADOW_RAID_GOLD = 35000;
export const LEGENDARY_RAID_GOLD = 80000;
/** A Totem pays between a shadow and a legendary, and so do a Max Raid and an Alpha */
export const TOTEM_RAID_GOLD = 50000;
export const MAX_RAID_GOLD = 50000;
export const ALPHA_RAID_GOLD = 50000;
export const MYTHICAL_RAID_GOLD = 200000;

/**
 * The level a mythical arrives at. Lower than a legendary's, the way
 * the games have always handed mythicals over — the prize is the
 * pokemon itself, not what it comes ready to do
 */
export const MYTHICAL_RAID_REWARD_LEVEL = 30;

/**
 * The highest an individual value goes; a raid boss has them all
 */
export const PERFECT_IV = MAX_IV;

/**
 * A boss is trained as far as anything can be. Nothing raised it, so
 * there is nobody for the effort to have come from: it is what a raid
 * is, the species at the most it could ever be
 */
function maxEffortValues(): Record<Stats, number> {
  return {
    [Stats.HP]: MAX_EFFORT_PER_STAT,
    [Stats.Attack]: MAX_EFFORT_PER_STAT,
    [Stats.Defense]: MAX_EFFORT_PER_STAT,
    [Stats.SpecialAttack]: MAX_EFFORT_PER_STAT,
    [Stats.SpecialDefense]: MAX_EFFORT_PER_STAT,
    [Stats.Speed]: MAX_EFFORT_PER_STAT,
  };
}

/** Nothing spent on any stat, for what nobody raised */
function noEffortValues(): Record<Stats, number> {
  return {
    [Stats.HP]: 0,
    [Stats.Attack]: 0,
    [Stats.Defense]: 0,
    [Stats.SpecialAttack]: 0,
    [Stats.SpecialDefense]: 0,
    [Stats.Speed]: 0,
  };
}

/** How many of a boss' moves are attacks, the rest being status moves */
export const BOSS_ATTACK_COUNT = 5;

/**
 * The status moves worth a boss' cast. Each one it aims at a single
 * foe goes out to the whole party, so these are what make a party
 * answer rather than only hit: a status to cure, a stat drop to wait
 * out, setup thrown away. Sleep is left to Yawn, the one a party sees
 * coming: a Spore across six pokemon would end the fight on its own
 */
const BOSS_STATUS_MOVES: readonly Moves[] = [
  Moves.WillOWisp,
  Moves.ThunderWave,
  Moves.Glare,
  Moves.Toxic,
  Moves.Haze,
  Moves.Yawn,
  Moves.StunSpore,
  Moves.Screech,
  Moves.FakeTears,
  Moves.Taunt,
];

/**
 * Attacks a boss is not built around: the ones that cost it the fight's
 * pace (a recharge, a lock, a delay, a crash), the ones that only work
 * under a condition it cannot arrange, and the ones that answer a hit
 * rather than land one. A boss may still level into any of them
 */
const BOSS_UNFIT_ATTACKS = new Set<Moves>([
  ...SELF_DESTRUCT_MOVES,
  ...DELAYED_MOVES,
  ...RECHARGE_MOVES,
  ...RAMPAGE_MOVES,
  ...ROLLING_MOVES,
  ...CRASH_MOVES,
  ...OHKO_MOVES,
  ...Z_MOVES,
  ...G_MAX_MOVES,
  Moves.FocusPunch,
  Moves.DreamEater,
  Moves.Snore,
  Moves.Belch,
  Moves.LastResort,
  Moves.NaturalGift,
  Moves.Fling,
  Moves.Synchronoise,
  Moves.Counter,
  Moves.MirrorCoat,
  Moves.MetalBurst,
  Moves.ShellTrap,
  Moves.BeakBlast,
]);

/** What an attack is worth to this species: power, the bonus for its own type, and the hit rate */
function attackWorth(species: Species, move: Moves): number {
  const data = getMoveData(move);
  const { stats, types } = getSpeciesData(species);
  const stab = types.includes(data.type) ? 1.5 : 1;
  const stat =
    stats[data.category === MoveCategories.Physical ? Stats.Attack : Stats.SpecialAttack];

  return ((data.power ?? 0) * stab * stat * (data.accuracy ?? 100)) / (data.steps ?? 1);
}

/**
 * The 8 moves a boss is staged with, from the moves its species levels
 * into and none a boss may never have: a boss is met in the wild, and
 * nothing in the wild was taught by a machine, a tutor or its parents.
 * Its hardest attacks first, one to a type, then the status moves a
 * party has to answer, then whatever else it levels into
 */
export function getBossMoves(species: Species): Moves[] {
  const banned = getBannedBossMoves(species);
  const pool = new Set<Moves>();

  for (const move of getLevelUpMoves(species, RAID_BOSS_LEVEL)) {
    if (!banned.has(move)) {
      pool.add(move);
    }
  }

  const attacks: Moves[] = [];

  for (const move of pool) {
    const data = getMoveData(move);

    if (
      data.category !== MoveCategories.Status &&
      (data.power ?? 0) > 0 &&
      !BOSS_UNFIT_ATTACKS.has(move)
    ) {
      attacks.push(move);
    }
  }
  attacks.sort((a, b) => attackWorth(species, b) - attackWorth(species, a));

  const chosen: Moves[] = [];
  const covered = new Set<number>();

  for (const move of attacks) {
    if (chosen.length >= BOSS_ATTACK_COUNT) {
      break;
    }
    if (!covered.has(getMoveData(move).type)) {
      covered.add(getMoveData(move).type);
      chosen.push(move);
    }
  }
  for (const move of BOSS_STATUS_MOVES) {
    if (chosen.length >= mostSlots(Slots.Move)) {
      break;
    }
    if (pool.has(move)) {
      chosen.push(move);
    }
  }
  // The whole learn set, latest first: taking only the last few would
  // leave a boss whose recent moves are all unfit with empty slots
  const learned = deriveMoves(species, RAID_BOSS_LEVEL, banned, pool.size);

  for (let at = learned.length - 1; at >= 0; at--) {
    const move = learned[at];

    if (chosen.length >= mostSlots(Slots.Move)) {
      break;
    }
    if (!chosen.includes(move) && !BOSS_UNFIT_ATTACKS.has(move)) {
      chosen.push(move);
    }
  }
  return chosen;
}

/**
 * Species that are never staged as a boss, whatever the draw says.
 *
 * **Ditto** is the list. What it does is become something else, and a
 * boss is the one thing in the game that must not: the copy would
 * take a player's stats and throw away the raid-sized health pool the
 * fight is built around. Banning Transform already stops the copying,
 * but that leaves a Ditto with nothing at all to do — the answer is
 * that Ditto is not a raid boss rather than that Ditto is a quiet one
 */
export const BANNED_BOSS_SPECIES = new Set<Species>([Species.Ditto]);

/**
 * Whether the species can be a boss at all: not one of the banned
 * ones, and with something left to cast once the banned moves are
 * taken off it.
 *
 * The second half is a rule rather than a list, so a later ban cannot
 * quietly strand a species with an empty move list — it drops out of
 * the draw on its own
 */
export function canStageBoss(species: Species): boolean {
  return !BANNED_BOSS_SPECIES.has(species) && getBossMoves(species).length > 0;
}

/**
 * Whether a Max Raid's boss of this species is Gigantamaxed: always,
 * where the species has a Gigantamax form. The species alone decides
 * it, so the prize's factor needs nothing stored beside the raid
 */
export function isGigantamaxBoss(species: Species): boolean {
  return canGigantamax(species);
}

/** Whether a prize carries the Gigantamax Factor: one out of a Gigantamax Max Raid boss */
export function keepsGigantamaxFactor(encounter: {
  type: EncounterType;
  species: Species;
}): boolean {
  return encounter.type === EncounterType.MaxRaid && isGigantamaxBoss(encounter.species);
}

/**
 * The raid boss as a catch snapshot, so a battle builds it from the
 * same shape as a player's party. Its individual values are perfect
 * and its effort values maxed; the nature and ability come from the
 * raid's trait value, which every player in the lobby shares. It
 * belongs to no catch record, so its `caught` id is empty. A shadow
 * boss carries the Shadow ability on top of the Boss one
 */
export function createRaidBossSnapshot(
  species: Species,
  traitValue: number,
  shadow = false,
  totem = false,
  max = false,
  alpha = false,
): CatchSnapshot {
  // The lobby shares the raid's trait value, so every player fights a
  // boss of exactly the same build. A Totem and an Alpha stand at
  // their own size
  let size = deriveSize(species, traitValue);

  if (totem) {
    size = getTotemSize(species);
  } else if (alpha) {
    size = getAlphaSize(species);
  }
  const marks = [Abilities.Boss];

  if (shadow) {
    marks.push(Abilities.Shadow);
  }
  if (totem) {
    marks.push(Abilities.Totem);
  }
  if (alpha) {
    marks.push(Abilities.Alpha);
  }

  return {
    caught: '',
    species,
    level: RAID_BOSS_LEVEL,
    ivs: PERFECT_IVS,
    effortValues: maxEffortValues(),
    nature: deriveNature(traitValue),
    // The boss reads its own gender ratio, the same way a spawn
    // does; only a genderless species comes out genderless
    gender: deriveGender(species, traitValue),
    height: size.height,
    weight: size.weight,
    // A boss never sparkles, and a shadow one carries the bit its
    // ability list already says it does
    shiny: false,
    shadow,
    // A boss is staged without the moves a boss must not have: see
    // getBannedBossMoves for what is on that list and why
    moves: getBossMoves(species),
    // A boss is staged rather than raised, so nothing has been spent
    // on what it knows
    movePoints: {},
    // The Boss ability is what makes it a raid: the health pool, the
    // stage immunities and the sweeping single-target moves all ride
    // on it, alongside the species' own rolled ability
    abilities: [...marks, deriveAbility(species, traitValue)],
    items: [],
    // The Boss ability and the shadow are both special, so all a boss
    // needs room for is the one it rolled, and every move it knows
    slots: packSlots(DEFAULT_ABILITY_SLOTS, DEFAULT_ITEM_SLOTS, mostSlots(Slots.Move)),
    // A boss stands for no record either, and every lobby faces it at
    // full strength
    health: getMaxHealth({
      species,
      level: RAID_BOSS_LEVEL,
      ivs: PERFECT_IVS,
      effortValues: maxEffortValues(),
    }),
    // Nothing has raised it, so it thinks of nobody
    friendship: BASE_FRIENDSHIP,
    statuses: 0,
    // A Max Raid's boss is a giant from the first moment to the last
    ...(max ? { dynamaxed: true } : {}),
    ...(max && isGigantamaxBoss(species) ? { gigantamax: true } : {}),
  };
}

/**
 * The ally a Totem calls: the first stage of its line, or another of
 * itself, at the raid's level with nothing spent on it. It is no boss,
 * but its Totem Ally mark gives it a raid-sized share of HP and stats.
 * It is marked as called so the battle keeps it off the field until
 * the Totem asks for it
 */
export function createTotemAllySnapshot(totem: Species, traitValue: number): CatchSnapshot {
  const species = getTotemAlly(totem);
  const size = deriveSize(species, traitValue);

  return {
    caught: '',
    species,
    level: RAID_BOSS_LEVEL,
    ivs: PERFECT_IVS,
    effortValues: noEffortValues(),
    nature: deriveNature(traitValue),
    gender: deriveGender(species, traitValue),
    height: size.height,
    weight: size.weight,
    shiny: false,
    shadow: false,
    moves: getBossMoves(species),
    movePoints: {},
    abilities: [deriveAbility(species, traitValue), Abilities.TotemAlly],
    items: [],
    slots: packSlots(DEFAULT_ABILITY_SLOTS, DEFAULT_ITEM_SLOTS, mostSlots(Slots.Move)),
    health: getMaxHealth({
      species,
      level: RAID_BOSS_LEVEL,
      ivs: PERFECT_IVS,
      effortValues: noEffortValues(),
    }),
    friendship: BASE_FRIENDSHIP,
    statuses: 0,
    called: true,
  };
}

/**
 * The copies an Alpha summons, one per place at its side: plain wild
 * pokemon of its species at its level, each with a nature, an ability
 * and individual values of its own and nothing spent on it. No mark of
 * any kind, so it is neither a boss nor anything a party can catch.
 * A fallen copy is replaced by its place's copy built again
 */
export function createAlphaCopySnapshots(species: Species, traitValue: number): CatchSnapshot[] {
  const copies: CatchSnapshot[] = [];

  for (let place = 0; place < ALPHA_COPIES; place++) {
    // The draws land in order: its trait value, then each stat's value
    const rng = new AleaRNG(`${traitValue}:alpha-copy:${place}`);
    const trait = rng.int32();
    let ivs = 0;

    for (const stat of STAT_ORDER) {
      ivs = setIV(ivs, stat, Math.floor(rng.random() * (MAX_IV + 1)));
    }

    const size = deriveSize(species, trait);

    copies.push({
      caught: '',
      species,
      level: RAID_BOSS_LEVEL,
      ivs,
      effortValues: noEffortValues(),
      nature: deriveNature(trait),
      gender: deriveGender(species, trait),
      height: size.height,
      weight: size.weight,
      shiny: false,
      shadow: false,
      moves: getBossMoves(species),
      movePoints: {},
      abilities: [deriveAbility(species, trait)],
      items: [],
      slots: packSlots(DEFAULT_ABILITY_SLOTS, DEFAULT_ITEM_SLOTS, mostSlots(Slots.Move)),
      health: getMaxHealth({
        species,
        level: RAID_BOSS_LEVEL,
        ivs,
        effortValues: noEffortValues(),
      }),
      friendship: BASE_FRIENDSHIP,
      statuses: 0,
      called: true,
      alphaCopy: true,
    });
  }
  return copies;
}

/**
 * The boss side of a raid, as the catches its team snapshot holds: the
 * boss alone, a Totem with the ally it will call, or an Alpha with the
 * copies it will summon
 */
export function createRaidBossTeam(
  species: Species,
  traitValue: number,
  shadow: boolean,
  totem: boolean,
  max = false,
  alpha = false,
): CatchSnapshot[] {
  const boss = createRaidBossSnapshot(species, traitValue, shadow, totem, max, alpha);

  if (alpha) {
    return [boss, ...createAlphaCopySnapshots(species, traitValue)];
  }
  return totem ? [boss, createTotemAllySnapshot(species, traitValue)] : [boss];
}

/**
 * Build one battle unit from a frozen catch
 */
