import Abilities from '../ids/abilities';
import { MoveCategories, MoveFlags, Moves } from '../ids/moves';
import { Stats } from '../constants/stats';
import type { Species } from '../ids/species';
import { TYPE_EFFECTIVENESS, TypeEffectiveness, Types } from '../constants/types';
import { Weathers } from '../ids/status';
import { getLearnableMoves, getSpeciesData } from './__create';
import { getMoveData } from '../moves/__create';
import { isRecoilMove } from '../moves/recoil';
import { MOVE_WEATHERS, getWeatherMove } from '../moves/weather';
import { estimateMoveHits } from '../moves/multi-hit';
import { isRechargeMove } from '../moves/recharge';

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
 * What a pokemon is on the sheet it was built for. Two cores take
 * things off the field, one leaning on each half of the split, and the
 * four behind them each hold one job: keeping the side healed, keeping
 * it protected, drawing the hits, and hampering the far side
 */
export const enum BuildRole {
  /** Hits hardest from Special Attack */
  SpecialCore = 0,
  /** Hits hardest from Attack */
  PhysicalCore = 1,
  /** The frailest able to heal, cure or raise the rest of the side */
  Healer = 2,
  /** Screens, guards and whatever else keeps the whole side standing */
  Protector = 3,
  /** The bulkiest able to draw the other side's moves onto itself */
  Redirector = 4,
  /** Lays statuses and hazards on the other side */
  FieldControl = 5,
}

/** Whether a role is one of the two built to hit */
export function isCoreRole(role: BuildRole): boolean {
  return role === BuildRole.SpecialCore || role === BuildRole.PhysicalCore;
}

/** The core a species makes on its own, by the stronger of its two attacking stats */
export function coreRoleOf(species: Species): BuildRole {
  const stats = getSpeciesData(species).stats;

  return stats[Stats.Attack] > stats[Stats.SpecialAttack]
    ? BuildRole.PhysicalCore
    : BuildRole.SpecialCore;
}

/** The half of the split a core leans on, and nothing for the other roles */
export function coreCategory(role: BuildRole): MoveCategories | null {
  if (role === BuildRole.SpecialCore) {
    return MoveCategories.Special;
  }
  return role === BuildRole.PhysicalCore ? MoveCategories.Physical : null;
}

