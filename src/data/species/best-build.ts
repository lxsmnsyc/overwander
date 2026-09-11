import Abilities from '../ids/abilities';
import { MoveCategories, MoveFlags, Moves } from '../ids/moves';
import Natures, { NATURE_EFFECTS, getNatureFactor } from '../ids/natures';
import { Stats } from '../constants/stats';
import type { Species } from '../ids/species';
import { getMoveData } from '../moves/__create';
import { getLearnableMoves, getSpeciesAbilityPools, getSpeciesData } from './__create';
import { MOVE_WEATHERS } from '../moves/weather';
import { isRecoilMove } from '../moves/recoil';
import { Weathers } from '../ids/status';
import {
  ABILITY_WANTS_WEATHER,
  ABILITY_WEATHER,
  BuildRole,
  WEATHER_TYPES,
  getBestMoves,
} from './best-moves';
import { Types } from '../constants/types';

/**
 * What an expert's party is, as opposed to what its six pokemon are.
 *
 * Six of the same plan is one plan fielded six times, so a built
 * party is two **cores** and four **supports**: the cores are there
 * to take something off the field, and the four behind them are there
 * to keep the cores standing and the far side hampered. Which of the
 * six are cores is read off the species rather than the slot, so the
 * two that can actually hit are the two asked to.
 *
 * The role reaches everything about a pokemon that is chosen rather
 * than rolled: its moves ([`best-moves.ts`](./best-moves.ts)), the
 * abilities it awakens, and its nature.
 */

/** How many of a full party are built to attack */
export const CORE_COUNT = 2;

/** How many pokemon it takes before a second core is worth one */
const CORE_SHARE = 3;

/**
 * What an ability is worth to a built pokemon, on a scale where 100
 * is an ordinary one worth carrying. Anything absent is that.
 *
 * The numbers are relative to each other and nothing else: they
 * decide which of a species' own pool it awakens, so an ability no
 * species shares with a better one never has to be priced exactly
 */
const ABILITY_WORTH: Partial<Record<Abilities, number>> = {
  // What changes what a pokemon is, rather than helping it along
  [Abilities.WonderGuard]: 200,
  [Abilities.HugePower]: 190,
  [Abilities.PurePower]: 190,
  [Abilities.Multiscale]: 155,
  [Abilities.Protean]: 150,
  [Abilities.MagicGuard]: 150,
  [Abilities.Adaptability]: 150,
  [Abilities.Drought]: 150,
  [Abilities.Drizzle]: 150,
  [Abilities.Technician]: 145,
  [Abilities.Regenerator]: 145,
  [Abilities.SpeedBoost]: 145,
  [Abilities.SheerForce]: 140,
  [Abilities.Intimidate]: 140,
  [Abilities.Levitate]: 140,
  [Abilities.MagicBounce]: 140,
  [Abilities.PoisonHeal]: 140,
  [Abilities.Guts]: 135,
  [Abilities.NaturalCure]: 135,
  [Abilities.ThickFat]: 135,
  [Abilities.WaterAbsorb]: 135,
  [Abilities.VoltAbsorb]: 135,
  [Abilities.SapSipper]: 130,
  [Abilities.FlashFire]: 130,
  [Abilities.SereneGrace]: 130,
  [Abilities.SkillLink]: 130,
  [Abilities.TintedLens]: 130,
  [Abilities.Prankster]: 130,
  [Abilities.SandStream]: 130,
  [Abilities.Filter]: 130,
  [Abilities.SolidRock]: 130,
  [Abilities.IronFist]: 125,
  [Abilities.StrongJaw]: 125,
  [Abilities.Sharpness]: 125,
  [Abilities.Steelworker]: 125,
  [Abilities.ToughClaws]: 125,
  [Abilities.GaleWings]: 125,
  [Abilities.SnowWarning]: 125,
  [Abilities.SwiftSwim]: 125,
  [Abilities.Chlorophyll]: 125,
  [Abilities.SandRush]: 125,
  [Abilities.Unaware]: 125,
  [Abilities.Sniper]: 120,
  [Abilities.NoGuard]: 120,
  [Abilities.SlushRush]: 120,
  [Abilities.Sturdy]: 120,
  [Abilities.MoldBreaker]: 115,
  [Abilities.Reckless]: 115,
  [Abilities.SuperLuck]: 110,
  [Abilities.ClearBody]: 110,
  [Abilities.Static]: 105,
  [Abilities.RoughSkin]: 105,
  // The ones a fight never asks about
  [Abilities.HoneyGather]: 20,
  [Abilities.Illuminate]: 20,
  [Abilities.RunAway]: 20,
  [Abilities.Pickup]: 20,
  [Abilities.Stench]: 40,
  [Abilities.Truant]: 0,
};

