import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Types } from '../../data/constants/types';
import { DamageFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import { isWeatherSunny } from '../utils';
import turns from '../turn';
import createTimedStatus from './__create';

// Real-time equivalent of the ~20%-per-turn thaw chance
// No fixed length in the mainline: a fifth of a chance to thaw each
// turn, which comes out at five turns
const DURATION = turns(5);

const setupTimer = createTimedStatus(Statuses.Frozen, DURATION);

export default function setupFrozenStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.source.status[Statuses.Frozen]) {
      event.success = false;

      event.source.triggerStatus(Statuses.Frozen, {
        type: EffectType.None,
      });
    }
  });

  // Fire-type move damage thaws the target
  battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
    const cause = event.target.status[Statuses.Frozen];

    if (
      cause &&
      event.success &&
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      getMoveData(event.cause.move).type === Types.Fire
    ) {
      event.target.removeStatus(Statuses.Frozen, cause);
    }
  });

  // Nothing freezes in the sun, however cold what hit it was
  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
    if (!event.immune && event.status === Statuses.Frozen && isWeatherSunny(event.source)) {
      event.immune = true;
    }
  });

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Frozen) {
      event.source.interrupt();
    }
  });

  battle.on(BattleEvents.UnitCure, EventPriority.Post, (event) => {
    event.source.removeStatus(Statuses.Frozen, event.cause);
  });
}