/** What a status move is for, which is what a role has an opinion about */
const enum StatusKind {
  /** A stat raised on the user, worth what the stat is worth to it */
  Setup = 0,
  /** Health back for the user */
  Heal = 1,
  /** A status or a drop laid on the other side */
  Cripple = 2,
  /** A screen or a guard laid over the whole side */
  Screen = 3,
  /** A sky, worth nothing unless something is waiting for it */
  Weather = 4,
  /** Something done for a teammate: a raise, a hand, a pass */
  Boost = 5,
  /** Health back for a teammate */
  Mend = 6,
  /** A status cleared off the side */
  Cure = 7,
  /** The user kept standing on its own: a Protect or a Substitute */
  Shield = 8,
  /** The other side's moves drawn onto the user */
  Redirect = 9,
  /** Something laid under the other side's feet */
  Hazard = 10,
  /** The field itself turned over: a room */
  Room = 11,
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
  [Moves.NastyPlot]: 115,
  [Moves.BellyDrum]: 110,
  [Moves.BulkUp]: 110,
  [Moves.Agility]: 85,
  [Moves.RockPolish]: 85,
  [Moves.Growth]: 90,
  [Moves.Amnesia]: 90,
  [Moves.IronDefense]: 88,
  [Moves.CosmicPower]: 86,
  [Moves.DefendOrder]: 86,
  [Moves.DoubleTeam]: 85,
  [Moves.Acupressure]: 80,
  [Moves.QuiverDance]: 120,
  [Moves.ShellSmash]: 120,
  [Moves.ShiftGear]: 115,
  [Moves.Coil]: 110,
  [Moves.HoneClaws]: 105,
  [Moves.WorkUp]: 100,
  [Moves.CottonGuard]: 88,
  [Moves.Autotomize]: 85,

  // Health back, which is worth about what a hit takes off
  [Moves.Recover]: 105,
  [Moves.SoftBoiled]: 105,
  [Moves.MilkDrink]: 105,
  [Moves.SlackOff]: 105,
  [Moves.Roost]: 105,
  [Moves.HealOrder]: 105,
  [Moves.Synthesis]: 95,
  [Moves.MorningSun]: 95,
  [Moves.Moonlight]: 95,
  [Moves.Wish]: 85,
  [Moves.AquaRing]: 85,

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
  [Moves.DarkVoid]: 90,
  [Moves.GastroAcid]: 80,
  [Moves.WorrySeed]: 75,
  [Moves.Captivate]: 70,
  [Moves.Hypnosis]: 85,
  [Moves.Encore]: 85,
  [Moves.Taunt]: 85,
  [Moves.ConfuseRay]: 85,
  [Moves.Protect]: 85,
  [Moves.Yawn]: 85,
  [Moves.Sing]: 80,
  // Changing what the target is rather than what it has, which only
  // sometimes matters
  [Moves.Soak]: 70,
  [Moves.PowerSplit]: 65,
  [Moves.GuardSplit]: 65,
  [Moves.SimpleBeam]: 60,
  [Moves.Entrainment]: 60,

  // What a support lays over its own side or under the other's. They
  // are priced low here and lifted by the role that wants them
  [Moves.Spikes]: 90,
  [Moves.StealthRock]: 90,
  [Moves.ToxicSpikes]: 85,
  // It changes who lands first rather than who acts more, and it
  // slows its own side's quick moves as much as the far side's
  [Moves.TrickRoom]: 70,
  [Moves.LuckyChant]: 70,
  [Moves.Safeguard]: 80,
  [Moves.HealBell]: 85,
  [Moves.Aromatherapy]: 85,
  [Moves.Haze]: 80,
  [Moves.Mist]: 70,
  [Moves.WideGuard]: 75,
  [Moves.QuickGuard]: 70,
  [Moves.MatBlock]: 70,
  [Moves.CraftyShield]: 65,
  [Moves.Detect]: 80,
  [Moves.Endure]: 60,
  [Moves.KingsShield]: 90,
  [Moves.SpikyShield]: 90,
  [Moves.StickyWeb]: 85,
  [Moves.Refresh]: 60,
  [Moves.AromaticMist]: 70,
  [Moves.AllySwitch]: 70,
  [Moves.WonderRoom]: 60,
  [Moves.MagicRoom]: 60,

  // Sleeping off everything at once, which is only a plan with
  // something to do while asleep
  [Moves.Rest]: 80,
  [Moves.SleepTalk]: 60,

  // What one of the six does for the other five. A support standing
  // behind two cores is the pokemon these were written for
  [Moves.HelpingHand]: 105,
  [Moves.FollowMe]: 100,
  [Moves.RagePowder]: 100,
  [Moves.HealPulse]: 95,
  [Moves.AfterYou]: 70,
  // Twice as often for the whole side while it blows
  [Moves.Tailwind]: 100,
  [Moves.BatonPass]: 90,
  // The user is spent to make a teammate whole, which only a support
  // standing behind two cores can afford
  [Moves.LunarDance]: 85,
  [Moves.HealingWish]: 80,

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
  [Moves.NastyPlot]: StatusKind.Setup,
  [Moves.BellyDrum]: StatusKind.Setup,
  [Moves.BulkUp]: StatusKind.Setup,
  [Moves.Agility]: StatusKind.Setup,
  [Moves.RockPolish]: StatusKind.Setup,
  [Moves.Growth]: StatusKind.Setup,
  [Moves.Amnesia]: StatusKind.Setup,
  [Moves.IronDefense]: StatusKind.Setup,
  [Moves.CosmicPower]: StatusKind.Setup,
  [Moves.DefendOrder]: StatusKind.Setup,
  [Moves.DoubleTeam]: StatusKind.Setup,
  [Moves.Acupressure]: StatusKind.Setup,
  [Moves.QuiverDance]: StatusKind.Setup,
  [Moves.ShellSmash]: StatusKind.Setup,
  [Moves.ShiftGear]: StatusKind.Setup,
  [Moves.Coil]: StatusKind.Setup,
  [Moves.HoneClaws]: StatusKind.Setup,
  [Moves.WorkUp]: StatusKind.Setup,
  [Moves.CottonGuard]: StatusKind.Setup,
  [Moves.Autotomize]: StatusKind.Setup,

  [Moves.Recover]: StatusKind.Heal,
  [Moves.SoftBoiled]: StatusKind.Heal,
  [Moves.MilkDrink]: StatusKind.Heal,
  [Moves.SlackOff]: StatusKind.Heal,
  [Moves.Synthesis]: StatusKind.Heal,
  [Moves.MorningSun]: StatusKind.Heal,
  [Moves.Moonlight]: StatusKind.Heal,
  [Moves.Roost]: StatusKind.Heal,
  [Moves.HealOrder]: StatusKind.Heal,
  [Moves.AquaRing]: StatusKind.Heal,
  [Moves.Rest]: StatusKind.Heal,
  [Moves.LeechSeed]: StatusKind.Heal,

  [Moves.Refresh]: StatusKind.Heal,

  [Moves.Reflect]: StatusKind.Screen,
  [Moves.LightScreen]: StatusKind.Screen,
  [Moves.Safeguard]: StatusKind.Screen,
  [Moves.Mist]: StatusKind.Screen,
  [Moves.Haze]: StatusKind.Screen,
  [Moves.LuckyChant]: StatusKind.Screen,
  [Moves.WideGuard]: StatusKind.Screen,
  [Moves.QuickGuard]: StatusKind.Screen,
  [Moves.MatBlock]: StatusKind.Screen,
  [Moves.CraftyShield]: StatusKind.Screen,
  [Moves.Tailwind]: StatusKind.Screen,

  [Moves.Protect]: StatusKind.Shield,
  [Moves.Detect]: StatusKind.Shield,
  [Moves.Endure]: StatusKind.Shield,
  [Moves.KingsShield]: StatusKind.Shield,
  [Moves.SpikyShield]: StatusKind.Shield,
  [Moves.Substitute]: StatusKind.Shield,
  [Moves.SleepTalk]: StatusKind.Shield,

  [Moves.HealBell]: StatusKind.Cure,
  [Moves.Aromatherapy]: StatusKind.Cure,

  [Moves.Spikes]: StatusKind.Hazard,
  [Moves.StealthRock]: StatusKind.Hazard,
  [Moves.ToxicSpikes]: StatusKind.Hazard,
  [Moves.StickyWeb]: StatusKind.Hazard,

  [Moves.TrickRoom]: StatusKind.Room,
  [Moves.WonderRoom]: StatusKind.Room,
  [Moves.MagicRoom]: StatusKind.Room,

  [Moves.HelpingHand]: StatusKind.Boost,
  [Moves.BatonPass]: StatusKind.Boost,
  [Moves.AfterYou]: StatusKind.Boost,
  [Moves.AromaticMist]: StatusKind.Boost,

  [Moves.HealPulse]: StatusKind.Mend,
  [Moves.Wish]: StatusKind.Mend,
  [Moves.HealingWish]: StatusKind.Mend,
  [Moves.LunarDance]: StatusKind.Mend,

  [Moves.FollowMe]: StatusKind.Redirect,
  [Moves.RagePowder]: StatusKind.Redirect,
  [Moves.AllySwitch]: StatusKind.Redirect,

  [Moves.SunnyDay]: StatusKind.Weather,
  [Moves.RainDance]: StatusKind.Weather,
  [Moves.Sandstorm]: StatusKind.Weather,
  [Moves.Hail]: StatusKind.Weather,
};