/** What everything else is worth */
const ORDINARY_ABILITY = 100;

/** The ones that are there to hit with */
const OFFENSE_ABILITIES = new Set<Abilities>([
  Abilities.HugePower,
  Abilities.PurePower,
  Abilities.Adaptability,
  Abilities.Technician,
  Abilities.SheerForce,
  Abilities.Guts,
  Abilities.SereneGrace,
  Abilities.SkillLink,
  Abilities.TintedLens,
  Abilities.IronFist,
  Abilities.StrongJaw,
  Abilities.Sharpness,
  Abilities.Steelworker,
  Abilities.ToughClaws,
  Abilities.Sniper,
  Abilities.SuperLuck,
  Abilities.Reckless,
  Abilities.MoldBreaker,
  Abilities.NoGuard,
  Abilities.Protean,
  Abilities.SpeedBoost,
  Abilities.SwiftSwim,
  Abilities.Chlorophyll,
  Abilities.SandRush,
  Abilities.SlushRush,
  Abilities.Blaze,
  Abilities.Torrent,
  Abilities.Overgrow,
  Abilities.Swarm,
]);

/** The ones that are there to still be standing */
const GUARD_ABILITIES = new Set<Abilities>([
  Abilities.Multiscale,
  Abilities.MagicGuard,
  Abilities.Regenerator,
  Abilities.Intimidate,
  Abilities.NaturalCure,
  Abilities.Levitate,
  Abilities.MagicBounce,
  Abilities.PoisonHeal,
  Abilities.ThickFat,
  Abilities.WaterAbsorb,
  Abilities.VoltAbsorb,
  Abilities.SapSipper,
  Abilities.FlashFire,
  Abilities.Filter,
  Abilities.SolidRock,
  Abilities.Unaware,
  Abilities.Sturdy,
  Abilities.ClearBody,
  Abilities.WonderGuard,
  Abilities.Prankster,
  Abilities.Static,
  Abilities.RoughSkin,
]);

/**
 * What an ability waiting on a sky is worth once the party has
 * settled one: a lift where the sky is coming, and most of its worth
 * gone where it is not
 */
const WOKEN_ABILITY = 1.15;
const SLEEPING_ABILITY = 0.35;

/** What Technician lifts, which is the engine's own threshold */
const TECHNICIAN_POWER = 60;

/**
 * The punches and the multi-hit moves. The battle side owns what each
 * ability does with them; these are here so the pricing can tell
 * whether the sheet has any
 */
const PUNCHES = new Set<Moves>([
  Moves.FirePunch,
  Moves.IcePunch,
  Moves.ThunderPunch,
  Moves.MachPunch,
  Moves.DynamicPunch,
  Moves.FocusPunch,
  Moves.MegaPunch,
  Moves.CometPunch,
  Moves.DizzyPunch,
  Moves.SkyUppercut,
  Moves.ShadowPunch,
  Moves.MeteorMash,
]);

const MULTI_HITS = new Set<Moves>([
  Moves.DoubleSlap,
  Moves.CometPunch,
  Moves.FuryAttack,
  Moves.PinMissile,
  Moves.SpikeCannon,
  Moves.Barrage,
  Moves.FurySwipes,
  Moves.BoneRush,
  Moves.ArmThrust,
  Moves.BulletSeed,
  Moves.IcicleSpear,
  Moves.RockBlast,
  Moves.DoubleKick,
  Moves.Twineedle,
  Moves.Bonemerang,
]);

