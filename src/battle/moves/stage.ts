import { AttackPriority } from '../../core/event-emitter';
import { MAX_STAGE, MIN_STAGE } from '../../data/constants/stats';
import Abilities from '../../data/ids/abilities';
import { MoveAffects, type Moves } from '../../data/ids/moves';
import { STAGE_MOVES, type StageMoveEffect } from '../../data/battle';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { USELESS_PENALTY } from '../ai/score';
import {
  BattleEvents,
  type EffectCause,
  EffectType,
  type MoveTarget,
  MoveTargetType,
} from '../events';
import resolveMoveTargets from '../mechanics/move/targeting';
import type Unit from '../unit';

export type { StageMoveEffect };

function setupStageChanges(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    let target = event.source;
    if (event.target.type === MoveTargetType.Unit) {
      target = event.target.unit;
    }
    for (const { stage, value } of getStageMoveEffects(event.move)) {
      target.addStage(stage, value, {
        type: EffectType.Move,
        unit: event.source,
        move: event.move,
      });
    }
  });
}

/**
 * Whether the two are on the same side of the field
 */
function isAlly(one: Unit, other: Unit): boolean {
  return one !== other && one.team.alliance === other.team.alliance;
}

/**
 * Every stage change a move applies, empty for a move that applies
 * none. All of them rather than the first: a Shell Smash is three
 * rises and two drops, and a pinned Attack says nothing about the rest
 */
export function getStageMoveEffects(move: Moves): StageMoveEffect[] {
  return STAGE_MOVES[move] ?? [];
}

/** The first stage change a move applies, for what shows only one */
export function getStageMoveEffect(move: Moves): StageMoveEffect | undefined {
  return getStageMoveEffects(move)[0];
}

/**
 * A stat drop aimed at the player's own side is worth casting on one
 * pokemon only: the one whose Contrary turns every drop into a rise.
 * Anything else on that side is being made worse for nothing, so the
 * AI is told so rather than being left to weigh it
 */
function setupFriendlyDrops(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (
      !event.usable ||
      event.target.type !== MoveTargetType.Unit ||
      !isAlly(event.source, event.target.unit)
    ) {
      return;
    }

    let drops = false;

    for (const effect of getStageMoveEffects(event.move)) {
      if (effect.value < 0) {
        drops = true;
      }
    }

    if (drops) {
      event.usable = event.target.unit.hasAbility(Abilities.Contrary);
    }
  });
}

/**
 * Who a stage move changes: the unit it was aimed at, everybody a move
 * cast at nobody fans out to (Growl), or else the caster itself
 */
function stageReceivers(battle: Battle, source: Unit, move: Moves, target: MoveTarget): Unit[] {
  if (target.type === MoveTargetType.Unit) {
    return [target.unit];
  }

  const data = getMoveData(move);
  const receivers: Unit[] = [];

  if (target.type === MoveTargetType.None && data.affects & MoveAffects.Unit) {
    for (const reached of resolveMoveTargets(battle, source, target, data.target, data.affects)) {
      if (reached.type === MoveTargetType.Unit) {
        receivers.push(reached.unit);
      }
    }
  }
  return receivers.length > 0 ? receivers : [source];
}

/**
 * Whether any change the move is cast for would still move a stage on
 * this receiver: a rise on the caster's side, a drop on the other.
 * Shell Smash's drops are its price. A move with none of those
 * (Swagger's gift) is judged on everything it does
 */
function stageMoves(
  receiver: Unit,
  source: Unit,
  effects: StageMoveEffect[],
  cause: EffectCause,
): boolean {
  const friendly = receiver.team.alliance === source.team.alliance;
  let wanted = 0;

  for (const effect of effects) {
    if (effect.value > 0 === friendly) {
      wanted += 1;
    }
  }

  for (const effect of effects) {
    if (wanted > 0 && effect.value > 0 !== friendly) {
      continue;
    }

    // Speculative: the AI is weighing the move, not casting it. A
    // Contrary turns the change round, so the direction is the one the
    // receiver would really take
    const change = receiver.resolveStageChange(effect.stage, effect.value, cause);
    const current = receiver.stages[effect.stage];
    const pinned = change > 0 ? current >= MAX_STAGE : current <= MIN_STAGE;

    if (change !== 0 && !pinned && (wanted === 0 || change > 0 === friendly)) {
      return true;
    }
  }
  return false;
}

export default function setupStageMoves(battle: Battle): void {
  setupFriendlyDrops(battle);

  setupStageChanges(battle);

  // A stage that will not move is a cast spent changing nothing. It is
  // pinned at the end it is being pushed towards, or something is
  // holding it: a Mist over the far side, a Clear Body under the hand.
  // The engine is asked about the second rather than the AI keeping
  // its own list of what blocks a stage
  battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    const effects = getStageMoveEffects(event.move);

    if (effects.length === 0) {
      return;
    }

    const cause = { type: EffectType.Move, move: event.move, unit: event.source } as const;
    let moving = false;

    for (const receiver of stageReceivers(battle, event.source, event.move, event.target)) {
      if (stageMoves(receiver, event.source, effects, cause)) {
        moving = true;
        break;
      }
    }

    if (!moving) {
      event.score -= USELESS_PENALTY;
    }
  });
}