/**
 * The ones that raise something on the user, which is what a Baton
 * Pass has to have behind it to be worth passing
 */
export const SETUP_MOVES: ReadonlySet<Moves> = (() => {
  const moves = new Set<Moves>();

  for (const [move, kind] of Object.entries(STATUS_KINDS)) {
    if (kind === StatusKind.Setup) {
      // tsc requires the assertion to produce Moves from the record
      // keys; tsgolint resolves the const enum to number
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      moves.add(Number(move) as Moves);
    }
  }
  return moves;
})();

/**
 * What each role pays for each kind, and for an attack. The cores buy
 * their hits and the setup that sharpens them; each of the four behind
 * them pays most for the kinds its job is made of
 */
const ROLE_WEIGHTS: Record<BuildRole, { attack: number } & Record<StatusKind, number>> = {
  [BuildRole.SpecialCore]: coreWeights(),
  [BuildRole.PhysicalCore]: coreWeights(),
  [BuildRole.Healer]: {
    attack: 0.7,
    [StatusKind.Setup]: 0.5,
    [StatusKind.Heal]: 1.2,
    [StatusKind.Cripple]: 0.8,
    [StatusKind.Screen]: 0.9,
    [StatusKind.Weather]: 1.1,
    [StatusKind.Boost]: 1.5,
    [StatusKind.Mend]: 1.7,
    [StatusKind.Cure]: 1.6,
    [StatusKind.Shield]: 0.9,
    [StatusKind.Redirect]: 0.5,
    [StatusKind.Hazard]: 0.6,
    [StatusKind.Room]: 0.7,
  },
  [BuildRole.Protector]: {
    attack: 0.75,
    [StatusKind.Setup]: 0.6,
    [StatusKind.Heal]: 1.1,
    [StatusKind.Cripple]: 0.9,
    [StatusKind.Screen]: 1.8,
    [StatusKind.Weather]: 1.1,
    [StatusKind.Boost]: 1,
    [StatusKind.Mend]: 1,
    [StatusKind.Cure]: 1.1,
    [StatusKind.Shield]: 1.2,
    [StatusKind.Redirect]: 0.8,
    [StatusKind.Hazard]: 0.8,
    [StatusKind.Room]: 1,
  },
  [BuildRole.Redirector]: {
    attack: 0.8,
    [StatusKind.Setup]: 0.6,
    [StatusKind.Heal]: 1.4,
    [StatusKind.Cripple]: 0.9,
    [StatusKind.Screen]: 1,
    [StatusKind.Weather]: 1,
    [StatusKind.Boost]: 0.8,
    [StatusKind.Mend]: 0.6,
    [StatusKind.Cure]: 0.6,
    [StatusKind.Shield]: 1.3,
    [StatusKind.Redirect]: 1.9,
    [StatusKind.Hazard]: 0.6,
    [StatusKind.Room]: 0.6,
  },
  [BuildRole.FieldControl]: {
    attack: 0.8,
    [StatusKind.Setup]: 0.5,
    [StatusKind.Heal]: 0.9,
    [StatusKind.Cripple]: 1.6,
    [StatusKind.Screen]: 0.8,
    [StatusKind.Weather]: 1.1,
    [StatusKind.Boost]: 0.8,
    [StatusKind.Mend]: 0.5,
    [StatusKind.Cure]: 0.5,
    [StatusKind.Shield]: 0.9,
    [StatusKind.Redirect]: 0.5,
    [StatusKind.Hazard]: 1.5,
    [StatusKind.Room]: 1.2,
  },
};

