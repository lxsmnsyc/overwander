import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import type { Stages } from '../../../data/constants/stats';
import type Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from './create';

/** Abilities that raise one of their holder's stages when something happens */

/**
 * Meta ability for the ones a knockout feeds (Moxie, Chilling Neigh,
 * Grim Neigh): a direct move that knocks a unit out raises one stage
 * https://bulbapedia.bulbagarden.net/wiki/Moxie_(Ability)
 */
export function createMoxieAbility(ability: Abilities, stage: Stages): (battle: Battle) => void {
  return createAbility(
    ability,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            event.success &&
            !event.target.alive &&
            !(event.flags & DamageFlags.Indirect) &&
            event.cause.type === EffectType.Move &&
            event.cause.unit !== event.target &&
            event.cause.unit.hasAbility(ability)
          ) {
            event.cause.unit.triggerAbility(ability);
          }
        }),
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
 * Meta ability for the two that come in ready (Intrepid Sword,
 * Dauntless Shield): one stage on entering, once a battle, which is
 * the Gen 9 rule. A holder whose entry was quieted pays when it wakes
 * https://bulbapedia.bulbagarden.net/wiki/Intrepid_Sword_(Ability)
 */
export function createIntrepidSwordAbility(
  ability: Abilities,
  stage: Stages,
): (battle: Battle) => void {
  return createAbility(ability, (battle) => {
    const spent = new WeakSet<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        const unit = event.source;

        if (!spent.has(unit) && unit.alive && unit.hasAbility(ability)) {
          unit.triggerAbility(ability);
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === ability) {
          spent.add(event.source);
          event.source.addStage(stage, 1, {
            type: EffectType.Ability,
            ability,
            unit: event.source,
          });
        }
      }),
    ]);
  });
}
