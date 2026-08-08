import { EventPriority } from '../../core/event-emitter';
import { Genders } from '../../data/ids/species';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

/**
 * Infatuation: the unit is smitten with the unit that caused the
 * status and acts only half of the time. It only takes hold between
 * opposite genders and breaks when either side leaves the field.
 * https://bulbapedia.bulbagarden.net/wiki/Infatuation
 */
export default function setupInfatuatedStatus(battle: Battle): void {
  const instances = new Map<Unit, EffectCause>();

  function charmerOf(cause: EffectCause): Unit | undefined {
    return cause.type === EffectType.None ? undefined : cause.unit;
  }

  // Only the opposite gender can infatuate
  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Exact, (event) => {
    if (event.immune || event.status !== Statuses.Infatuated) {
      return;
    }

    const charmer = charmerOf(event.cause);

    if (
      event.source.gender === Genders.Genderless ||
      charmer == null ||
      charmer.gender === Genders.Genderless ||
      charmer.gender === event.source.gender
    ) {
      event.immune = true;
    }
  });

  // Immobilized by love half of the time
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.source.status[Statuses.Infatuated] != null &&
      battle.random() < 0.5
    ) {
      event.success = false;

      event.source.triggerStatus(Statuses.Infatuated, {
        type: EffectType.None,
      });
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Infatuated) {
      instances.set(event.source, event.cause);
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Infatuated) {
      instances.delete(event.source);
    }
  });

  // The infatuation breaks when either side is gone
  function release(gone: Unit): void {
    for (const [unit, cause] of instances) {
      if (unit === gone || charmerOf(cause) === gone) {
        unit.removeStatus(Statuses.Infatuated, cause);
      }
    }
  }

  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    release(event.source);
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
    release(event.source);
  });
}