/**
 * What a core pays: its hits and the setup that sharpens them, and
 * little for a cast spent on anybody else
 */
function coreWeights(): { attack: number } & Record<StatusKind, number> {
  return {
    attack: 1,
    [StatusKind.Setup]: 1,
    [StatusKind.Heal]: 0.7,
    [StatusKind.Cripple]: 0.75,
    [StatusKind.Screen]: 0.5,
    [StatusKind.Weather]: 1,
    [StatusKind.Boost]: 0.4,
    [StatusKind.Mend]: 0.3,
    [StatusKind.Cure]: 0.3,
    [StatusKind.Shield]: 0.6,
    [StatusKind.Redirect]: 0.2,
    [StatusKind.Hazard]: 0.6,
    [StatusKind.Room]: 0.6,
  };
}

/**
 * What a core's attacks from the half of the split it does not lean
 * on are worth, so a special core fills its sheet from Special Attack
 */
const OFF_SIDE_ATTACK = 0.6;

/**
 * How many slots a role gives to moves that deal no damage. Every
 * role keeps one attack: a pokemon that cannot hit is one the far side
 * ignores. The healer's job is almost all quiet moves
 */
const ROLE_QUIET_SLOTS: Record<BuildRole, number> = {
  [BuildRole.SpecialCore]: 1,
  [BuildRole.PhysicalCore]: 1,
  [BuildRole.Healer]: 3,
  [BuildRole.Protector]: 2,
  [BuildRole.Redirector]: 2,
  [BuildRole.FieldControl]: 2,
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
  Moves.DarkVoid,
  Moves.Sing,
  Moves.Yawn,
]);

/** The moves that poison, which is what Venoshock waits for */
const POISON_MOVES = new Set<Moves>([Moves.Toxic, Moves.PoisonPowder, Moves.PoisonGas]);

/** The moves that leave a status condition, which is what Hex waits for */
const STATUS_MOVES = new Set<Moves>([
  ...SLEEP_MOVES,
  ...POISON_MOVES,
  Moves.ThunderWave,
  Moves.StunSpore,
  Moves.Glare,
  Moves.WillOWisp,
]);

/** Whether the sheet holds any of these */
function holdsAny(chosen: ReadonlySet<Moves>, wanted: ReadonlySet<Moves>): boolean {
  for (const move of wanted) {
    if (chosen.has(move)) {
      return true;
    }
  }
  return false;
}

/**
 * The promises a species has to be able to keep at all, as the moves
 * that keep them. A Dream Eater on a line with nothing that puts
 * anybody to sleep is a promise it can never keep, however the slots
 * fall, so it is left out rather than discounted
 */