/**
 * The abilities that only pay on a certain kind of move, and how to
 * tell whether the sheet carries any.
 *
 * They are priced after the moves are picked rather than before,
 * because an ability is worth what this pokemon's four moves make of
 * it: an Arcanine awakened Reckless on a sheet with no recoil move
 * when the two were chosen apart
 */
const ABILITY_NEEDS: Partial<Record<Abilities, (move: Moves) => boolean>> = {
  [Abilities.Reckless]: (move) => isRecoilMove(move),
  [Abilities.RockHead]: (move) => isRecoilMove(move),
  [Abilities.StrongJaw]: (move) => (getMoveData(move).flags & MoveFlags.Bite) !== 0,
  [Abilities.Sharpness]: (move) => (getMoveData(move).flags & MoveFlags.Slicing) !== 0,
  [Abilities.Steelworker]: (move) => getMoveData(move).type === Types.Steel,
  [Abilities.Technician]: (move) => (getMoveData(move).power ?? 0) <= TECHNICIAN_POWER,
  [Abilities.IronFist]: (move) => PUNCHES.has(move),
  [Abilities.SkillLink]: (move) => MULTI_HITS.has(move),
};

/** What an ability is worth on a sheet that never asks for it */
const UNASKED_ABILITY = 0.3;

/**
 * How much of what an ability promises this sheet actually collects:
 * everything where a move it lifts is on the sheet, most of it gone
 * where none is
 */
function abilityFit(ability: Abilities, moves: Moves[]): number {
  const needs = ABILITY_NEEDS[ability];

  if (needs == null || moves.length === 0) {
    return 1;
  }
  return moves.some((move) => needs(move)) ? 1 : UNASKED_ABILITY;
}

/** What a role pays for each kind of ability */
const ROLE_ABILITY_LEAN: Record<BuildRole, { offense: number; guard: number }> = {
  [BuildRole.Core]: { offense: 1.2, guard: 0.85 },
  [BuildRole.Support]: { offense: 0.85, guard: 1.25 },
};

/**
 * The abilities this species awakens for the job it was given, best
 * first, out of everything it could ever carry.
 *
 * A species with fewer in its pool than the outfit asks for carries
 * fewer, which is the same rule a rolled party follows
 */
export function getBestAbilities(
  species: Species,
  count: number,
  role: BuildRole,
  sky?: Weathers,
  moves: Moves[] = [],
): Abilities[] {
  const pools = getSpeciesAbilityPools(species);
  const lean = ROLE_ABILITY_LEAN[role];
  const leaning = (ability: Abilities): number => {
    if (OFFENSE_ABILITIES.has(ability)) {
      return lean.offense;
    }
    return GUARD_ABILITIES.has(ability) ? lean.guard : 1;
  };
  // An ability that sleeps until somebody calls a sky up is worth
  // what the party's plan makes of it. Read without one, a Charizard
  // awakened Solar Power on a team that fights under no sun
  const weather = (ability: Abilities): number => {
    const waiting = ABILITY_WANTS_WEATHER.get(ability);

    if (sky == null || waiting == null) {
      return 1;
    }
    return waiting === sky ? WOKEN_ABILITY : SLEEPING_ABILITY;
  };

  return [...new Set([...pools.regular, ...pools.hidden])]
    .map((ability) => ({
      ability,
      worth:
        (ABILITY_WORTH[ability] ?? ORDINARY_ABILITY) *
        leaning(ability) *
        weather(ability) *
        abilityFit(ability, moves),
    }))
    .sort((one, two) => two.worth - one.worth || one.ability - two.ability)
    .slice(0, Math.max(0, count))
    .map(({ ability }) => ability);
}

/**
 * What each role is buying when it picks a nature. HP is absent
 * because no nature touches it, and the attacking stat it does not
 * use is worth nothing, which is what makes the drop land there
 */
