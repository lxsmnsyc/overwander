import Abilities from '../ids/abilities';
import { MoveCategories, MoveFlags, Moves } from '../ids/moves';
import { Stats } from '../constants/stats';
import type { Species } from '../ids/species';
import { TYPE_EFFECTIVENESS, TypeEffectiveness, Types } from '../constants/types';
import { Weathers } from '../ids/status';
import { getLearnableMoves, getSpeciesData } from './__create';
import { getMoveData } from '../moves/__create';
import { MOVE_WEATHERS, getWeatherMove } from '../moves/weather';

/**
 * What a species is best built as: the four moves an expert's copy of
 * it fights with, worked out rather than written down.
 *
 * Everything staged from a spawn otherwise carries the last four
 * level-up moves it knows, which at the top of the ladder is the tail
 * of a learnset: often four moves of one type, sometimes mostly
 * status. This picks from everything the species can ever learn, and
 * weighs each candidate by what the pokemon holding it actually is,
 * its types, which of its two attacking stats is the real one, and
 * the ability it fights with.
 *
 * Derived rather than tabled so that a species added in a later
 * generation is built the moment it is registered. Where the scoring
 * reads one wrong, `BEST_MOVE_OVERRIDES` is what says so.
 */

/** How many moves one of these carries */
export const BEST_MOVE_COUNT = 4;

/**
 * What a pokemon is on the sheet it was built for.
 *
 * A party of six identical hitters is six copies of one plan, so an
 * expert fields two of them and four of everything else: the cores
 * are there to take something off the field, and the rest are there
 * to keep the cores standing and the far side hampered
 */
export const enum BuildRole {
  /** Attacks and the setup that sharpens them */
  Core = 0,
  /** Health, screens, hazards and whatever cripples the other side */
  Support = 1,
}

/** What a status move is for, which is what a role has an opinion about */
const enum StatusKind {
  /** A stat raised on the user, worth what the stat is worth to it */
  Setup = 0,
  /** Health back */
  Heal = 1,
  /** Something done to the other side that is not damage */
  Cripple = 2,
  /** Something laid over the side or the field */
  Guard = 3,
  /** A sky, worth nothing unless something is waiting for it */
  Weather = 4,
  /**
   * Something done for somebody else on the field. Every fight here
   * stands the whole party up at once, so a move aimed at an ally is
   * a move with somebody to aim at
   */
  Ally = 5,
}

/**
 * A move's worth is read as effective power, so everything below is
 * on the same scale a base power is: 100 is a strong hit landing
 * every time with nothing helping it
 */
const NEUTRAL_ACCURACY = 100;

/**
 * What a move that cannot miss is worth against one that merely never
 * rolls under 100.
 *
 * Accuracy is rolled against evasion here, so a written 100 is a
 * promise the far side can break with a Double Team, a Sand Veil or
 * any accuracy drop, and a move with no accuracy at all is not. Read
 * flat, the two tied and the older move id won every time: that is
 * why a Charizard carried Wing Attack over the Aerial Ace beside it
 */
const NEVER_MISS_WORTH = 1.05;

/**
 * What a move that deals no damage is worth a slot for. Only the ones
 * that change a fight rather than decorate it, since a party fielding
 * two of these is a party that does not attack.
 *
 * They are priced against the attacks they displace: a stat-doubling
 * setup beats a mid attack, a heal matches one, and a crippling
 * status sits just under
 */
