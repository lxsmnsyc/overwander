import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MAX_STAGE, Stats } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories, MoveTargetFlags, type Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import {
  type AIMoveChoice,
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  type CheckUnitAIMoveUsableEvent,
  type MoveTarget,
  MoveTargetType,
  type UnitAIChooseMoveEvent,
  type UnitAttackEvent,
  type UnitAttackResolveAmountEvent,
  type UnitTriggerMoveEvent,
  type UnitTriggerMoveResolveAccuracyEvent,
} from '../events';
import { BattleModes } from '../core';
import { HEALTH_SCALED_MOVES, estimateFixedDamage } from '../moves/fixed-damage';
import { estimateMoveHits } from '../moves/multi-hit';
import { getStageMoveEffect } from '../moves/stage';
import { ACCURACY_PENALTY, BASE_SCORE, STEP_PENALTY, USELESS_PENALTY } from './score';
import { SELF_STATUS_MOVES, STATUS_MOVES } from '../moves/status';
import type Unit from '../unit';

/**
 * Raid battles favor setting up: enough to outbid any non-KO damage
 * bonus (which caps at +4)
 */
const RAID_BUFF_BONUS = 6;

/**
 * Pick the best move for a unit. Internal to the AI module; the idle
 * loop drives this, external code never calls it directly.
 */
export function chooseMove(battle: Battle, source: Unit): AIMoveChoice | undefined {
  const event: UnitAIChooseMoveEvent = {
    id: 'UnitAIChooseMove',
    disabled: false,
    source,
    choice: undefined,
  };
  battle.emit(BattleEvents.UnitAIChooseMove, event);
  return event.choice;
}

