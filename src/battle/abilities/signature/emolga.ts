import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';

/**
 * The squirrel that glides out of reach. Nothing touching it is what
 * the whole ability is about, so the moment something does the wake
 * it built is gone
 */

/** How far out of reach one landed move puts it */
export const GLIDEWAKE_STAGES = 1;

/** As far as its own gliding will take it */
export const GLIDEWAKE_CAP = 2;

const setupAbilities = [
  createAbility(Abilities.Glidewake, (battle) => {
    /** How much of each holder's evasion is the wake's to take back */
    const wake = new WeakMap<Unit, number>();

    function shed(unit: Unit): void {
      const held = wake.get(unit) ?? 0;

      if (held <= 0) {
        return;
      }

      wake.delete(unit);
      unit.addStage(Stages.Evasion, -held, {
        type: EffectType.Ability,
        ability: Abilities.Glidewake,
        unit,
      });
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const holder = event.parent.source;
        const held = wake.get(holder) ?? 0;

        if (event.value <= 0 || held >= GLIDEWAKE_CAP || !holder.hasAbility(Abilities.Glidewake)) {
          return;
        }

        holder.triggerAbility(Abilities.Glidewake);
        wake.set(holder, held + GLIDEWAKE_STAGES);
        holder.addStage(Stages.Evasion, GLIDEWAKE_STAGES, {
          type: EffectType.Ability,
          ability: Abilities.Glidewake,
          unit: holder,
        });
      }),

      // Anything reaching it takes the whole wake, not a stage of it:
      // it is out of reach until it is not
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (event.success && !(event.flags & DamageFlags.Indirect)) {
          shed(event.target);
        }
      }),

      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        wake.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        wake.delete(event.source);
      }),
    ]);
  }),
];

export default setupAbilities;
