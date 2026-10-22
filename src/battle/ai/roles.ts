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
import { AI_ROLE_MOVES } from '../../data/battle';
import { MoveRole } from '../../data/ids/move-roles';
import { RECOIL_MOVES } from '../../data/moves/recoil';

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

export { MoveRole };

/** Whether `src/data/battle/ai-roles.yaml` files a move under a role by hand */
function filed(move: Moves, role: MoveRole): boolean {
  return AI_ROLE_MOVES.get(role)?.has(move) === true;
}

const roles = new Map<Moves, ReadonlySet<MoveRole>>();

function addStatusRoles(move: Moves, found: Set<MoveRole>): void {
  const data = getMoveData(move);
  const atFoe = (data.affects & MoveAffects.Enemy) !== 0;

  if (GUARD_MOVES[move] != null || GUARDS[move] != null || filed(move, MoveRole.Shield)) {
    found.add(MoveRole.Shield);
  }
  if (TEAM_STATUS_MOVES[move] != null || filed(move, MoveRole.TeamSetup)) {
    found.add(MoveRole.TeamSetup);
  }
  if (filed(move, MoveRole.Hazard)) {
    found.add(MoveRole.Hazard);
  }
  if (MOVE_WEATHERS.has(move) || TERRAIN_MOVES.has(move) || filed(move, MoveRole.Field)) {
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
  if (filed(move, MoveRole.Status)) {
    found.add(MoveRole.Status);
  }
  if (
    filed(move, MoveRole.Disruption) ||
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
  if (filed(move, MoveRole.FoeDrop)) {
    found.add(MoveRole.FoeDrop);
  }
  if (filed(move, MoveRole.Utility)) {
    found.add(MoveRole.Utility);
  }
  if (CALLS.has(move) || filed(move, MoveRole.Support)) {
    found.add(MoveRole.Support);
  }
  if (
    HEAL_FRACTION[move] != null ||
    WEATHER_HEALS.has(move) ||
    PARTY_CURES.has(move) ||
    SACRIFICES.has(move) ||
    filed(move, MoveRole.Heal) ||
    WORN.get(move) === Statuses.AquaRinged ||
    SELF_STATUS_MOVES[move] === Statuses.Rooted
  ) {
    found.add(MoveRole.Heal);
  }
  if (filed(move, MoveRole.SelfBoost) || FIELD_STAT_MOVES[move] != null) {
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
  if (SELF_DESTRUCT_MOVES.has(move) || SACRIFICES.has(move) || filed(move, MoveRole.Sacrifice)) {
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