const STATUS_WORTH: Partial<Record<Moves, number>> = {
  // Setup: what a pokemon spends its first cast on when the rest of
  // the fight is worth more for it
  [Moves.SwordsDance]: 120,
  [Moves.DragonDance]: 120,
  [Moves.TailGlow]: 120,
  [Moves.CalmMind]: 115,
  [Moves.BellyDrum]: 110,
  [Moves.BulkUp]: 110,
  [Moves.Agility]: 85,
  [Moves.Growth]: 90,
  [Moves.Amnesia]: 90,
  [Moves.IronDefense]: 88,
  [Moves.CosmicPower]: 86,
  [Moves.DoubleTeam]: 85,

  // Health back, which is worth about what a hit takes off
  [Moves.Recover]: 105,
  [Moves.SoftBoiled]: 105,
  [Moves.MilkDrink]: 105,
  [Moves.SlackOff]: 105,
  [Moves.Synthesis]: 95,
  [Moves.MorningSun]: 95,
  [Moves.Moonlight]: 95,
  [Moves.Wish]: 85,

  // And taking somebody out of the fight without hitting them
  [Moves.Spore]: 115,
  [Moves.SleepPowder]: 100,
  [Moves.ThunderWave]: 100,
  [Moves.WillOWisp]: 100,
  [Moves.Toxic]: 85,
  [Moves.LeechSeed]: 100,
  [Moves.Substitute]: 80,
  [Moves.Glare]: 95,
  [Moves.StunSpore]: 95,
  [Moves.Screech]: 90,
  [Moves.Reflect]: 90,
  [Moves.LightScreen]: 90,
  [Moves.LovelyKiss]: 90,
  [Moves.Hypnosis]: 85,
  [Moves.Encore]: 85,
  [Moves.Taunt]: 85,
  [Moves.ConfuseRay]: 85,
  [Moves.Protect]: 85,
  [Moves.Yawn]: 85,
  [Moves.Sing]: 80,

  // What a support lays over its own side or under the other's. They
  // are priced low here and lifted by the role that wants them
  [Moves.Spikes]: 90,
  [Moves.Safeguard]: 80,
  [Moves.HealBell]: 85,
  [Moves.Aromatherapy]: 85,
  [Moves.Haze]: 80,
  [Moves.Mist]: 70,

  // Sleeping off everything at once, which is only a plan with
  // something to do while asleep
  [Moves.Rest]: 80,
  [Moves.SleepTalk]: 60,

  // What one of the six does for the other five. A support standing
  // behind two cores is the pokemon these were written for
  [Moves.HelpingHand]: 105,
  [Moves.FollowMe]: 100,
  [Moves.BatonPass]: 90,

  // The skies. Worth nothing on their own: what prices one is what
  // the build is waiting to do under it
  [Moves.SunnyDay]: 100,
  [Moves.RainDance]: 100,
  [Moves.Sandstorm]: 90,
  [Moves.Hail]: 90,
};

/**
 * What each of those is for. Anything absent is read as a cripple,
 * which is what most of the list is
 */
const STATUS_KINDS: Partial<Record<Moves, StatusKind>> = {
  [Moves.SwordsDance]: StatusKind.Setup,
  [Moves.DragonDance]: StatusKind.Setup,
  [Moves.TailGlow]: StatusKind.Setup,
  [Moves.CalmMind]: StatusKind.Setup,
  [Moves.BellyDrum]: StatusKind.Setup,
  [Moves.BulkUp]: StatusKind.Setup,
  [Moves.Agility]: StatusKind.Setup,
  [Moves.Growth]: StatusKind.Setup,
  [Moves.Amnesia]: StatusKind.Setup,
  [Moves.IronDefense]: StatusKind.Setup,
  [Moves.CosmicPower]: StatusKind.Setup,
  [Moves.DoubleTeam]: StatusKind.Setup,

  [Moves.Recover]: StatusKind.Heal,
  [Moves.SoftBoiled]: StatusKind.Heal,
  [Moves.MilkDrink]: StatusKind.Heal,
  [Moves.SlackOff]: StatusKind.Heal,
  [Moves.Synthesis]: StatusKind.Heal,
  [Moves.MorningSun]: StatusKind.Heal,
  [Moves.Moonlight]: StatusKind.Heal,
  [Moves.Wish]: StatusKind.Heal,
  [Moves.Rest]: StatusKind.Heal,
  [Moves.LeechSeed]: StatusKind.Heal,

  [Moves.Reflect]: StatusKind.Guard,
  [Moves.LightScreen]: StatusKind.Guard,
  [Moves.Protect]: StatusKind.Guard,
  [Moves.Substitute]: StatusKind.Guard,
  [Moves.Safeguard]: StatusKind.Guard,
  [Moves.HealBell]: StatusKind.Guard,
  [Moves.Aromatherapy]: StatusKind.Guard,
  [Moves.Mist]: StatusKind.Guard,
  [Moves.Haze]: StatusKind.Guard,
  [Moves.Spikes]: StatusKind.Guard,
  [Moves.SleepTalk]: StatusKind.Guard,

  [Moves.HelpingHand]: StatusKind.Ally,
  [Moves.FollowMe]: StatusKind.Ally,
  [Moves.BatonPass]: StatusKind.Ally,

  [Moves.SunnyDay]: StatusKind.Weather,
  [Moves.RainDance]: StatusKind.Weather,
  [Moves.Sandstorm]: StatusKind.Weather,
  [Moves.Hail]: StatusKind.Weather,
};