const NATURE_WEIGHTS: Record<BuildRole, Record<Stats, number>> = {
  [BuildRole.Core]: {
    [Stats.HP]: 0,
    [Stats.Attack]: 1,
    [Stats.Defense]: 0.12,
    [Stats.SpecialAttack]: 1,
    [Stats.SpecialDefense]: 0.12,
    // Speed is a cooldown here rather than a turn order, so a core
    // that moves oftener is a core that hits oftener
    [Stats.Speed]: 0.55,
  },
  [BuildRole.Support]: {
    [Stats.HP]: 0,
    // Enough that the drop never lands on what it does cast with,
    // and never enough to outbid what it is there for
    [Stats.Attack]: 0.2,
    [Stats.Defense]: 0.45,
    [Stats.SpecialAttack]: 0.2,
    [Stats.SpecialDefense]: 0.45,
    [Stats.Speed]: 0.35,
  },
};

/**
 * Which half of the split the sheet actually casts from, by the power
 * it carries on each side. A build with no attacks at all is read as
 * whichever stat the species is better at
 */
function attackingStat(species: Species, moves: Moves[]): Stats {
  let physical = 0;
  let special = 0;

  for (const move of moves) {
    const data = getMoveData(move);

    if (data.category === MoveCategories.Physical) {
      physical += data.power ?? 0;
    } else if (data.category === MoveCategories.Special) {
      special += data.power ?? 0;
    }
  }
  if (physical === special) {
    const stats = getSpeciesData(species).stats;

    return stats[Stats.Attack] >= stats[Stats.SpecialAttack] ? Stats.Attack : Stats.SpecialAttack;
  }
  return physical > special ? Stats.Attack : Stats.SpecialAttack;
}

/**
 * The nature this pokemon is best built with: the one whose 10% lands
 * on what the sheet uses and whose 10% comes off what it does not.
 *
 * Every nature is scored rather than tabled, so the answer follows
 * the species' own spread. A pokemon that swings and one that blasts
 * are handed opposite natures without either being written down
 */
export function getBestNature(species: Species, role: BuildRole, moves: Moves[] = []): Natures {
  const stats = getSpeciesData(species).stats;
  const weights = { ...NATURE_WEIGHTS[role] };
  const casts = attackingStat(species, moves);

  // The side it never casts from is worth nothing, which is where the
  // drop belongs
  weights[casts === Stats.Attack ? Stats.SpecialAttack : Stats.Attack] = 0;

  let best = Natures.Hardy;
  let bestWorth = Number.NEGATIVE_INFINITY;

  for (const nature of Object.keys(NATURE_EFFECTS).map(Number) as Natures[]) {
    let worth = 0;

    for (const stat of [
      Stats.Attack,
      Stats.Defense,
      Stats.SpecialAttack,
      Stats.SpecialDefense,
      Stats.Speed,
    ]) {
      worth += weights[stat] * stats[stat] * getNatureFactor(nature, stat);
    }
    if (worth > bestWorth) {
      best = nature;
      bestWorth = worth;
    }
  }
  return best;
}

/**
 * Which of a party are its cores, by species: the two whose own
 * spread says they can take something off the field. A party smaller
 * than the league's six gets one, since a Frontier three of two
 * attackers and one support is not a plan
 */
export function assignBuildRoles(party: Species[]): BuildRole[] {
  const cores = Math.min(CORE_COUNT, Math.max(1, Math.round(party.length / CORE_SHARE)));
  const ranked = party
    .map((species, at) => {
      const stats = getSpeciesData(species).stats;
      // What it hits with, and how often it gets to: the two halves
      // of taking something off the field
      const reach =
        Math.max(stats[Stats.Attack], stats[Stats.SpecialAttack]) + stats[Stats.Speed] / 2;

      return { at, species, reach };
    })
    .sort((one, two) => two.reach - one.reach || one.species - two.species)
    .slice(0, cores);

  const core = new Set(ranked.map(({ at }) => at));

  return party.map((_, at) => (core.has(at) ? BuildRole.Core : BuildRole.Support));
}

/**
 * The sky a party fights under, and who calls it up.
 *
 * A sky is a party's decision rather than a pokemon's: one Drought
 * covers all six, and where nobody brings one, one member spends a
 * slot on the setter so the other five can spend theirs on what the
 * sky is worth to them. A member deciding alone would either cast a
 * Sunny Day nobody else uses or wait under a sun it never learns about
 */