const MOVE_REQUIREMENTS: Partial<Record<Moves, ReadonlySet<Moves>>> = {
  [Moves.DreamEater]: SLEEP_MOVES,
  [Moves.SleepTalk]: new Set([Moves.Rest]),
  [Moves.FocusPunch]: new Set([Moves.Substitute]),
};

/** Whether the species can ever keep what this move promises */
function canKeepPromise(species: Species, move: Moves): boolean {
  const wanted = MOVE_REQUIREMENTS[move];

  if (wanted == null) {
    return true;
  }

  for (const learnable of getLearnableMoves(species)) {
    if (wanted.has(learnable)) {
      return true;
    }
  }
  return false;
}

/**
 * The moves whose worth is a promise the rest of the sheet has to
 * keep, and what keeps it. A Focus Punch behind a Substitute is a
 * different move from a Focus Punch alone, and this is the whole of
 * how the builder knows
 */
const MOVE_PARTNERS: Partial<Record<Moves, (chosen: ReadonlySet<Moves>) => boolean>> = {
  [Moves.DreamEater]: (chosen) => {
    for (const move of SLEEP_MOVES) {
      if (chosen.has(move)) {
        return true;
      }
    }
    return false;
  },
  [Moves.FocusPunch]: (chosen) => chosen.has(Moves.Substitute),
  [Moves.SleepTalk]: (chosen) => chosen.has(Moves.Rest),
  [Moves.Rest]: (chosen) => chosen.has(Moves.SleepTalk),
  [Moves.Hex]: (chosen) => holdsAny(chosen, STATUS_MOVES),
  [Moves.Venoshock]: (chosen) => holdsAny(chosen, POISON_MOVES),
  // A Stored Power with nothing raised is a 20 power move
  [Moves.StoredPower]: (chosen) => holdsAny(chosen, SETUP_MOVES),
  // A Baton Pass with nothing raised passes nothing
  [Moves.BatonPass]: (chosen) => {
    for (const move of chosen) {
      if (STATUS_KINDS[move] === StatusKind.Setup) {
        return true;
      }
    }
    return false;
  },
};

/** What a move promising more than it can keep is worth without its partner */
const UNPARTNERED = 0.5;

/** The kinds of quiet move each supporting role is made of */
const ROLE_KINDS: Partial<Record<BuildRole, readonly StatusKind[]>> = {
  [BuildRole.Healer]: [StatusKind.Mend, StatusKind.Cure, StatusKind.Boost],
  [BuildRole.Protector]: [StatusKind.Screen],
  [BuildRole.Redirector]: [StatusKind.Redirect],
  [BuildRole.FieldControl]: [StatusKind.Cripple, StatusKind.Hazard, StatusKind.Room],
};

/**
 * How well a species can do a supporting role's job with its moves:
 * the two best moves of the kinds the job is made of, on the scale
 * where 1 is a quiet move worth an ordinary hit. Nothing it can learn
 * is zero
 */
export function roleCapability(species: Species, role: BuildRole): number {
  const kinds = ROLE_KINDS[role];

  if (kinds == null) {
    return 0;
  }

  const found: number[] = [];

  for (const move of getLearnableMoves(species)) {
    const worth = STATUS_WORTH[move];
    const kind = STATUS_KINDS[move] ?? StatusKind.Cripple;

    if (worth != null && kinds.includes(kind)) {
      found.push(worth / 100);
    }
  }
  found.sort((one, two) => two - one);
  return (found[0] ?? 0) + (found[1] ?? 0);
}

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
  /** The rest of the party, which a move may be aimed at */
  allies: readonly BuildAlly[];
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

/** A teammate as the build sees it: what it is and what it fights with */
export interface BuildAlly {
  species: Species;
  abilities: Abilities[];
  role: BuildRole;
}

/** How this pokemon is being built, and what its team already holds */
export interface BuildOptions {
  role?: BuildRole;
  /** How many of the party already bring each move */
  taken?: ReadonlyMap<Moves, number>;
  /** The rest of the party, which a move may be aimed at */
  allies?: readonly BuildAlly[];
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
  [Moves.ShiftGear]: MoveCategories.Physical,
  [Moves.Coil]: MoveCategories.Physical,
  [Moves.HoneClaws]: MoveCategories.Physical,
  [Moves.QuiverDance]: MoveCategories.Special,
  [Moves.CalmMind]: MoveCategories.Special,
  [Moves.NastyPlot]: MoveCategories.Special,
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

  let reach = 0;

