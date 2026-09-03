import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { Statuses } from '../../data/ids/status';
import { STEP_PENALTY, USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, EffectType, type MoveTarget, MoveTargetType } from '../events';
import type Unit from '../unit';
import { unitTarget } from '../utils';

/**
 * The two fallbacks are nobody's last move: an encore of Struggle or
 * of the swing thrown between cooldowns repeats nothing worth
 * hearing. Encore itself is out so a performance cannot call for
 * another one
 */
const NOT_A_MOVE = new Set<Moves>([Moves.Struggle, Moves.Attack, Moves.Encore]);

/**
 * What an ally is worth over an enemy. An encore is a free extra use
 * of somebody's best move, so aiming one across the field hands the
 * other side that gift: worth a refusal rather than a nudge
 */
const ENCORE_BONUS = 6;

/**
 * Encore, as the crowd rather than as a leash. Each step of the
 * performance fires the target's last move again, for free: no
 * cooldown, no points, and nothing taken off what the target is
 * doing itself.
 *
 * https://bulbapedia.bulbagarden.net/wiki/Encore_(move)
 */
export default function setupEncore(battle: Battle): void {
  /** The last move each unit landed, and what it was aimed at */
  const lastUsed = new Map<Unit, { move: Moves; target: MoveTarget }>();

  /**
   * Whether a move can be played back at all. A move that spends
   * steps is spread across them, and one trigger is not the move: a
   * roll fired on its own reads as its last pass and hits for
   * sixteen times its power, a rampage hands out its own fatigue,
   * and a Sky Attack arrives with nothing spent on the wind-up. The
   * step count is asked of the unit rather than the table, so a Sun
   * Solar Beam is repeatable while an overcast one is not
   */
  function repeatable(unit: Unit, move: Moves, target: MoveTarget): boolean {
    if (NOT_A_MOVE.has(move)) {
      return false;
    }
    return (getMoveData(move).steps ?? 0) === 0 || unit.checkMoveSteps(move, target) === 0;
  }

  // The effect event is the successful use: a move that missed, or
  // that ran into an immunity, never reaches it
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
    if (repeatable(event.source, event.move, event.target)) {
      lastUsed.set(event.source, { move: event.move, target: event.target });
    }
  });

  for (const gone of [BattleEvents.UnitFaints, BattleEvents.UnitLeavesField] as const) {
    battle.on(gone, EventPriority.Post, (event) => {
      lastUsed.delete(event.source);
    });
  }

  /** The move an encore would repeat, or nothing when there is none */
  function encoredMove(target: Unit): Moves | undefined {
    const move = lastUsed.get(target)?.move;

    return move != null && target.moves[move] != null ? move : undefined;
  }

  /**
   * Where the repeat is pointed. The original aim stands while it is
   * still standing; once it is gone the move goes to the other side
   * instead, so a performance is not wasted on a corpse
   */
  function repeatTarget(source: Unit, aim: MoveTarget): MoveTarget | undefined {
    if (aim.type !== MoveTargetType.Unit || aim.unit.alive) {
      return aim;
    }

    for (const unit of battle.units(source.team.alliance)) {
      if (unit.alive) {
        return unitTarget(unit);
      }
    }
    return undefined;
  }

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Encore) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        event.target.unit.status[Statuses.Encored] == null &&
        encoredMove(event.target.unit) !== undefined;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move !== Moves.Encore || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const friendly = event.target.unit.team.alliance === event.source.team.alliance;

    event.score += friendly ? ENCORE_BONUS : -USELESS_PENALTY;

    // Each step plays a repeat rather than winding one up, so the
    // chooser's per-step charge is handed back
    event.score += STEP_PENALTY * event.source.checkMoveSteps(event.move, event.target);
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Encore || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const encored = lastUsed.get(target);
    const move = encoredMove(target);

    if (encored == null || move == null) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    // The mark is the performance itself, so it goes on once and runs
    // its own clock out alongside the remaining steps
    if (target.status[Statuses.Encored] == null) {
      target.addStatus(Statuses.Encored, {
        type: EffectType.Move,
        move: Moves.Encore,
        unit: event.source,
      });
    }

    const aim = repeatTarget(target, encored.target);

    if (aim === undefined) {
      return;
    }

    // One trigger, never a cast: the repeat costs the target nothing,
    // and the move is a single-step one, so the trigger is the whole
    // of it
    target.triggerMove(move, aim, 0);
  });
}
