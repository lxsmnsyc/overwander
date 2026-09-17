import { EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { StatFlags } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { ACCURACY_STAGE_LIMIT, accuracyScale } from '../../mechanics/move/trigger';
import { createAbility } from '../__create';
import { createSinnohFossilAbility } from './__create';

/** A combined accuracy stage never counts past its own limit */
function clampStage(stage: number): number {
  return Math.max(-ACCURACY_STAGE_LIMIT, Math.min(stage, ACCURACY_STAGE_LIMIT));
}

/**
 * Sinnoh's next three: the lion nothing hides from, and the two
 * fossils that argue about cover
 */
const setupAbilities = [
  /**
   * Gleam Eyes: the eyes see through what a target puts between them,
   * whether that is a Double Team or the ceiling of a Dig
   */
  createAbility(Abilities.GleamEyes, (battle) => {
    // What the accuracy roll said before a hiding place answered it
    const rolled = new WeakMap<object, boolean>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerMoveResolveAccuracy, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          event.accuracy == null ||
          parent.target.type !== MoveTargetType.Unit ||
          !parent.source.hasAbility(Abilities.GleamEyes)
        ) {
          return;
        }

        const evasion = parent.target.unit.checkStage(Stages.Evasion, StatFlags.Attack);

        if (evasion <= 0) {
          return;
        }

        // Weighed the way the roll weighs it, so only the evasion half
        // is taken back out: a lowered accuracy still counts
        const accuracy = parent.source.checkStage(Stages.Accuracy, StatFlags.Attack);

        event.accuracy *=
          accuracyScale(clampStage(accuracy)) / accuracyScale(clampStage(accuracy - evasion));
      }),
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Exact, (event) => {
        rolled.set(event, event.hit);
      }),
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          event.hit ||
          rolled.get(event) !== true ||
          parent.target.type !== MoveTargetType.Unit ||
          parent.target.unit.status[Statuses.Invulnerable] == null ||
          !parent.source.hasAbility(Abilities.GleamEyes)
        ) {
          return;
        }

        // The roll had already landed it: the only thing that took it
        // away was the hiding place
        event.hit = true;
        parent.source.triggerAbility(Abilities.GleamEyes);
      }),
    ]);
  }),

  createSinnohFossilAbility(Abilities.Ramrod, 'rams'),
  createSinnohFossilAbility(Abilities.Bulwark, 'shields'),
];

export default setupAbilities;