/**
 * The ones that raise something on the user, which is what a Baton
 * Pass has to have behind it to be worth passing
 */
export const SETUP_MOVES: ReadonlySet<Moves> = new Set(
  Object.entries(STATUS_KINDS)
    .filter(([, kind]) => kind === StatusKind.Setup)
    // tsc requires the assertion to produce Moves from the record
    // keys; tsgolint resolves the const enum to number
    // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
    .map(([move]) => Number(move) as Moves),
);

/**
 * What each role pays for each kind, and for an attack. A core is
 * built to hit and buys setup at face value; a support is built to
 * hold a fight open, so health, screens and everything that hampers
 * the far side are worth more to it than the attack they displace
 */
const ROLE_WEIGHTS: Record<BuildRole, { attack: number } & Record<StatusKind, number>> = {
  [BuildRole.Core]: {
    attack: 1,
    [StatusKind.Setup]: 1,
    [StatusKind.Heal]: 0.7,
    [StatusKind.Cripple]: 0.75,
    [StatusKind.Guard]: 0.6,
    [StatusKind.Weather]: 1,
    // A core spending a cast on somebody else's hit is a core not
    // taking its own
    [StatusKind.Ally]: 0.4,
  },
  [BuildRole.Support]: {
    attack: 0.8,
    [StatusKind.Setup]: 0.55,
    [StatusKind.Heal]: 1.3,
    [StatusKind.Cripple]: 1.3,
    [StatusKind.Guard]: 1.35,
    [StatusKind.Weather]: 1.1,
    // And a support's whole job is the two in front of it
    [StatusKind.Ally]: 1.4,
  },
};

/**
 * How many slots a role gives to moves that deal no damage. A support
 * is half a sheet of them and half attacks: three left it with one
 * way to hurt anybody, which is a pokemon the far side can ignore
 * while it deals with the cores
 */
const ROLE_QUIET_SLOTS: Record<BuildRole, number> = {
  [BuildRole.Core]: 1,
  [BuildRole.Support]: 2,
};

/** The abilities that bring their own sky, so nothing has to cast one */
export const ABILITY_WEATHER = new Map<Abilities, Weathers>([
  [Abilities.Drought, Weathers.Sunny],
  [Abilities.Drizzle, Weathers.Rain],
  [Abilities.SandStream, Weathers.Sandstorm],
  [Abilities.SnowWarning, Weathers.Hail],
]);

/**
 * The abilities that do nothing until somebody calls the sky up, and
 * which sky they are waiting for. A holder of one is what makes a
 * Sunny Day worth a slot
 */
export const ABILITY_WANTS_WEATHER = new Map<Abilities, Weathers>([
  [Abilities.Chlorophyll, Weathers.Sunny],
  [Abilities.SolarPower, Weathers.Sunny],
  [Abilities.LeafGuard, Weathers.Sunny],
  [Abilities.SwiftSwim, Weathers.Rain],
  [Abilities.RainDish, Weathers.Rain],
  [Abilities.DrySkin, Weathers.Rain],
  [Abilities.Hydration, Weathers.Rain],
  [Abilities.SandRush, Weathers.Sandstorm],
  [Abilities.SandForce, Weathers.Sandstorm],
  [Abilities.SandVeil, Weathers.Sandstorm],
  [Abilities.SlushRush, Weathers.Hail],
  [Abilities.IceBody, Weathers.Hail],
  [Abilities.SnowCloak, Weathers.Hail],
]);

/**
 * What each sky is worth to a type: the one it lifts, the one it
 * damps, and by how much. A sandstorm lifts Rock and damps nothing
 */