  for (const effect of Object.values(TYPE_EFFECTIVENESS[type])) {
    if (effect === TypeEffectiveness.Effective) {
      reach += 1;
    }
  }

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

  // Worth nothing until every other move on the sheet has been cast,
  // so it is a wasted slot for most of a fight
  [Moves.LastResort]: 0.3,

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
  // Its drops land on defences and Speed rather than the stat it fired from
  [Moves.VCreate]: 0.75,
};

/** The abilities that spare the user each kind of cost */
const CONFUSION_PROOF = new Set<Abilities>([Abilities.OwnTempo]);
const RECOIL_PROOF = new Set<Abilities>([Abilities.RockHead, Abilities.MagicGuard]);
const SLEEP_PROOF = new Set<Abilities>([Abilities.Insomnia, Abilities.VitalSpirit]);

function holdsAbility(abilities: readonly Abilities[], wanted: ReadonlySet<Abilities>): boolean {
  for (const ability of abilities) {
    if (wanted.has(ability)) {
      return true;
    }
  }
  return false;
}

/**
 * What a move that leaves the user standing still afterwards is worth.
 * The recharge is a whole cast spent doing nothing, so the move is
 * worth about half of what its power says
 */
const RECHARGE_FACTOR = 0.5;

/** The drawbacks that are a drop on the user, which Contrary turns into a rise */
const SELF_DROPPING = new Set<Moves>([Moves.Overheat, Moves.PsychoBoost, Moves.Superpower]);

/**
 * The moves aimed at an enemy that a teammate's ability turns into a
 * gift: a flattery for one that cannot be confused, and a drop for one
 * whose Contrary turns it round. Each names the stat it moves and by
 * how much, as written for an enemy
 */
const ALLY_STAGE_MOVES: Partial<Record<Moves, { stat: Stats; stages: number }>> = {
  [Moves.Swagger]: { stat: Stats.Attack, stages: 2 },
  [Moves.Flatter]: { stat: Stats.SpecialAttack, stages: 1 },
  [Moves.Charm]: { stat: Stats.Attack, stages: -2 },
  [Moves.FeatherDance]: { stat: Stats.Attack, stages: -2 },
  [Moves.Tickle]: { stat: Stats.Attack, stages: -1 },
  [Moves.Screech]: { stat: Stats.Defense, stages: -2 },
  [Moves.MetalSound]: { stat: Stats.SpecialDefense, stages: -2 },
  [Moves.FakeTears]: { stat: Stats.SpecialDefense, stages: -2 },
  [Moves.ScaryFace]: { stat: Stats.Speed, stages: -2 },
};

/** The ones that confuse as well, which only a teammate that cannot be confused wants */
const FLATTERY_MOVES = new Set<Moves>([Moves.Swagger, Moves.Flatter]);

/** What 2 stages of a stat are worth, priced as the setup move that raises them */
const RAISE_WORTH: Partial<Record<Stats, number>> = {
  [Stats.Attack]: 120,
  [Stats.SpecialAttack]: 115,
  [Stats.Defense]: 88,
  [Stats.SpecialDefense]: 90,
  [Stats.Speed]: 85,
};

/** The attacking stats, and the half of the split each one serves */
const STAT_CATEGORY: Partial<Record<Stats, MoveCategories>> = {
  [Stats.Attack]: MoveCategories.Physical,
  [Stats.SpecialAttack]: MoveCategories.Special,
};

/** What the move is worth cast at the teammate it helps most */
function allyWorth(move: Moves, allies: readonly BuildAlly[]): number {
  const raised = ALLY_STAGE_MOVES[move];

  if (raised == null) {
    return 0;
  }

  let best = 0;

  for (const ally of allies) {
    if (FLATTERY_MOVES.has(move) && !holdsAbility(ally.abilities, CONFUSION_PROOF)) {
      continue;
    }

    const stages = ally.abilities.includes(Abilities.Contrary) ? -raised.stages : raised.stages;

    if (stages <= 0) {
      continue;
    }

    const category = STAT_CATEGORY[raised.stat];
    const share = category == null ? 1 : categoryShare(ally.species, category, ally.abilities);

    // Worth to the teammate what setup is worth to its own role
    const worth =
      (((RAISE_WORTH[raised.stat] ?? 0) * Math.min(stages, 2) * share) / 2) *
      ROLE_WEIGHTS[ally.role][StatusKind.Setup];

    best = Math.max(best, worth);
  }
  return best;
}

