import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { MoveCategories, Moves } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import { USELESS_PENALTY } from '../ai/score';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The three that watch what somebody else is doing.
 *
 * Sucker Punch and Me First both read "is the target about to attack"
 * in the main games, which is a question about turn order there and a
 * question about the field here: a unit is either mid-cast on a
 * damaging move or it is not. That is a better home for both than the
 * coin flip on speed they were, and it is why they carry a shorter
 * wind-up rather than a turn taken first.
 *
 * Copycat takes the last move anybody cast, whoever cast it
 * https://bulbapedia.bulbagarden.net/wiki/Sucker_Punch_(move)
 */

/** What Me First gives back for reading the field right */
const ME_FIRST_POWER = 1.5;

/** Neither of the fallbacks is a move anybody copied on purpose */
const NOT_COPIED = new Set<Moves>([Moves.Copycat, Moves.Struggle, Moves.Attack, Moves.Sketch]);

/** The move a unit is committed to right now, if it is a damaging one */
function swinging(unit: Unit): Moves | undefined {
  const move = unit.casting?.move ?? unit.channeling?.move;

  return move != null && getMoveData(move).category !== MoveCategories.Status ? move : undefined;
}

export default function setupReadingTheField(battle: Battle): void {
  /** The last move cast on the field, by anybody */
  let copied: Moves | undefined;

  /** Who is in the middle of a Me First, so the bonus lands on that move */
  const taking = new Set<Unit>();

  battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Post, (event) => {
    if (!NOT_COPIED.has(event.move)) {
      copied = event.move;
    }
  });

  // Both wait for a target that has committed to something
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable) {
      return;
    }

    if (event.move === Moves.SuckerPunch || event.move === Moves.MeFirst) {
      event.usable =
        event.target.type === MoveTargetType.Unit && swinging(event.target.unit) != null;
    }
    if (event.move === Moves.Copycat) {
      event.usable = copied != null;
    }
  });

  // A Sucker Punch thrown at a target that is not swinging hits
  // nothing at all
  battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      event.move === Moves.SuckerPunch &&
      event.target.type === MoveTargetType.Unit &&
      swinging(event.target.unit) == null
    ) {
      event.immune = true;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move === Moves.Copycat) {
      if (copied == null) {
        event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
        return;
      }
      cast(event.source, copied, event);
      return;
    }

    if (event.move !== Moves.MeFirst || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const taken = swinging(target);

    if (taken == null) {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
      return;
    }

    // Taken out of its mouth: the cast is cut off and the user fires
    // the same move back before it can be finished
    target.stopCast();
    cast(event.source, taken, event);
  });

  /** Fires a taken move, following the finish-cast flow Mirror Move uses */
  function cast(
    source: Unit,
    move: Moves,
    event: { target: Parameters<Unit['triggerMove']>[1] },
  ): void {
    const steps = source.checkMoveSteps(move, event.target);

    source.triggerMove(move, event.target, steps);

    if (steps > 0) {
      source.channel(move, event.target, steps - 1);
    }
  }

  // Me First gives back half again for reading the field right
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power != null && taking.has(event.source)) {
      event.power *= ME_FIRST_POWER;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Pre, (event) => {
    if (event.move === Moves.MeFirst) {
      taking.add(event.source);
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
    taking.delete(event.source);
  });

  // Copying nothing is a cast spent on nothing
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (event.move === Moves.Copycat && copied == null) {
      event.score -= USELESS_PENALTY;
    }
  });
}