export const WEATHER_TYPES = new Map<Weathers, { up: Types; down?: Types; factor: number }>([
  [Weathers.Sunny, { up: Types.Fire, down: Types.Water, factor: 1.5 }],
  [Weathers.Rain, { up: Types.Water, down: Types.Fire, factor: 1.5 }],
  [Weathers.Sandstorm, { up: Types.Rock, factor: 1.2 }],
]);

/** The moves that put something to sleep, which is what Dream Eater waits for */
const SLEEP_MOVES = new Set<Moves>([
  Moves.Spore,
  Moves.SleepPowder,
  Moves.Hypnosis,
  Moves.LovelyKiss,
  Moves.Sing,
  Moves.Yawn,
]);

/**
 * The moves whose worth is a promise the rest of the sheet has to
 * keep, and what keeps it. A Focus Punch behind a Substitute is a
 * different move from a Focus Punch alone, and this is the whole of
 * how the builder knows
 */
const MOVE_PARTNERS: Partial<Record<Moves, (chosen: ReadonlySet<Moves>) => boolean>> = {
  [Moves.DreamEater]: (chosen) => [...SLEEP_MOVES].some((move) => chosen.has(move)),
  [Moves.FocusPunch]: (chosen) => chosen.has(Moves.Substitute),
  [Moves.SleepTalk]: (chosen) => chosen.has(Moves.Rest),
  [Moves.Rest]: (chosen) => chosen.has(Moves.SleepTalk),
  // A Baton Pass with nothing raised passes nothing
  [Moves.BatonPass]: (chosen) =>
    [...chosen].some((move) => STATUS_KINDS[move] === StatusKind.Setup),
};

/** What a move promising more than it can keep is worth without its partner */
const UNPARTNERED = 0.5;

/**
 * What the build knows about itself while it is being scored: the
 * sheet so far, the sky it will fight under, and what it is for
 */
export interface BuildContext {
  role: BuildRole;
  abilities: Abilities[];
  /** The sky an ability brings or a chosen move calls up */
  weather: Weathers;
  /** What the build has taken so far, which the pairings read */
  chosen: ReadonlySet<Moves>;
  /** How many of the party already bring each move */
  taken: ReadonlyMap<Moves, number>;
  /**
   * Whether this pokemon may spend a slot calling a sky up. A party
   * calls one up once: the other five fight under it and spend their
   * slots on what it is worth to them
   */
  setter: boolean;
  /**
   * Whether `weather` is the party's answer rather than this
   * pokemon's own guess. A planned sky is the only one it may cast;
   * planning alone, it asks of each sky whether anything is waiting
   */
  planned: boolean;
}

/**
 * What a second Protect on the same team is worth against the first.
 * Four supports scored alone all reach for the same three moves, and
 * a party that lays one screen four times has laid it once
 */
const REPEATED_SUPPORT = 0.55;

/**
 * What an attack somebody else already brings is worth against the
 * first copy of it. A team of four Earthquakes answers one wall four
 * times and everything else never, so a repeat has to lose to the
 * second-best move of its own type.
 *
 * A move the pokemon gets its own bonus from is barely docked: two
 * Water types both carrying Surf is two pokemon casting what they are
 * best at, which is not the same mistake as four coverage moves
 */
const REPEATED_ATTACK = 0.6;
const REPEATED_STAB = 0.88;

/** How this pokemon is being built, and what its team already holds */
export interface BuildOptions {
  role?: BuildRole;
  /** How many of the party already bring each move */
  taken?: ReadonlyMap<Moves, number>;
  /**
   * The sky the whole party fights under, where the party settled one:
   * an ally's Drought, or an ally's Sunny Day. Left out, the pokemon
   * plans its own weather and casts its own setter
   */
  weather?: Weathers;
  /**
   * Whether this is the member the party asked to call that sky up.
   * Only meaningful beside `weather`
   */
  setter?: boolean;
}

/**
 * Which half of the split a setup move serves, so a Dragon Dance is
 * not offered to something that never swings and a Calm Mind is not
 * offered to something that never blasts. The ones that raise a
 * defence or a speed serve either, and are absent
 */
const SETUP_CATEGORY: Partial<Record<Moves, MoveCategories>> = {
  [Moves.SwordsDance]: MoveCategories.Physical,
  [Moves.BellyDrum]: MoveCategories.Physical,
  [Moves.BulkUp]: MoveCategories.Physical,
  [Moves.DragonDance]: MoveCategories.Physical,
  [Moves.CalmMind]: MoveCategories.Special,
  [Moves.TailGlow]: MoveCategories.Special,
  [Moves.Growth]: MoveCategories.Special,
};

