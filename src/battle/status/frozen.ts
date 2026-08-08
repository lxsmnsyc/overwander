import { EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type { Unit } from '../unit';

interface FrozenData {
  progress: number;
  cause: EffectCause;
}

// Real-time equivalent of the ~20%-per-turn thaw chance
const DURATION = 3000;

export function setupFrozenStatus(battle: Battle) {
  const instances = new Map<Unit, FrozenData>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Post, event => {
    for (const [unit, data] of instances.entries()) {
      data.progress -= event.duration;

      if (data.progress <= 0) {
        unit.removeStatus(Statuses.Frozen, data.cause);
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, event => {
    if (event.success && event.source.status[Statuses.Frozen]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Frozen, {
        type: EffectType.None,
      });
    }
  });

  // Fire-type move damage thaws the target
  battle.on(BattleEvents.UnitDamage, EventPriority.Post, event => {
    const data = instances.get(event.target);

    if (
      data &&
      event.success &&
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      getMoveData(event.cause.move).type === Types.Fire
    ) {
      event.target.removeStatus(Statuses.Frozen, data.cause);
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, event => {
    if (event.status === Statuses.Frozen && !instances.has(event.source)) {
      event.source.interrupt();

      instances.set(event.source, {
        progress: DURATION,
        cause: event.cause,
      });

      if (instances.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, event => {
    if (event.status === Statuses.Frozen) {
      instances.delete(event.source);

      if (instances.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitCure, EventPriority.Post, event => {
    event.source.removeStatus(Statuses.Frozen, event.cause);
  });
}