export interface PartyWeather {
  weather: Weathers;
  /** Which member casts it, or -1 where an ability already brings it */
  setter: number;
}

/**
 * How much has to be waiting, net of what the sky costs, before a
 * party spends a slot calling one up. One lonely support's Swift Swim
 * is not worth a Claydol's fourth move; a core's is
 */
const WEATHER_THRESHOLD = 1.5;

/**
 * How loudly each job votes on the sky.
 *
 * The two cores are what the party is trying to win with, so the sun
 * that doubles a core's Speed is worth calling and the sun that
 * halves a core's Water is worth avoiding, either of them over the
 * same thing said by a support
 */
const CORE_VOTE = 2;
const SUPPORT_VOTE = 1;

function roleVote(role: BuildRole): number {
  return role === BuildRole.Core ? CORE_VOTE : SUPPORT_VOTE;
}

/** Nothing is waiting for a sky, so nobody spends a cast on one */
const NO_WEATHER: PartyWeather = { weather: Weathers.None, setter: -1 };

/**
 * What the party does about the weather, read off the six it actually
 * has.
 *
 * An ability that brings a sky settles it, since it costs nothing. A
 * party with nobody to bring one counts what is waiting: the
 * Chlorophylls and Swift Swims, and the Solar Beams and Thunders that
 * come alive under their own sky. The setter is a support where one
 * can learn it, because a core's four slots are what it is for
 */
export function planPartyWeather(
  party: Species[],
  roles: BuildRole[],
  abilities: Abilities[][],
): PartyWeather {
  for (const held of abilities) {
    for (const ability of held) {
      const brought = ABILITY_WEATHER.get(ability);

      if (brought != null) {
        return { weather: brought, setter: -1 };
      }
    }
  }

  // What is actually waiting for a sky: the abilities that do nothing
  // without one. A move that merely *could* be learned is no reason to
  // spend a slot, and counting those had whole parties planning a rain
  // nobody needed
  const wanted = new Map<Weathers, number>();
  const waiting = new Map<Weathers, number[]>();

  for (const [at, held] of abilities.entries()) {
    for (const ability of held) {
      const sky = ABILITY_WANTS_WEATHER.get(ability);

      if (sky != null) {
        wanted.set(sky, (wanted.get(sky) ?? 0) + roleVote(roles[at]));
        waiting.set(sky, [...(waiting.get(sky) ?? []), at]);
      }
    }
  }

  let chosen = Weathers.None;
  let best = 0;

  for (const [weather, count] of wanted) {
    // What the sky costs the members that were not waiting for it: a
    // sun over two Water types is a sun that halves half the party.
    // Red's six are two of each, which is a party better off under no
    // sky at all
    const net = count - skyCost(party, roles, weather);

    if (net > best || (net === best && net > 0 && weather < chosen)) {
      chosen = weather;
      best = net;
    }
  }
  if (chosen === Weathers.None || best < WEATHER_THRESHOLD) {
    return NO_WEATHER;
  }

  const setter = pickSetter(party, roles, chosen, waiting.get(chosen) ?? []);

  return setter < 0 ? NO_WEATHER : { weather: chosen, setter };
}

/** The types a sandstorm and hail wear down, which is everybody else */
const SANDSTORM_SAFE = new Set<Types>([Types.Rock, Types.Ground, Types.Steel]);

/** What one ally pays for standing under a sky it did not ask for */
const DAMPED_SHARE = 1;
const WORN_SHARE = 0.5;

/**
 * What the sky costs the party. A damped type loses half of what it
 * is best at, which is worth as much as a waiting ability gains; a
 * type the weather merely wears down pays half that
 */