/**
 * How much a type opens up, from what it hits for double. Normal
 * reaches nothing at all and Ground reaches five, and a move is worth
 * what it lets its holder reach as well as what it hits for
 */
const COVERAGE_FLOOR = 0.8;
const COVERAGE_STEP = 0.06;

const COVERAGE = new Map<Types, number>();

function coverageWeight(type: Types): number {
  const known = COVERAGE.get(type);

  if (known != null) {
    return known;
  }

  const reach = Object.values(TYPE_EFFECTIVENESS[type]).filter(
    (effect) => effect === TypeEffectiveness.Effective,
  ).length;
  const weight = COVERAGE_FLOOR + COVERAGE_STEP * reach;

  COVERAGE.set(type, weight);
  return weight;
}

/**
 * What a move costs beyond what its entry says.
 *
 * Power, accuracy and wind-up steps are all in a move's data, so
 * nothing that is only those appears here. What is left is the moves
 * whose whole character is a drawback the registry has no field for:
 * a recharge, a recoil, a condition that has to already be true. A
 * factor of 0 is a move an expert is never built with
 */
const MOVE_DRAWBACKS: Partial<Record<Moves, number>> = {
  // The pokemon is not there afterwards, which no amount of power
  // pays for on a team of three
  [Moves.Explosion]: 0,
  [Moves.SelfDestruct]: 0,

  // Landing one and then standing still for the next
  [Moves.HyperBeam]: 0.5,
  [Moves.BlastBurn]: 0.5,
  [Moves.HydroCannon]: 0.5,
  [Moves.FrenzyPlant]: 0.5,

  // Worth its power only where nothing touched the user first
  [Moves.FocusPunch]: 0.5,
  // And only against something already asleep
  [Moves.DreamEater]: 0.5,
  // Paid for later rather than now
  [Moves.FutureSight]: 0.7,
  [Moves.DoomDesire]: 0.7,

  // The ones that pay for the swing out of the swinger. A fight here
  // is cast after cast rather than turn after turn, so a move that
  // halves the stat it just fired from is worth its face value once
  // and much less every time after
  [Moves.Overheat]: 0.6,
  [Moves.PsychoBoost]: 0.6,
  // Both of its drops are a stage rather than two, and one of them is
  // a defence it may not have been using anyway
  [Moves.Superpower]: 0.75,
};

/**
 * The moves that hurt their user, whether by recoil or by the
 * confusion at the end of a rampage. They are priced against the
 * pokemon rather than flatly: the same recoil that a Snorlax shrugs
 * off is most of a Gengar and the whole of a Shedinja
 */
const SELF_HURTING = new Set<Moves>([
  Moves.DoubleEdge,
  Moves.TakeDown,
  Moves.Submission,
  Moves.VoltTackle,
  Moves.Thrash,
  Moves.PetalDance,
  Moves.Outrage,
]);

/** What one of those costs at its cheapest, and the HP that buys it */
const SELF_HURT_FACTOR = 0.7;
const SELF_HURT_HEALTH = 70;

function selfHurtFactor(species: Species, move: Moves): number {
  if (!SELF_HURTING.has(move)) {
    return 1;
  }
  const health = getSpeciesData(species).stats[Stats.HP];

  return SELF_HURT_FACTOR * Math.min(1, health / SELF_HURT_HEALTH);
}

/**
 * Which stat the species really attacks with, and how much of a
 * discount the other one takes. A move cast off the weaker of the two
 * is worth the share it can actually reach for
 */
function categoryShare(species: Species, category: MoveCategories, abilities: Abilities[]): number {
  const stats = getSpeciesData(species).stats;
  const held = new Set(abilities);
  // The abilities that double the attack stat make a special attacker
  // physical, which is exactly what they are for
  const doubled = held.has(Abilities.HugePower) || held.has(Abilities.PurePower) ? 2 : 1;
  const physical = stats[Stats.Attack] * doubled;
  const special = stats[Stats.SpecialAttack];
  const best = Math.max(1, physical, special);

  // Squared, so the weaker of the two falls away rather than merely
  // trailing: a pokemon that can hit from its good side almost always
  // has something there worth casting
  if (category === MoveCategories.Physical) {
    return (physical / best) ** 2;
  }
  if (category === MoveCategories.Special) {
    return (special / best) ** 2;
  }
  return 0;
}