export function setupChooseMoveAI(battle: Battle): void {
  /**
   * Expected damage simulated through the engine's own resolver: a
   * synthetic UnitAttackResolveDamage event runs the real damage
   * pipeline (effectiveness, STAB, Reflect, burn, abilities) without
   * applying anything to the target.
   *
   * The Critical flag is left out so no crit roll happens, and the
   * Simulated flag makes the resolver take the middle of the damage
   * range rather than rolling for it.
   */
  function estimateDamage(source: Unit, move: Moves, target: Unit): number {
    const data = getMoveData(move);
    const moveTarget: MoveTarget = { type: MoveTargetType.Unit, unit: target };

    let flags = MoveAttackFlags.Simulated;
    let value: number;

    // A fixed-damage move carries no power, so it has to be asked what
    // it takes off. Pure and HealthScaled the way its trigger sets
    // them, so the resolver treats the estimate as it treats the hit
    const fixed = estimateFixedDamage(source, move, target);

    if (fixed != null) {
      value = fixed;
      flags |= MoveAttackFlags.Pure;

      if (HEALTH_SCALED_MOVES.has(move)) {
        flags |= MoveAttackFlags.HealthScaled;
      }
    } else if (data.power == null || data.category === MoveCategories.Status) {
      return 0;
    } else {
      value = source.checkMovePower(move, moveTarget) ?? data.power;
    }

    const parent: UnitAttackEvent = {
      id: 'UnitAttack',
      disabled: false,
      source,
      target,
      move,
      value,
      category: data.category,
      type: source.checkMoveType(move, moveTarget),
      flags,
      success: false,
    };

    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveDamage',
      disabled: false,
      parent,
      value: parent.value,
    };
    battle.emit(BattleEvents.UnitAttackResolveDamage, event);

    // The resolver answers for one strike; a multi-hit move lands
    // several off the same cast
    return event.value * estimateMoveHits(move);
  }

  /**
   * What the move's chance of landing works out to here, accuracy and
   * evasion stages included. The engine resolves that off a trigger,
   * so the estimate runs the same resolver against a synthetic one.
   *
   * 100 for a move that cannot miss
   */
  function estimateAccuracy(source: Unit, move: Moves, target: MoveTarget): number {
    const parent: UnitTriggerMoveEvent = {
      id: 'UnitTriggerMove',
      disabled: false,
      source,
      move,
      target,
      steps: 0,
    };

    const event: UnitTriggerMoveResolveAccuracyEvent = {
      id: 'UnitTriggerMoveResolveAccuracy',
      disabled: false,
      parent,
    };
    battle.emit(BattleEvents.UnitTriggerMoveResolveAccuracy, event);

    return event.accuracy ?? 100;
  }

  /**
   * Whether the move would do anything against this target. A move
   * that answers no is not scored at all, so the AI never spends a
   * cast on something that resolves to "but it failed!"
   */
  function isMoveUsable(source: Unit, move: Moves, target: MoveTarget): boolean {
    const event: CheckUnitAIMoveUsableEvent = {
      id: 'CheckUnitAIMoveUsable',
      disabled: false,
      source,
      move,
      target,
      usable: true,
    };
    battle.emit(BattleEvents.CheckUnitAIMoveUsable, event);
    return event.usable;
  }

  function scoreMove(source: Unit, move: Moves, target: MoveTarget): number {
    const event: CheckUnitAIMoveScoreEvent = {
      id: 'CheckUnitAIMoveScore',
      disabled: false,
      source,
      move,
      target,
      score: BASE_SCORE,
    };
    battle.emit(BattleEvents.CheckUnitAIMoveScore, event);
    return event.score;
  }

  /**
   * Whether the side a move reaches for still has anybody on it.
   *
   * A move that only reaches the enemy has nothing left to do once the
   * enemy is down: the fan-out at trigger time would find nobody, and
   * the cast, the cooldown and the opening would all be spent on
   * empty air. Anything that reaches its own side always has at least
   * the user to reach
   */
  function hasLivingTarget(source: Unit, targetFlags: number): boolean {
    if (!(targetFlags & MoveTargetFlags.Enemy)) {
      return true;
    }
    for (const unit of battle.units(source.team.alliance)) {
      if (unit.alive) {
        return true;
      }
    }
    return false;
  }

  /**
   * Collect the candidate targets on the field for a move, based on
   * its configured target flags. **No candidates means the move is not
   * a candidate**: a move with nothing to aim at is left out of the
   * running rather than offered with nothing named, which is how a
   * unit ends up winding up move after move at an empty field
   */
  function collectTargets(source: Unit, targetFlags: number): MoveTarget[] {
    /**
     * Multi-target moves (and targetless self moves) resolve their own
     * targets on trigger, so they score as a single targetless use.
     */
    if (targetFlags & MoveTargetFlags.Multiple || targetFlags === 0) {
      return hasLivingTarget(source, targetFlags) ? [{ type: MoveTargetType.None }] : [];
    }

    const targets: MoveTarget[] = [];
    const ownTeam = source.team;
    const ownAlliance = ownTeam.alliance;

    function addUnits(units: Iterable<Unit>, skipSource: boolean): void {
      for (const unit of units) {
        if (unit.alive && !(skipSource && unit === source)) {
          targets.push({ type: MoveTargetType.Unit, unit });
        }
      }
    }

    if (targetFlags & MoveTargetFlags.Unit) {
      if (targetFlags & MoveTargetFlags.Self) {
        targets.push({ type: MoveTargetType.Unit, unit: source });
      }
      if (targetFlags & MoveTargetFlags.Own) {
        addUnits(ownTeam.units, true);
      }
      if (targetFlags & MoveTargetFlags.Ally) {
        for (const team of ownAlliance.teams) {
          if (team !== ownTeam) {
            addUnits(team.units, false);
          }
        }
      }
      if (targetFlags & MoveTargetFlags.Enemy) {
        addUnits(battle.units(ownAlliance), false);
      }
    } else if (targetFlags & MoveTargetFlags.Team) {
      if (targetFlags & MoveTargetFlags.Own) {
        targets.push({ type: MoveTargetType.Team, team: ownTeam });
      }
      if (targetFlags & MoveTargetFlags.Ally) {
        for (const team of ownAlliance.teams) {
          if (team !== ownTeam) {
            targets.push({ type: MoveTargetType.Team, team });
          }
        }
      }
      if (targetFlags & MoveTargetFlags.Enemy) {
        for (const team of battle.teams(ownAlliance)) {
          targets.push({ type: MoveTargetType.Team, team });
        }
      }
    }

    return targets;
  }

  /**
   * Resolver: enumerate the unit's usable moves against the collected
   * targets, score every pair, keep the best (random tie-break).
   */
  battle.on(BattleEvents.UnitAIChooseMove, EventPriority.Exact, (event) => {
    const source = event.source;

    let best: AIMoveChoice[] = [];

    function consider(move: Moves, target: MoveTarget): void {
      // A move that cannot work here is not a low-scoring option, it
      // is not an option: casting it would spend the cast time, the
      // cooldown and the opening for nothing
      if (!isMoveUsable(source, move, target)) {
        return;
      }

      const score = scoreMove(source, move, target);

      if (best.length === 0 || score > best[0].score) {
        best = [{ move, target, score }];
      } else if (score === best[0].score) {
        best.push({ move, target, score });
      }
    }

    for (const state of Object.values(source.moves)) {
      // tsc types the mapped-record values as possibly undefined;
      // tsgolint disagrees, so the guard is flagged as unnecessary
      // oxlint-disable-next-line typescript/no-unnecessary-condition
      if (!state || state.disabled || state.cooldown) {
        continue;
      }

      const data = getMoveData(state.move);

      for (const target of collectTargets(source, data.target)) {
        consider(state.move, target);
      }
    }

    if (best.length > 0) {
      event.choice = best[Math.floor(battle.random() * best.length)];
    }
  });

  // --- Usability rules ---

  /**
   * The one every move answers to: a target the move cannot touch at
   * all. It is the same question the trigger asks before the effect
   * runs — type immunity, a powder against a Grass type, a Ground move
   * under something airborne — so a move that would be refused there
   * is refused here first, at no cost
   */
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const type = event.source.checkMoveType(event.move, event.target);

    if (event.source.checkMoveImmunity(event.move, event.target, type)) {
      event.usable = false;
    }
  });

  // --- Scoring modifiers ---

  // Damaging moves: prefer stronger hits, reward guaranteed KOs
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const data = getMoveData(event.move);

    if (data.category === MoveCategories.Status) {
      return;
    }

    const target = event.target.unit;
    const damage = estimateDamage(event.source, event.move, target);

    if (damage <= 0) {
      // Immune target: the move does nothing
      event.score -= USELESS_PENALTY;
      return;
    }

    if (damage >= target.health) {
      // Gen 4 "try to KO" bonus
      event.score += 6;

      // Priority moves are extra attractive for the kill
      if ((data.priority ?? 0) > 0) {
        event.score += 2;
      }
      return;
    }

    // Stand-in for the "highest expected damage" bonus: scale by how
    // much of the target's remaining health the hit removes
    event.score += Math.min(4, Math.floor((4 * damage) / target.health));
  });

  // Status-inflicting moves: a target that cannot receive the status
  // is refused by the usability rule in the status move group, so what
  // is left to weigh is only who is worth spending it on
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const status = STATUS_MOVES[event.move];

    if (status == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    // Status spreads early: better against a healthy target
    const maxHP = Math.max(1, target.checkStat(Stats.HP, 0));

    if (target.health / maxHP > 0.5) {
      event.score += 5;
    }
  });

  // Self statuses (e.g. Focus Energy): useless when already active,
  // reckless when about to go down
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const status = SELF_STATUS_MOVES[event.move];

    if (status == null) {
      return;
    }

    const source = event.source;

    if (source.status[status]) {
      event.score -= USELESS_PENALTY;
      return;
    }

    const maxHP = Math.max(1, source.checkStat(Stats.HP, 0));
    const ratio = source.health / maxHP;

    if (ratio > 0.7) {
      event.score += 3;
    } else if (ratio < 0.3) {
      event.score -= 5;
    }
  });

  // Raid battles: friendly stage-boosting moves take priority — for
  // the party, and only the party. Setting up is what a side that has
  // to survive a long fight does with its first few casts, and the
  // boss is not that side: it is the clock everybody else is racing,
  // and a boss spending its doubled cast time on a Withdraw is a boss
  // handing the lobby the fight. It attacks, and the buffs it does
  // pick it picks on their own merits
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (battle.mode !== BattleModes.Raid || event.source.hasAbility(Abilities.Boss)) {
      return;
    }

    const effect = getStageMoveEffect(event.move);

    // Only boosts pointed at the own side qualify
    if (
      effect == null ||
      effect.value <= 0 ||
      getMoveData(event.move).target & MoveTargetFlags.Enemy
    ) {
      return;
    }

    const receiver = event.target.type === MoveTargetType.Unit ? event.target.unit : event.source;

    // A stage that will not move is not worth a bonus; the stage move
    // group is what says it is worth a penalty
    if (receiver.stages[effect.stage] >= MAX_STAGE) {
      return;
    }

    event.score += RAID_BUFF_BONUS;
  });

  // A move that has to wind up first pays for the cast it spends there
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    event.score -= STEP_PENALTY * event.source.checkMoveSteps(event.move, event.target);
  });

  // An unreliable move is worth what it lands, so it gives up ground
  // in proportion to how often it misses
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Cleanup, (event) => {
    const accuracy = Math.min(100, estimateAccuracy(event.source, event.move, event.target));

    event.score -= ACCURACY_PENALTY * (1 - accuracy / 100);
  });
}