/** Whether the user's own ability makes the move do nothing, or worse */
function selfDefeating(move: Moves, abilities: Abilities[]): boolean {
  // Every setup move raises the user, which Contrary turns into a drop
  if (STATUS_KINDS[move] === StatusKind.Setup && abilities.includes(Abilities.Contrary)) {
    return true;
  }
  // Rest heals by sleeping, and a user that cannot sleep cannot rest
  return move === Moves.Rest && holdsAbility(abilities, SLEEP_PROOF);
}

/** The rampages, whose cost is the confusion rather than a recoil */
const FATIGUING = new Set<Moves>([Moves.Thrash, Moves.PetalDance, Moves.Outrage]);

/** The moves that strike on every step, so their steps are not a wind-up */
const RAMPAGES = new Set<Moves>([...FATIGUING, Moves.Uproar]);

/** What one of those costs at its cheapest, and the HP that buys it */
const SELF_HURT_FACTOR = 0.7;
const SELF_HURT_HEALTH = 70;

/**
 * What a move that hurts its user, by recoil or by the confusion at the
 * end of a rampage, is worth. Priced against the pokemon rather than
 * flatly: the same recoil that a Snorlax shrugs off is most of a Gengar
 * and the whole of a Shedinja
 */
function selfHurtFactor(species: Species, move: Moves, abilities: Abilities[]): number {
  // The recoil table is shared with the mechanic, so a move added there is priced here too
  if (
    (!isRecoilMove(move) && !FATIGUING.has(move)) ||
    holdsAbility(abilities, FATIGUING.has(move) ? CONFUSION_PROOF : RECOIL_PROOF)
  ) {
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

/**
 * What a move with no power of its own is worth, read as the power a
 * plain move would need to do the same.
 *
 * A move's `power` is null where the engine works the figure out at
 * the cast: off a level, off a health bar, off a weight. Multiplying
 * by null gives nothing, so every one of these was invisible to the
 * builder and a Blissey was handed a Fire Blast to cast off 75 special
 * attack rather than the Seismic Toss beside it.
 *
 * The figures are what the move comes to against something its own
 * level, and a move left out is one an expert is never built with:
 * the one-hit knockouts, which are a 30% roll, and the ones that
 * answer a blow rather than throw one (Counter, Mirror Coat, Metal
 * Burst, Bide), which the AI has no way to set up
 */
const ESTIMATED_POWER: Partial<Record<Moves, number>> = {
  // A level's worth of damage, flat: reliable, and never more than that
  [Moves.SeismicToss]: 70,
  [Moves.NightShade]: 70,
  [Moves.Psywave]: 55,
  // Half of what the target has left. It never finishes anything, so
  // it is worth less than the figure suggests
  [Moves.SuperFang]: 80,
  // Fixed amounts, which a fight at this level has outgrown
  [Moves.DragonRage]: 30,
  [Moves.SonicBoom]: 15,

  // How friendly the pokemon is, and an expert's is freshly staged
  [Moves.Return]: 90,
  [Moves.Frustration]: 40,
  // A type and a power that are whatever the pokemon was born with
  [Moves.HiddenPower]: 60,
  // Off the weight of whoever is hit, which averages out about here
  [Moves.GrassKnot]: 60,
  [Moves.LowKick]: 60,
  [Moves.WringOut]: 80,
  [Moves.CrushGrip]: 80,
  // Only while the user is nearly gone, which is not where a fight is
  // spent
  [Moves.Flail]: 45,
  [Moves.Reversal]: 45,
  [Moves.Endeavor]: 40,
  // Off the stages the target has taken, or the user has
  [Moves.Punishment]: 60,
  [Moves.StoredPower]: 40,
  // What is left in the bag, or what the last of it does
  [Moves.TrumpCard]: 60,
  [Moves.Present]: 40,
  [Moves.Fling]: 40,
  [Moves.NaturalGift]: 60,
  [Moves.SpitUp]: 50,
  // The ground's own roll
  [Moves.Magnitude]: 71,
};

/**
 * The ones whose figure the species itself answers: how heavy it is,
 * or how fast. Worked out rather than tabled, so a heavy pokemon is
 * handed the move that wants weight
 */
function speciesPower(species: Species, move: Moves): number | undefined {
  const data = getSpeciesData(species);

  // Thrown by weight: a Snorlax lands these at the cap and a Gengar
  // barely at all
  if (move === Moves.HeavySlam || move === Moves.HeatCrash) {
    return Math.min(120, 40 + data.weight);
  }
  // Thrown by speed, and worth most to something quick
  if (move === Moves.ElectroBall) {
    return Math.min(120, 30 + data.stats[Stats.Speed] / 2);
  }
  // The other way round: a slow pokemon throws the heaviest gear
  if (move === Moves.GyroBall) {
    return Math.min(120, 140 - data.stats[Stats.Speed]);
  }
  return undefined;
}

/** What the move hits for, whether the registry says so or the engine works it out */
function powerOf(species: Species, move: Moves): number {
  return getMoveData(move).power ?? speciesPower(species, move) ?? ESTIMATED_POWER[move] ?? 0;
}

/**
 * How much of a cast a move's wind-up costs, read the way the engine
 * reads it: priority is frames off the cast, so a Bullet Punch is
 * thrown in about six sevenths of the time a plain move takes and is
 * worth that much more for it
 */
const CAST_FRAMES = 104;
const PRIORITY_FRAMES = 16;

function priorityFactor(move: Moves): number {
  const priority = getMoveData(move).priority ?? 0;

  if (priority === 0) {
    return 1;
  }
  return CAST_FRAMES / Math.max(PRIORITY_FRAMES, CAST_FRAMES - priority * PRIORITY_FRAMES);
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
      let brought = false;

      for (const ability of context.abilities) {
        if (ABILITY_WEATHER.get(ability) === called) {
          brought = true;
          break;
        }
      }

      if (!context.setter || brought) {
        return 0;
      }
      if (context.planned ? called !== context.weather : !wantsWeather(context, called)) {
        return 0;
      }
    }
    const serves = SETUP_CATEGORY[move];
    // A boost is worth what the stat it raises is worth in these hands
    const own = selfDefeating(move, context.abilities)
      ? 0
      : (STATUS_WORTH[move] ?? 0) *
        weights[STATUS_KINDS[move] ?? StatusKind.Cripple] *
        (serves == null ? 1 : categoryShare(species, serves, context.abilities));
    // Or what it is worth cast at the teammate it helps, where it helps one
    const aimed = allyWorth(move, context.allies) * weights[StatusKind.Boost];

    return promise * Math.max(own, aimed) * REPEATED_SUPPORT ** (context.taken.get(move) ?? 0);
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
  const charged =
    (move === Moves.SolarBeam && context.weather === Weathers.Sunny) || RAMPAGES.has(move)
      ? 0
      : data.steps;
  const winding = 1 + (charged ?? 0);

  // What the party already throws, docked so the sixth sheet reaches
  // for something the other five do not have
  const repeated = repeatedWorth(context.taken.get(move) ?? 0, types.includes(data.type));

  // A move that strikes several times is worth what all of them come
  // to, which is what makes a Skill Link worth awakening
  const landed =
    powerOf(species, move) *
    estimateMoveHits(move, context.abilities.includes(Abilities.SkillLink));

  return (
    ((landed *
      share *
      accuracy *
      coverageWeight(data.type) *
      priorityFactor(move) *
      abilityFactor(move, context, types)) /
      winding) *
    (isRechargeMove(move) ? RECHARGE_FACTOR : 1) *
    (SELF_DROPPING.has(move) && context.abilities.includes(Abilities.Contrary)
      ? 1
      : (MOVE_DRAWBACKS[move] ?? 1)) *
    selfHurtFactor(species, move, context.abilities) *
    weights.attack *
    (coreCategory(context.role) == null || coreCategory(context.role) === data.category
      ? 1
      : OFF_SIDE_ATTACK) *
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
  if (one.length !== two.length) {
    return false;
  }
  for (const [at, move] of one.entries()) {
    if (move !== two[at]) {
      return false;
    }
  }
  return true;
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
  const scored: { move: Moves; worth: number }[] = [];

  for (const move of getLearnableMoves(species)) {
    if (canKeepPromise(species, move)) {
      scored.push({ move, worth: moveWorth(species, move, context) });
    }
  }
  scored.sort((one, two) => two.worth - one.worth || one.move - two.move);

  const worthwhile: { move: Moves; worth: number }[] = [];

  for (const entry of scored) {
    if (entry.worth > 0) {
      worthwhile.push(entry);
    }
  }

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
    const hits: Moves[] = [];
    const silent: Moves[] = [];

    for (const { move } of scored) {
      if (getMoveData(move).category === MoveCategories.Status) {
        silent.push(move);
      } else {
        hits.push(move);
      }
    }

    for (const move of [...hits, ...silent]) {
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

  const role = options.role ?? coreRoleOf(species);
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
      allies: options.allies ?? [],
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