/**
 * What the ability does to this move in particular. Only the ones the
 * registry can actually answer for: a Punch, a recoil and a secondary
 * effect are none of them in a move's data, so Iron Fist, Reckless
 * and Sheer Force weigh nothing here rather than being guessed at
 */
function abilityFactor(move: Moves, context: BuildContext, types: Types[]): number {
  const data = getMoveData(move);
  const held = new Set(context.abilities);
  let factor = 1;

  if (held.has(Abilities.Technician) && (data.power ?? 0) <= 60) {
    factor *= 1.5;
  }
  if (held.has(Abilities.StrongJaw) && data.flags & MoveFlags.Bite) {
    factor *= 1.5;
  }
  if (held.has(Abilities.Sharpness) && data.flags & MoveFlags.Slicing) {
    factor *= 1.5;
  }
  if (held.has(Abilities.Hustle) && data.category === MoveCategories.Physical) {
    // It buys power with accuracy, so a move that already misses is
    // the wrong place to spend it
    factor *= 1.5 * 0.8;
  }
  if (held.has(Abilities.Guts) && data.category === MoveCategories.Physical) {
    // Only while something is wrong with it, which is not most of the
    // time: worth a lean rather than a multiplier
    factor *= 1.1;
  }
  // The pinches, which only pay while the fight is going badly
  if (
    (held.has(Abilities.Overgrow) && data.type === Types.Grass) ||
    (held.has(Abilities.Blaze) && data.type === Types.Fire) ||
    (held.has(Abilities.Torrent) && data.type === Types.Water) ||
    (held.has(Abilities.Swarm) && data.type === Types.Bug)
  ) {
    factor *= 1.1;
  }
  // And the sky the build fights under, whether an ability brought it
  // or something on the sheet calls it up: one type is worth more
  // under it and its opposite is worth half
  const raised = WEATHER_TYPES.get(context.weather);

  if (raised != null) {
    if (data.type === raised.up) {
      factor *= raised.factor;
    } else if (data.type === raised.down) {
      factor *= 0.5;
    }
  }
  // Its own types hit harder for holding them, and one ability makes
  // that worth more than it is for anybody else
  if (types.includes(data.type)) {
    factor *= held.has(Abilities.Adaptability) ? 2 : 1.5;
  }
  return factor;
}

/**
 * Whether this build has anything waiting for that sky: an ability
 * that sleeps without it, or a move already taken that the weather
 * sharpens. A sky nobody is waiting for is a wasted cast
 */
function wantsWeather(context: BuildContext, weather: Weathers): boolean {
  for (const ability of context.abilities) {
    if (ABILITY_WANTS_WEATHER.get(ability) === weather) {
      return true;
    }
  }
  if (weather === Weathers.Sunny) {
    return context.chosen.has(Moves.SolarBeam) || context.chosen.has(Moves.Synthesis);
  }
  if (weather === Weathers.Rain) {
    return context.chosen.has(Moves.Thunder);
  }
  if (weather === Weathers.Hail) {
    return context.chosen.has(Moves.Blizzard);
  }
  return false;
}

/**
 * What the sky does to a move beyond its type: the two that stop
 * missing under their own weather, and the one that stops winding up
 */
function weatherAccuracy(move: Moves, context: BuildContext): number | null | undefined {
  // Both stop rolling entirely under their own sky, rather than
  // rolling at 100, so they are worth what a Swift is worth
  if (move === Moves.Thunder && context.weather === Weathers.Rain) {
    return null;
  }
  if (move === Moves.Blizzard && context.weather === Weathers.Hail) {
    return null;
  }
  return undefined;
}

/**
 * What a copy of somebody else's move is worth against the ones
 * already carrying it. Compounded, so a third Earthquake is docked
 * harder than a second and a fourth is out of the question
 */
function repeatedWorth(taken: number, stab: boolean): number {
  return (stab ? REPEATED_STAB : REPEATED_ATTACK) ** taken;
}

