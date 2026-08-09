import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { MoveAttackFlags, MoveCategories, MoveTargetFlags, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import {
  type AIMoveChoice,
  BattleEvents,
  type CheckUnitAIMoveScoreEvent,
  EffectType,
  type MoveTarget,
  MoveTargetType,
  type UnitAIChooseMoveEvent,
  type UnitAttackEvent,
  type UnitAttackResolveAmountEvent,
} from '../events';
import { BattleModes } from '../core';
import { getStageMoveEffect } from '../moves/stage';
import { SELF_STATUS_MOVES, STATUS_MOVES } from '../moves/status';
import type Unit from '../unit';

/**
 * Gen 4/5 cartridge AI style move selection: every usable move starts
 * at a base score per candidate target, scoring listeners nudge it up
 * or down, and the highest total wins (random tie-break).
 *
 * https://bulbapedia.bulbagarden.net/wiki/Artificial_intelligence_in_the_Pok%C3%A9mon_games
 */
const BASE_SCORE = 100;

/**
 * The gen 4 "useless move" penalty: enough to lose against any
 * neutral option, so the move is only picked when everything is bad.
 */
const USELESS_PENALTY = 10;

/**
 * Raid battles favor setting up: enough to outbid any non-KO damage
 * bonus (which caps at +4)
 */
const RAID_BUFF_BONUS = 6;

// AI knowledge tables (kept here, like the cartridge AI's own lists)
const HEALING_MOVES = new Set<Moves>([Moves.Rest, Moves.Recover]);

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
   * The Critical flag is left out so no crit roll happens; the
   * resolver still consumes one battle.random() for the damage range.
   */
  function estimateDamage(source: Unit, move: Moves, target: Unit): number {
    const data = getMoveData(move);

    if (data.power == null || data.category === MoveCategories.Status) {
      return 0;
    }

    const moveTarget: MoveTarget = { type: MoveTargetType.Unit, unit: target };

    const parent: UnitAttackEvent = {
      id: 'UnitAttack',
      disabled: false,
      source,
      target,
      move,
      value: source.checkMovePower(move, moveTarget) ?? data.power,
      category: data.category,
      type: source.checkMoveType(move, moveTarget),
      flags: MoveAttackFlags.Simulated,
      success: false,
    };

    const event: UnitAttackResolveAmountEvent = {
      id: 'UnitAttackResolveDamage',
      disabled: false,
      parent,
      value: parent.value,
    };
    battle.emit(BattleEvents.UnitAttackResolveDamage, event);

    return event.value;
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
   * Collect the candidate targets on the field for a move, based on
   * its configured target flags.
   */
  function collectTargets(source: Unit, targetFlags: number): MoveTarget[] {
    /**
     * Multi-target moves (and targetless self moves) resolve their own
     * targets on trigger, so they score as a single targetless use.
     */
    if (targetFlags & MoveTargetFlags.Multiple || targetFlags === 0) {
      return [{ type: MoveTargetType.None }];
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

    if (targets.length === 0) {
      targets.push({ type: MoveTargetType.None });
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

  // --- Scoring modifiers ---

  // Damaging moves: prefer stronger hits, reward guaranteed KOs
  battle.on(BattleEvents.CheckUnitAIMoveScore, EventPriority.Post, (event) => {
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

  // Status-inflicting moves: useless when the target can't receive it
  battle.on(BattleEvents.CheckUnitAIMoveScore, EventPriority.Post, (event) => {
    const status = STATUS_MOVES[event.move];

    if (status == null || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (
      target.status[status] ||
      target.checkStatusImmunity(status, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      })
    ) {
      event.score -= USELESS_PENALTY;
      return;
    }

    // Status spreads early: better against a healthy target
    const maxHP = Math.max(1, target.checkStat(Stats.HP, 0));

    if (target.health / maxHP > 0.5) {
      event.score += 5;
    }
  });

  // Self statuses (e.g. Focus Energy): useless when already active,
  // reckless when about to go down
  battle.on(BattleEvents.CheckUnitAIMoveScore, EventPriority.Post, (event) => {
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

  // Raid battles: friendly stage-boosting moves take priority
  battle.on(BattleEvents.CheckUnitAIMoveScore, EventPriority.Post, (event) => {
    if (battle.mode !== BattleModes.Raid) {
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

    // Useless once the receiver's stage is maxed out
    if (receiver.stages[effect.stage] >= 6) {
      event.score -= USELESS_PENALTY;
      return;
    }

    event.score += RAID_BUFF_BONUS;
  });

  // Healing moves: valuable when hurt, useless when topped off
  battle.on(BattleEvents.CheckUnitAIMoveScore, EventPriority.Post, (event) => {
    if (!HEALING_MOVES.has(event.move)) {
      return;
    }

    const source = event.source;
    const maxHP = Math.max(1, source.checkStat(Stats.HP, 0));
    const ratio = source.health / maxHP;

    if (ratio >= 0.9) {
      event.score -= USELESS_PENALTY;
    } else if (ratio < 0.4) {
      event.score += 7;
    }
  });
}
