import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { hasAnyStatus } from '../utils';

/**
 * What counts as asleep enough to dream. A dormant boss is neither
 * awake nor asleep, and the same reasoning Dream Eater uses applies
 */
const DREAMING = new Set<Statuses>([Statuses.Sleeping, Statuses.Dormant]);

export default function setupNightmare(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.Nightmare) {
      event.usable =
        event.target.type === MoveTargetType.Unit &&
        hasAnyStatus(event.target.unit, DREAMING) &&
        event.target.unit.status[Statuses.Nightmared] == null;
    }
  });

  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.move !== Moves.Nightmare || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    event.target.unit.addStatus(Statuses.Nightmared, {
      type: EffectType.Move,
      move: event.move,
      unit: event.source,
    });
  });
}