/** What one move is worth to this species, as effective power */
function moveWorth(species: Species, move: Moves, context: BuildContext): number {
  const data = getMoveData(move);
  const weights = ROLE_WEIGHTS[context.role];
  // A move promising something the rest of the sheet has to keep is
  // worth half of it until the partner is actually there
  const kept = MOVE_PARTNERS[move];
  const promise = kept == null || kept(context.chosen) ? 1 : UNPARTNERED;

  if (data.category === MoveCategories.Status) {
    const called = MOVE_WEATHERS.get(move);

    // A sky is called up once for the whole party: a member the party
    // did not ask spends the slot on something else. Planning alone,
    // the question is whether anything of its own is waiting for one,
    // and an ability that brings the sky answers it already
    if (called != null) {
      const brought = context.abilities.some((ability) => ABILITY_WEATHER.get(ability) === called);

      if (!context.setter || brought) {
        return 0;
      }
      if (context.planned ? called !== context.weather : !wantsWeather(context, called)) {
        return 0;
      }
    }
    const worth =
      (STATUS_WORTH[move] ?? 0) *
      weights[STATUS_KINDS[move] ?? StatusKind.Cripple] *
      REPEATED_SUPPORT ** (context.taken.get(move) ?? 0);
    const serves = SETUP_CATEGORY[move];

    // A boost is worth what the stat it raises is worth in these hands
    return (
      promise * (serves == null ? worth : worth * categoryShare(species, serves, context.abilities))
    );
  }

  const share = categoryShare(species, data.category, context.abilities);
  // `undefined` is "the sky has no opinion"; `null` is "it cannot
  // miss", which is also what a move with no accuracy of its own says
  const override = weatherAccuracy(move, context);
  const written = override === undefined ? data.accuracy : override;
  const accuracy =
    written == null ? NEVER_MISS_WORTH : Math.min(NEUTRAL_ACCURACY, written) / NEUTRAL_ACCURACY;
  const types = getSpeciesData(species).types;
  // A move that winds up first lands once for every cast it spends
  // getting there, so its power is spread across them. Solar Beam
  // under its own sun does not wind up at all
  const charged = move === Moves.SolarBeam && context.weather === Weathers.Sunny ? 0 : data.steps;
  const winding = 1 + (charged ?? 0);

  // What the party already throws, docked so the sixth sheet reaches
  // for something the other five do not have
  const repeated = repeatedWorth(context.taken.get(move) ?? 0, types.includes(data.type));

  return (
    (((data.power ?? 0) *
      share *
      accuracy *
      coverageWeight(data.type) *
      abilityFactor(move, context, types)) /
      winding) *
    (MOVE_DRAWBACKS[move] ?? 1) *
    selfHurtFactor(species, move) *
    weights.attack *
    promise *
    repeated
  );
}

/**
 * Where the scoring reads a species wrong. Empty until one turns up:
 * a set written here is taken whole, so it also has to be legal,
 * which a test checks against what the species can learn
 */
export const BEST_MOVE_OVERRIDES: Partial<Record<Species, Moves[]>> = {};

/** Whether a pass changed the sheet, which is what ends the loop */
function sameMoves(one: Moves[], two: Moves[]): boolean {
  return one.length === two.length && one.every((move, at) => move === two[at]);
}

/** The sky this build fights under, whichever way it gets one */
function buildWeather(abilities: Abilities[], chosen: ReadonlySet<Moves>): Weathers {
  for (const ability of abilities) {
    const brought = ABILITY_WEATHER.get(ability);

    if (brought != null) {
      return brought;
    }
  }
  for (const move of chosen) {
    const called = MOVE_WEATHERS.get(move);

    if (called != null) {
      return called;
    }
  }
  return Weathers.None;
}

/**
 * One pass of the pick, worth first.
 *
 * Coverage before repetition: the strongest of each type is taken
 * before a second of one already carried, since four ways to hit the
 * same thing is one way to hit it. The role says how many slots may
 * go to moves that deal no damage, and one attack is kept back for
 * even the quietest support: a pokemon that cannot hit is a pokemon
 * the other side ignores
 */
