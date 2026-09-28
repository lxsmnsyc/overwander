import { AttackPriority, EventPriority } from '../../core/event-emitter';
import {
  MoveAffects,
  MoveAttackFlags,
  MoveCategories,
  MoveTargets,
  Moves,
} from '../../data/ids/moves';
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
import { HEALTH_SCALED_MOVES, estimateFixedDamage } from '../moves/fixed-damage';
import { MULTI_HIT_MOVES, estimateMoveHits } from '../moves/multi-hit';
import { RAMPAGE_MOVES } from '../moves/rampage';
import { ROLLING_MOVES } from '../moves/rolling';
import { feedsOwnSide } from '../moves/friendly-fire';
import resolveMoveTargets from '../mechanics/move/targeting';
import { ACCURACY_PENALTY, BASE_SCORE, KILL_BONUS, STEP_PENALTY, USELESS_PENALTY } from './score';
import { SELF_STATUS_MOVES } from '../moves/status';
import type Unit from '../unit';
import { withAIContext } from './context';
import setupFog from './fog';
import setupRoleScoring from './role-score';

/**
 * Moves whose steps are the move itself rather than a wind-up before
 * it: a rampage strikes on each, a roll rolls, Stockpile banks a charge
 * and Encore plays a repeat
 */
const STEPS_ARE_THE_MOVE = new Set<Moves>([
  ...RAMPAGE_MOVES,
  ...ROLLING_MOVES,
  Moves.Stockpile,
  Moves.Encore,
]);

/** Extra for getting there first */
const PRIORITY_KILL_BONUS = 2;

/**
 * The scale a hit that leaves the target standing is weighed on: what
 * share of the target's remaining health it takes, out of this. Such a
 * hit falls short of a kill by definition, so the band tops out one
 * below, at 4
 */
const DAMAGE_SCALE = 5;

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
    waiting: false,
  };
  // One context for every question the decision asks
  return withAIContext(battle, source, () => {
    battle.emit(BattleEvents.UnitAIChooseMove, event);
    return event.choice;
  });
}

