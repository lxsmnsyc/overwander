import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import type Unit from '../../unit';
import { MergedLifecycle } from '../../lifecycle';
import turns from '../../turn';
import { createAbility } from '../__create';
import { createTimedMarks } from './__create';

/** How long a jaw stays shut before it can bite a cast again */
export const JAW_SNAP_COOLDOWN = turns(4);

/** How long the cold holds a target, and what it costs them */
export const FROSTBOUND_DURATION = turns(3);
export const FROSTBOUND_SCALE = 1.3;

/**
 * Kalos's two fossils, which are the same attack on the clock told
 * twice: the king bites a move shut and the aurora makes the next one
 * take longer. One ends what was started, the other makes starting
 * dear
 */
const setupAbilities = [
  createAbility(Abilities.JawSnap, (battle) => {
    // How long each target is safe from the jaw, so a fight is not
    // one pokemon never finishing a move
    const bitten = createTimedMarks(battle);

    return new MergedLifecycle([
      ...bitten.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;
        const cause = event.cause;

        if (
          !event.success ||
          (event.flags & DamageFlags.Indirect) !== 0 ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          !cause.unit.hasAbility(Abilities.JawSnap) ||
          bitten.has(target) ||
          (target.casting == null && target.channeling == null)
        ) {
          return;
        }

        bitten.mark(target, JAW_SNAP_COOLDOWN);
        cause.unit.triggerAbility(Abilities.JawSnap);
        target.stopCast();
        target.stopChannel();
      }),
    ]);
  }),

  createAbility(Abilities.Frostbound, (battle) => {
    // Who is still cold, and for how much longer
    const frozen = createTimedMarks(battle);

    /** Whether the cold is on this one now */
    function held(unit: Unit): boolean {
      return frozen.has(unit);
    }

    return new MergedLifecycle([
      ...frozen.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;

        if (
          !event.success ||
          (event.flags & DamageFlags.Indirect) !== 0 ||
          cause.type !== EffectType.Move ||
          cause.unit === event.target ||
          !cause.unit.hasAbility(Abilities.Frostbound)
        ) {
          return;
        }
        cause.unit.triggerAbility(Abilities.Frostbound);
        frozen.mark(event.target, FROSTBOUND_DURATION);
      }),
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (held(event.source)) {
          event.duration *= FROSTBOUND_SCALE;
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Post, (event) => {
        if (held(event.source)) {
          event.duration *= FROSTBOUND_SCALE;
        }
      }),
    ]);
  }),
];

export default setupAbilities;