function pickMoves(species: Species, context: BuildContext): Moves[] {
  const scored = getLearnableMoves(species)
    .map((move) => ({ move, worth: moveWorth(species, move, context) }))
    .sort((one, two) => two.worth - one.worth || one.move - two.move);
  const worthwhile = scored.filter(({ worth }) => worth > 0);

  const chosen: Moves[] = [];
  const covered = new Set<Types>();
  const skipped: Moves[] = [];
  const quietSlots = Math.min(ROLE_QUIET_SLOTS[context.role], BEST_MOVE_COUNT - 1);
  let quiet = 0;

  // The member the party asked to call the sky up takes the slot
  // first. Scored against the rest it loses to a Leech Seed, and the
  // five pokemon built around that sun then fight without it
  if (context.planned && context.setter && context.weather !== Weathers.None) {
    const called = getWeatherMove(context.weather);

    if (called != null && getLearnableMoves(species).includes(called)) {
      chosen.push(called);
      quiet += 1;
    }
  }

  for (const { move } of worthwhile) {
    if (chosen.length >= BEST_MOVE_COUNT) {
      break;
    }

    const data = getMoveData(move);

    if (data.category === MoveCategories.Status) {
      // The last slot is an attack's, however good the quiet ones are
      if (quiet >= quietSlots || chosen.length >= BEST_MOVE_COUNT - 1) {
        continue;
      }
      quiet += 1;
      chosen.push(move);
      continue;
    }
    if (covered.has(data.type)) {
      skipped.push(move);
      continue;
    }
    covered.add(data.type);
    chosen.push(move);
  }

  // Whatever is left over fills the slots coverage could not: a
  // species with two types worth carrying still fights with four
  for (const move of skipped) {
    if (chosen.length >= BEST_MOVE_COUNT) {
      break;
    }
    chosen.push(move);
  }

  // And a species the scoring found nothing to say about still walks
  // in with four: a Wobbuffet's whole sheet is worth nothing by
  // power, and it is what a Wobbuffet fights with
  if (chosen.length < BEST_MOVE_COUNT) {
    const held = new Set(chosen);
    // Anything that hits at all before anything that does not, so a
    // sheet the scoring could not price still comes out the right
    // shape rather than four quiet moves
    const leftover = [
      ...scored.filter(({ move }) => getMoveData(move).category !== MoveCategories.Status),
      ...scored.filter(({ move }) => getMoveData(move).category === MoveCategories.Status),
    ];

    for (const { move } of leftover) {
      if (chosen.length >= BEST_MOVE_COUNT) {
        break;
      }
      if (!held.has(move)) {
        held.add(move);
        chosen.push(move);
      }
    }
  }
  return chosen;
}

/**
 * How many times the pick is taken again with what it just chose in
 * hand. A pairing only shows up on the pass after its partner landed,
 * and a sky only prices its payoffs once something called it, so the
 * set is settled by repetition rather than by a special case each
 */
const BUILD_PASSES = 4;

/**
 * The four this species is best built with for the job it was given.
 *
 * Picked, then picked again knowing what the first pass took: a
 * Sunny Day makes the Solar Beam beside it worth its slot, a
 * Substitute does the same for a Focus Punch, and a sleep move for a
 * Dream Eater. Two or three passes settle it; the loop stops as soon
 * as a pass changes nothing
 */
export function getBestMoves(
  species: Species,
  abilities: Abilities[] = [],
  options: BuildOptions = {},
): Moves[] {
  const written = BEST_MOVE_OVERRIDES[species];

  if (written != null) {
    return [...written];
  }

  const role = options.role ?? BuildRole.Core;
  const taken = options.taken ?? new Map<Moves, number>();
  const planned = options.weather;
  let chosen: Moves[] = [];

  for (let pass = 0; pass < BUILD_PASSES; pass++) {
    const held = new Set(chosen);
    // Under a party's sky the question is what to do with it; alone,
    // it is whether to call one at all
    const next = pickMoves(species, {
      role,
      abilities,
      weather: planned ?? buildWeather(abilities, held),
      chosen: held,
      taken,
      setter: planned == null || options.setter === true,
      planned: planned != null,
    });

    if (sameMoves(next, chosen)) {
      break;
    }
    chosen = next;
  }
  return chosen;
}
