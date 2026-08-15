import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { DamageFlags, MoveFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import { BattleEvents, type EffectCause, EffectType } from '../events';
import type Unit from '../unit';

interface SubstitutedData {
  health: number;
  cause: EffectCause;
}

export default function setupSubstitutedStatus(battle: Battle): void {
  const instances = new Map<Unit, SubstitutedData>();

  battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Substituted && !instances.has(event.source)) {
      instances.set(event.source, {
        // The substitute's own HP equals the cost paid for it
        health: Math.floor(event.source.checkStat(Stats.HP, 0) / 4),
        cause: event.cause,
      });
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Substituted) {
      instances.delete(event.source);
    }
  });

  // The substitute doesn't follow the unit out of the field
  battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
    const data = instances.get(event.source);
    if (data) {
      event.source.removeStatus(Statuses.Substituted, data.cause);
    }
  });

  /**
   * Direct move damage from another unit is absorbed by the substitute.
   * Indirect damage (status conditions, recoil, Leech Seed) and sound-based
   * moves go through, matching the modern behavior. Excess damage beyond
   * the substitute's remaining HP is discarded.
   *
   * This one stays on the damage itself rather than answering
   * CheckUnitCanDamage: a substitute does not refuse the hit, it eats
   * it, and the eating has to happen exactly when the hit does. The
   * blanket immunities are consulted before this runs, so a substitute
   * never spends itself on damage its owner was never going to take.
   */
  battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
    const data = instances.get(event.target);

    if (
      data &&
      !(event.flags & DamageFlags.Indirect) &&
      event.cause.type === EffectType.Move &&
      event.cause.unit !== event.target &&
      // Sound-based moves and piercing damage (e.g. Infiltrator) go
      // through
      !(getMoveData(event.cause.move).flags & MoveFlags.Sound) &&
      !(event.flags & DamageFlags.Piercing)
    ) {
      data.health -= event.value;

      if (data.health <= 0) {
        event.target.removeStatus(Statuses.Substituted, data.cause);
      }

      event.disabled = true;
    }
  });

  // The substitute blocks status conditions inflicted by other units' moves
  battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
    if (
      !event.immune &&
      event.source.status[Statuses.Substituted] &&
      event.cause.type === EffectType.Move &&
      event.cause.unit !== event.source
    ) {
      event.immune = true;
    }
  });

  // ...as well as stat stage changes from other units' moves
  battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
    if (
      event.success &&
      event.source.status[Statuses.Substituted] &&
      event.cause.type === EffectType.Move &&
      event.cause.unit !== event.source
    ) {
      event.success = false;
    }
  });
}