function skyCost(party: Species[], roles: BuildRole[], weather: Weathers): number {
  const damped = WEATHER_TYPES.get(weather)?.down;
  let cost = 0;

  for (const [at, species] of party.entries()) {
    const types = getSpeciesData(species).types;
    const vote = roleVote(roles[at]);

    if (damped != null && types.includes(damped)) {
      cost += DAMPED_SHARE * vote;
    }
    if (weather === Weathers.Sandstorm && !types.some((type) => SANDSTORM_SAFE.has(type))) {
      cost += WORN_SHARE * vote;
    }
    if (weather === Weathers.Hail && !types.includes(Types.Ice)) {
      cost += WORN_SHARE * vote;
    }
  }
  return cost;
}

/**
 * Who spends the slot. One of the pokemon waiting for the sky where
 * one can cast it, since it is the one that gains twice; a support
 * before a core either way, because a core's four slots are what it
 * is for
 */
function pickSetter(
  party: Species[],
  roles: BuildRole[],
  weather: Weathers,
  waiting: number[],
): number {
  const setter = [...MOVE_WEATHERS].find(([, called]) => called === weather)?.[0];

  if (setter == null) {
    return -1;
  }
  const learns = party.map((species) => new Set(getLearnableMoves(species)).has(setter));
  const order = [
    ...waiting.filter((at) => roles[at] === BuildRole.Support),
    ...waiting,
    ...party.map((_, at) => at).filter((at) => roles[at] === BuildRole.Support),
    ...party.map((_, at) => at),
  ];

  return order.find((at) => learns[at]) ?? -1;
}

/** Everything about one built pokemon that is chosen rather than rolled */
export interface BestBuild {
  role: BuildRole;
  abilities: Abilities[];
  moves: Moves[];
  nature: Natures;
}

/**
 * One member of a built party: its abilities, then the moves those
 * abilities are worth, then the nature those moves want. Each step
 * reads the one before it, which is why they are not three calls the
 * caller makes in whatever order
 */
export function getBestBuild(
  species: Species,
  role: BuildRole,
  abilityCount: number,
  taken: ReadonlyMap<Moves, number> = new Map(),
  sky?: { weather: Weathers; setter: boolean },
): BestBuild {
  const options = { role, taken, weather: sky?.weather, setter: sky?.setter };
  // Abilities and moves each want the other decided first, so the
  // draft is thrown away: the sheet is picked on a first guess at the
  // abilities, the abilities are then priced against that sheet, and
  // the sheet is picked again if they moved. Without it an Arcanine
  // awakened Reckless and carried nothing that recoils
  const guessed = getBestAbilities(species, abilityCount, role, sky?.weather);
  const draft = getBestMoves(species, guessed, options);
  const abilities = getBestAbilities(species, abilityCount, role, sky?.weather, draft);
  const settled =
    abilities.length === guessed.length && abilities.every((one, at) => one === guessed[at]);
  const moves = settled ? draft : getBestMoves(species, abilities, options);

  return { role, abilities, moves, nature: getBestNature(species, role, moves) };
}

/**
 * The whole party at once: the jobs, then the sky, then each member
 * built knowing both and knowing what the ones before it brought.
 *
 * This is the only entry point that composes rather than builds. A
 * member built on its own is a member that plans its own weather and
 * repeats its neighbour's screen
 */
export function getBestParty(party: Species[], abilityCount: number): BestBuild[] {
  const roles = assignBuildRoles(party);
  // Abilities are read twice: once to see what the party could want
  // of the sky, and again once the sky is settled, since an ability
  // waiting on a sun that is not coming is a wasted slot. The second
  // pass cannot unsettle the plan, because the abilities that asked
  // for that sky are the ones it lifts
  const wanted = party.map((species, at) => getBestAbilities(species, abilityCount, roles[at]));
  const sky = planPartyWeather(party, roles, wanted);
  const taken = new Map<Moves, number>();
  const built: BestBuild[] = [];

  for (const [at, species] of party.entries()) {
    const member = getBestBuild(species, roles[at], abilityCount, taken, {
      weather: sky.weather,
      setter: sky.setter === at,
    });

    built.push(member);
    // Every move, not only the quiet ones: a party of four
    // Earthquakes answers one wall four times and everything else
    // never
    for (const move of member.moves) {
      taken.set(move, (taken.get(move) ?? 0) + 1);
    }
  }
  return built;
}
