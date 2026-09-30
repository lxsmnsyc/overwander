import { MoveAffects, MoveCategories, MoveTargets, Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import { MOVE_WEATHERS } from '../../data/moves/weather';
import { ABILITY_MOVES } from '../moves/ability-moves';
import { ABSORB_MOVES } from '../moves/absorb';
import { WORN } from '../moves/aqua-ring';
import { CRASH_MOVES } from '../moves/crash';
import { FIELD_STAT_MOVES } from '../moves/field-stats';
import { FIXED_DAMAGE_MOVES, HEALTH_SCALED_MOVES, OHKO_MOVES } from '../moves/fixed-damage';
import { CALLS } from '../moves/follow-me';
import { IDENTIFYING_MOVES } from '../moves/foresight';
import { DELAYED_MOVES } from '../moves/future-sight';
import { SACRIFICES } from '../moves/healing-wish';
import { TRADING_MOVES } from '../moves/item-moves';
import { LOCKOUTS } from '../moves/lockouts';
import { MULTI_HIT_MOVES } from '../moves/multi-hit';
import { NO_ESCAPE_MOVES } from '../moves/no-escape';
import { GUARD_MOVES } from '../moves/protect';
import { RAMPAGE_MOVES } from '../moves/rampage';
import { HEAL_FRACTION, WEATHER_HEALS } from '../moves/recover';
import { ROLLING_MOVES } from '../moves/rolling';
import { SELF_DESTRUCT_MOVES } from '../moves/self-destruct';
import { SEMI_INVULNERABLE_MOVES } from '../moves/semi-invulnerable';
import { SPLITS } from '../moves/splits';
import { getStageMoveEffects } from '../moves/stage';
import { STAGE_SWAP_MOVES } from '../moves/stage-swaps';
import {
  EFFECT_STAGE_MOVES,
  EFFECT_STATUS_MOVES,
  SELF_STATUS_MOVES,
  STATUS_MOVES,
  TEAM_STATUS_MOVES,
  TRAPPING_MOVES,
} from '../moves/status';
import { PARTY_CURES } from '../moves/support';
import { DRAGGING_MOVES, FORCED_SWITCH_MOVES, SELF_SWITCH_MOVES } from '../moves/switch-out';
import { GUARDS } from '../moves/team-guards';
import { TERRAIN_MOVES } from '../moves/terrain';
import { RECHARGE_MOVES } from '../../data/moves/recharge';
import { RECOIL_MOVES } from '../../data/moves/recoil';

/**
 * What a move is cast for, as the AI weighs it. A move may hold several:
 * Fly is damage, a wind-up and a way out of the next hit all at once
 */
export const enum MoveRole {
  // What a status move is cast for
  /** Keeps the damage off: Protect, Substitute, Fly, Wide Guard */
  Shield = 0,
  /** A veil or tempo over the caster's side: screens, Tailwind */
  TeamSetup = 1,
  /** Lies on the foe's side and bites whoever acts there */
  Hazard = 2,
  /** Changes the whole field: weather, terrain, rooms, Gravity */
  Field = 3,
  /** Puts a lasting affliction on a foe: sleep, poison, burn */
  Status = 4,
  /** Takes an option away from a foe: Taunt, Disable, Mean Look */
  Disruption = 5,
  /** Raises the caster's own stages */
  SelfBoost = 6,
  /** Lowers a foe's stages */
  FoeDrop = 7,
  /** Puts health back or clears statuses on the caster's side */
  Heal = 8,
  /** Helps a teammate rather than the caster: Helping Hand, Follow Me */
  Support = 9,
  /** Leaves the field, or ends with the user gone */
  Pivot = 10,
  /** Everything else a move may be cast for: callers, copies, swaps */
  Utility = 11,

  // What a damaging move is, beside the damage itself
  Damage = 12,
  Spread = 13,
  Priority = 14,
  MultiHit = 15,
  /** Spends a step winding up before it lands */
  Charge = 16,
  Recharge = 17,
  Recoil = 18,
  Drain = 19,
  /** Costs the user its life */
  Sacrifice = 20,
  OneHitKO = 21,
  /** Damage set by a formula rather than power */
  FixedDamage = 22,
  /** Locks the user into repeating it */
  LockIn = 23,
  /** Lands later than it is cast */
  Delayed = 24,
  /** May leave a status on what it hits */
  Afflicts = 25,
  /** May lower a stage on what it hits */
  Weakens = 26,
  /** Binds its target for a while */
  Trapping = 27,
}

/**
 * What each role is worth at the start of a fight, before relevance and
 * the fight's phase scale it. Avoiding damage outranks team setup, which
 * outranks afflicting a foe, then self setup, then foe drops. Damage and
 * its traits sit at zero: the hit's outcome and costs decide those
 */
export const ROLE_BASE: Record<MoveRole, number> = {
  [MoveRole.Shield]: 18,
  [MoveRole.TeamSetup]: 16,
  [MoveRole.Hazard]: 16,
  [MoveRole.Field]: 14,
  [MoveRole.Status]: 12,
  [MoveRole.SelfBoost]: 10,
  [MoveRole.Disruption]: 8,
  [MoveRole.FoeDrop]: 6,
  [MoveRole.Support]: 6,
  [MoveRole.Pivot]: 4,
  [MoveRole.Heal]: 0,
  [MoveRole.Utility]: 0,
  [MoveRole.Damage]: 0,
  [MoveRole.Spread]: 0,
  [MoveRole.Priority]: 0,
  [MoveRole.MultiHit]: 0,
  [MoveRole.Charge]: 0,
  [MoveRole.Recharge]: 0,
  [MoveRole.Recoil]: 0,
  [MoveRole.Drain]: 0,
  [MoveRole.Sacrifice]: 0,
  [MoveRole.OneHitKO]: 0,
  [MoveRole.FixedDamage]: 0,
  [MoveRole.LockIn]: 0,
  [MoveRole.Delayed]: 0,
  [MoveRole.Afflicts]: 0,
  [MoveRole.Weakens]: 0,
  [MoveRole.Trapping]: 0,
};

/** The statuses that make a lasting affliction rather than a restriction */
export const AFFLICTIONS = new Set<Statuses>([
  Statuses.Poisoned,
  Statuses.BadlyPoisoned,
  Statuses.Burned,
  Statuses.Paralyzed,
  Statuses.Sleeping,
  Statuses.Frozen,
  Statuses.Confused,
  Statuses.Infatuated,
  Statuses.Drowsy,
]);

// The moves no registry groups, each with its role
const SHIELDS = new Set<Moves>([Moves.Substitute, Moves.MagnetRise]);
const TEAM_SETUPS = new Set<Moves>([Moves.Tailwind, Moves.LuckyChant]);
const HAZARDS = new Set<Moves>([
  Moves.Spikes,
  Moves.ToxicSpikes,
  Moves.StealthRock,
  Moves.StickyWeb,
]);
const FIELDS = new Set<Moves>([
  Moves.TrickRoom,
  Moves.WonderRoom,
  Moves.MagicRoom,
  Moves.Gravity,
  Moves.MudSport,
  Moves.WaterSport,
  Moves.IonDeluge,
]);
const AFFLICTING = new Set<Moves>([Moves.LeechSeed, Moves.Nightmare, Moves.PsychoShift]);
const DISRUPTING = new Set<Moves>([
  Moves.Disable,
  Moves.Encore,
  Moves.Spite,
  Moves.Haze,
  Moves.TopsyTurvy,
  Moves.Quash,
  Moves.Electrify,
  Moves.FairyLock,
  Moves.Powder,
  Moves.Soak,
  Moves.TrickOrTreat,
  Moves.ForestsCurse,
  Moves.Telekinesis,
]);
const FOE_DROPS = new Set<Moves>([Moves.Captivate]);
const HEALS = new Set<Moves>([
  Moves.Rest,
  Moves.Wish,
  Moves.Swallow,
  Moves.PainSplit,
  Moves.Refresh,
]);
const SELF_BOOSTS = new Set<Moves>([
  Moves.BellyDrum,
  Moves.Stockpile,
  Moves.Acupressure,
  Moves.Curse,
  Moves.Geomancy,
  Moves.PsychUp,
]);
const SUPPORTING = new Set<Moves>([
  Moves.AfterYou,
  Moves.AllySwitch,
  Moves.HoldHands,
  Moves.Bestow,
]);
const UTILITIES = new Set<Moves>([
  // Callers and copies, worth whatever they turn into
  Moves.Mimic,
  Moves.MirrorMove,
  Moves.Metronome,
  Moves.Transform,
  Moves.Sketch,
  Moves.SleepTalk,
  Moves.NaturePower,
  Moves.Assist,
  Moves.MeFirst,
  Moves.Copycat,
  // Setting up the next move or answering the foe's
  Moves.MindReader,
  Moves.LockOn,
  Moves.MagicCoat,
  Moves.Snatch,
  Moves.DestinyBond,
  Moves.Grudge,
  Moves.PerishSong,
  // Changing the caster's own typing or stats
  Moves.Conversion,
  Moves.Conversion2,
  Moves.Camouflage,
  Moves.ReflectType,
  Moves.PowerTrick,
  Moves.Recycle,
  // Nothing at all
  Moves.Splash,
  Moves.Celebrate,
  Moves.HappyHour,
]);
const SACRIFICING = new Set<Moves>([Moves.FinalGambit, Moves.Memento]);

const roles = new Map<Moves, ReadonlySet<MoveRole>>();

function addStatusRoles(move: Moves, found: Set<MoveRole>): void {
  const data = getMoveData(move);
  const atFoe = (data.affects & MoveAffects.Enemy) !== 0;

  if (GUARD_MOVES[move] != null || GUARDS[move] != null || SHIELDS.has(move)) {
    found.add(MoveRole.Shield);
  }
  if (TEAM_STATUS_MOVES[move] != null || TEAM_SETUPS.has(move)) {
    found.add(MoveRole.TeamSetup);
  }
  if (HAZARDS.has(move)) {
    found.add(MoveRole.Hazard);
  }
  if (MOVE_WEATHERS.has(move) || TERRAIN_MOVES.has(move) || FIELDS.has(move)) {
    found.add(MoveRole.Field);
  }

  const status = STATUS_MOVES[move];

  if (status != null) {
    if (!atFoe) {
      found.add(MoveRole.Support);
    } else if (AFFLICTIONS.has(status)) {
      found.add(MoveRole.Status);
    } else {
      found.add(MoveRole.Disruption);
    }
  }
  if (AFFLICTING.has(move)) {
    found.add(MoveRole.Status);
  }
  if (
    DISRUPTING.has(move) ||
    LOCKOUTS.has(move) ||
    NO_ESCAPE_MOVES.has(move) ||
    IDENTIFYING_MOVES.has(move) ||
    ABILITY_MOVES.has(move) ||
    TRADING_MOVES.has(move) ||
    FORCED_SWITCH_MOVES.has(move) ||
    STAGE_SWAP_MOVES.has(move) ||
    SPLITS[move] != null
  ) {
    found.add(MoveRole.Disruption);
  }
  if (FOE_DROPS.has(move)) {
    found.add(MoveRole.FoeDrop);
  }
  if (UTILITIES.has(move)) {
    found.add(MoveRole.Utility);
  }
  if (CALLS.has(move) || SUPPORTING.has(move)) {
    found.add(MoveRole.Support);
  }
  if (
    HEAL_FRACTION[move] != null ||
    WEATHER_HEALS.has(move) ||
    PARTY_CURES.has(move) ||
    SACRIFICES.has(move) ||
    HEALS.has(move) ||
    WORN.get(move) === Statuses.AquaRinged ||
    SELF_STATUS_MOVES[move] === Statuses.Rooted
  ) {
    found.add(MoveRole.Heal);
  }
  if (SELF_BOOSTS.has(move) || FIELD_STAT_MOVES[move] != null) {
    found.add(MoveRole.SelfBoost);
  }
  if (SELF_STATUS_MOVES[move] === Statuses.FocusEnergy) {
    found.add(MoveRole.SelfBoost);
  }
  if (SELF_STATUS_MOVES[move] === Statuses.Centered) {
    found.add(MoveRole.Support);
  }
}

function addStageRoles(move: Moves, found: Set<MoveRole>): void {
  const atFoe = (getMoveData(move).affects & MoveAffects.Enemy) !== 0;

  for (const effect of getStageMoveEffects(move)) {
    if (effect.value < 0 && atFoe) {
      found.add(MoveRole.FoeDrop);
    } else if (effect.value > 0 && !atFoe) {
      found.add(MoveRole.SelfBoost);
    }
  }
}

function addDamageRoles(move: Moves, found: Set<MoveRole>): void {
  const data = getMoveData(move);

  found.add(MoveRole.Damage);

  if (data.target === MoveTargets.None && (data.affects & MoveAffects.Unit) !== 0) {
    found.add(MoveRole.Spread);
  }
  if ((data.priority ?? 0) > 0) {
    found.add(MoveRole.Priority);
  }
  if (MULTI_HIT_MOVES[move] != null) {
    found.add(MoveRole.MultiHit);
  }
  if ((data.steps ?? 0) > 0) {
    found.add(MoveRole.Charge);
  }
  if (SEMI_INVULNERABLE_MOVES[move] != null) {
    found.add(MoveRole.Shield);
  }
  if (RECHARGE_MOVES.has(move)) {
    found.add(MoveRole.Recharge);
  }
  if (RECOIL_MOVES[move] != null || CRASH_MOVES.has(move)) {
    found.add(MoveRole.Recoil);
  }
  if (ABSORB_MOVES.has(move)) {
    found.add(MoveRole.Drain);
  }
  if (OHKO_MOVES.has(move)) {
    found.add(MoveRole.OneHitKO);
  }
  if (FIXED_DAMAGE_MOVES[move] != null || HEALTH_SCALED_MOVES.has(move)) {
    found.add(MoveRole.FixedDamage);
  }
  if (RAMPAGE_MOVES.has(move) || ROLLING_MOVES.has(move)) {
    found.add(MoveRole.LockIn);
  }
  if (DELAYED_MOVES.has(move)) {
    found.add(MoveRole.Delayed);
  }
  if (EFFECT_STATUS_MOVES[move] != null) {
    found.add(MoveRole.Afflicts);
  }
  if (TRAPPING_MOVES.has(move)) {
    found.add(MoveRole.Trapping);
  }
  if (DRAGGING_MOVES.has(move)) {
    found.add(MoveRole.Disruption);
  }

  const stage = EFFECT_STAGE_MOVES[move];

  if (stage != null) {
    found.add(stage.self && stage.value > 0 ? MoveRole.SelfBoost : MoveRole.Weakens);
  }
}

function deriveRoles(move: Moves): Set<MoveRole> {
  const found = new Set<MoveRole>();

  if (getMoveData(move).category === MoveCategories.Status) {
    addStatusRoles(move, found);
  } else {
    addDamageRoles(move, found);
  }
  addStageRoles(move, found);

  if (SELF_SWITCH_MOVES.has(move)) {
    found.add(MoveRole.Pivot);
  }
  if (SELF_DESTRUCT_MOVES.has(move) || SACRIFICES.has(move) || SACRIFICING.has(move)) {
    found.add(MoveRole.Sacrifice);
  }
  return found;
}

/**
 * Every role a move holds. Empty for a status move nothing has
 * classified yet, which the role coverage test refuses
 */
export function getMoveRoles(move: Moves): ReadonlySet<MoveRole> {
  let found = roles.get(move);

  if (found == null) {
    found = deriveRoles(move);
    roles.set(move, found);
  }
  return found;
}

export function hasMoveRole(move: Moves, role: MoveRole): boolean {
  return getMoveRoles(move).has(role);
}
