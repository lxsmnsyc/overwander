import { EventPriority } from '../../../core/event-emitter';
import { MAX_STAGE, type Stages } from '../../../data/constants/stats';
import type Abilities from '../../../data/ids/abilities';
import { FEED_BONUS } from '../../ai/score';
import type Battle from '../../core';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility } from './create';
import type { AbsorbMatcher } from './matchers';
import { createFeedScoring } from './scoring';

/** Abilities that take a move rather than a blow: what they match, and what they pay */
/**
 * An ability that refuses a move outright and takes a stage from it
 * instead: Sap Sipper, Motor Drive, Storm Drain, Wind Rider.
 *
 * The refusal and the payout are deliberately separate. The immunity
 * is a pure answer to a question anybody may ask, including the AI's
 * speculative pass, while only a move that really failed against the
 * holder pays out, so a chooser weighing a move never raises a stage
 * by thinking about it
 */
export function createAbsorbStageAbility(
  ability: Abilities,
  stage: Stages,
  matches: AbsorbMatcher,
): (battle: Battle) => void {
  return createAbility(
    ability,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(ability) &&
            matches(event.source, event.move, event.target, event.type)
          ) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(ability) &&
            matches(
              parent.source,
              parent.move,
              parent.target,
              parent.source.checkMoveType(parent.move, parent.target),
            )
          ) {
            parent.target.unit.triggerAbility(ability);
          }
        }),
        createFeedScoring(battle, ability, matches, (holder) =>
          holder.stages[stage] >= MAX_STAGE ? 0 : FEED_BONUS,
        ),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === ability) {
            event.source.addStage(stage, 1, {
              type: EffectType.Ability,
              ability,
              unit: event.source,
            });
          }
        }),
      ]),
  );
}

/**
 * An ability that refuses every stat drop somebody else tries to
 * land: Clear Body and White Smoke, which are one effect printed
 * under two names. A drop the holder inflicts on itself still lands
 */
export function createClearBodyAbility(ability: Abilities): (battle: Battle) => void {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
      if (
        event.success &&
        event.value < 0 &&
        event.source.hasAbility(ability) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.success = false;

        // A cue is something a watcher sees, so it waits for a real
        // attempt rather than the AI weighing one
        if (!event.simulated) {
          event.source.triggerAbility(ability);
        }
      }
    }),
  );
}