export function setupChooseMoveAI(battle: Battle): void {
  // What the AI may know about a foe is settled before anything is weighed
  setupFog(battle);
  setupRoleScoring(battle);

  /**
   * Expected damage simulated through the engine's own resolver: a
   * synthetic UnitAttackResolveDamage event runs the real damage
   * pipeline (effectiveness, STAB, Reflect, burn, abilities) without
   * applying anything to the target.
   *
   * The Critical flag is set the way a real hit sets it, and the
   * Simulated flag makes the resolver skip both rolls: no chance of a
   * critical, only one that is certain (Storm Throw), and the middle of
   * the damage range.
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
      flags |= MoveAttackFlags.Critical;
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
    // several off the same cast, as many as the user's own kit rolls
    const hits = source.checkMoveHits(
      move,
      moveTarget,
      estimateMoveHits(move),
      MULTI_HIT_MOVES[move]?.max ?? 1,
    );
    return event.value * hits;
  }

  /**
   * What one hit is worth to its caster: a KO, or the share of the
   * target's remaining health it takes. Undefined for a hit that does
   * nothing
   */
  function hitWorth(source: Unit, move: Moves, target: Unit): number | undefined {
    const damage = estimateDamage(source, move, target);

    if (damage <= 0) {
      return undefined;
    }
    if (damage >= target.health) {
      // Gen 4 "try to KO" bonus, and more for getting there first
      const priority = source.checkMovePriority(move, { type: MoveTargetType.Unit, unit: target });
      return KILL_BONUS + (priority > 0 ? PRIORITY_KILL_BONUS : 0);
    }
    return Math.floor((DAMAGE_SCALE * damage) / target.health);
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
  function hasLivingTarget(source: Unit, affects: number): boolean {
    if (!(affects & MoveAffects.Enemy)) {
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
   * Collect the candidate targets on the field for a move, from the
   * way it is cast and what it says it reaches. **No candidates means
   * the move is not a candidate**: a move with nothing to aim at is
   * left out of the running rather than offered with nothing named,
   * which is how a unit ends up winding up move after move at an
   * empty field
   */
  function collectTargets(source: Unit, move: Moves): MoveTarget[] {
    // The move's own table, not the resolved targeting: what a
    // caster may point at is the move's, while what the move reaches
    // once it goes off is whatever widened it. A boss still aims its
    // Tackle at one enemy, and the fan-out is what carries it to the
    // rest, so the chooser still weighs the move per target
    const { target, affects } = getMoveData(move);

    /**
     * A move cast at nobody picks nothing: who it reaches is worked
     * out when it goes off, so it scores as a single targetless use
     */
    if (target === MoveTargets.None) {
      return hasLivingTarget(source, affects) ? [{ type: MoveTargetType.None }] : [];
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

    if (target === MoveTargets.Unit) {
      if (affects & MoveAffects.Self) {
        targets.push({ type: MoveTargetType.Unit, unit: source });
      }
      if (affects & MoveAffects.Own) {
        addUnits(ownTeam.units, true);
      }
      if (affects & MoveAffects.Ally) {
        for (const team of ownAlliance.teams) {
          if (team !== ownTeam) {
            addUnits(team.units, false);
          }
        }
      }
      if (affects & MoveAffects.Enemy) {
        addUnits(battle.units(ownAlliance), false);
      }
      // A plain attack may also be fed to whatever on the caster's
      // own team absorbs it; the usability rule refuses the rest
      if (feedsOwnSide(move)) {
        addUnits(ownTeam.units, true);
      }
    } else {
      if (affects & MoveAffects.Own) {
        targets.push({ type: MoveTargetType.Team, team: ownTeam });
      }
      if (affects & MoveAffects.Ally) {
        for (const team of ownAlliance.teams) {
          if (team !== ownTeam) {
            targets.push({ type: MoveTargetType.Team, team });
          }
        }
      }
      if (affects & MoveAffects.Enemy) {
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
      if (!state || state.disabled) {
        continue;
      }

      // A move that is cooling is one the unit still has, so it is
      // only worth asking about while nothing has said so yet: the
      // answer feeds the difference between waiting and being stuck
      const cooling = !!state.cooldown;

      if (cooling && event.waiting) {
        continue;
      }

      for (const target of collectTargets(source, state.move)) {
        // A move that cannot work here is not a low-scoring option, it
        // is not an option: casting it would spend the cast time, the
        // cooldown and the opening for nothing
        if (!isMoveUsable(source, state.move, target)) {
          continue;
        }

        if (cooling) {
          event.waiting = true;
          break;
        }

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

    // A hit offered to one's own side asks the opposite question, and
    // the friendly fire group answers it: there an immunity is the
    // reason to aim rather than the reason not to, since the hit lands
    // as whatever the teammate's ability pays out instead
    if (
      event.target.unit !== event.source &&
      event.target.unit.team.alliance === event.source.team.alliance &&
      feedsOwnSide(event.move)
    ) {
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

    // A hit landing on the player's own side is a cost, never a gain,
    // unless it cannot land at all: what is aimed at a teammate is
    // aimed at whatever absorbs it, and the ability says what that is
    // worth. The moves that may be aimed there for some other reason
    // each say for themselves when it is worth it
    if (target.team.alliance === event.source.team.alliance) {
      if (
        !event.source.checkMoveImmunity(
          event.move,
          event.target,
          event.source.checkMoveType(event.move, event.target),
        )
      ) {
        event.score -= USELESS_PENALTY;
      }
      return;
    }

    // Immune target: the move does nothing
    event.score += hitWorth(event.source, event.move, target) ?? -USELESS_PENALTY;
  });

  // A move that goes out to everybody is worth what it does to each
  // foe, less what it does to the caster's own side
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.target.type !== MoveTargetType.None) {
      return;
    }

    const data = getMoveData(event.move);

    if (data.category === MoveCategories.Status) {
      return;
    }

    const source = event.source;
    let worth = 0;
    let lands = false;

    for (const reached of resolveMoveTargets(
      battle,
      source,
      event.target,
      data.target,
      data.affects,
    )) {
      if (reached.type !== MoveTargetType.Unit || reached.unit === source) {
        continue;
      }
      if (
        source.checkMoveImmunity(event.move, reached, source.checkMoveType(event.move, reached))
      ) {
        continue;
      }

      const hit = hitWorth(source, event.move, reached.unit);

      if (hit == null) {
        continue;
      }
      if (reached.unit.team.alliance === source.team.alliance) {
        worth -= hit;
      } else {
        worth += hit;
        lands = true;
      }
    }

    event.score += lands ? worth : worth - USELESS_PENALTY;
  });

  // A self status already in place (Focus Energy) changes nothing
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const status = SELF_STATUS_MOVES[event.move];

    if (event.usable && status != null && event.source.status[status] != null) {
      event.usable = false;
    }
  });

  // A move that has to wind up first pays for the cast it spends there
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (!STEPS_ARE_THE_MOVE.has(event.move)) {
      event.score -= STEP_PENALTY * event.source.checkMoveSteps(event.move, event.target);
    }
  });

  // An unreliable move is worth what it lands, so it gives up ground
  // in proportion to how often it misses
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Cleanup, (event) => {
    const accuracy = Math.min(100, estimateAccuracy(event.source, event.move, event.target));

    event.score -= ACCURACY_PENALTY * (1 - accuracy / 100);
  });
}
