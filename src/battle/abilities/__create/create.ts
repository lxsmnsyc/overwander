import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import type { EventListenerLifecycle } from '../../../core/event-emitter';
import type Abilities from '../../../data/ids/abilities';
import { RISKY_PENALTY } from '../../ai/score';
import type Battle from '../../core';
import type { CheckUnitAIMoveScoreEvent } from '../../events';
import { BattleEvents, MoveTargetType } from '../../events';
import type { Lifecycle } from '../../lifecycle';
import type Unit from '../../unit';

/**
 * How an ability is registered, and the hook the ones that answer a
 * touch ride
 */
export function createAbility(ability: Abilities, setup: (battle: Battle) => Lifecycle) {
  return (battle: Battle): void => {
    const lifecycle = setup(battle);

    const units = new Set<Unit>();

    function enableAbility(current: Abilities, source: Unit): void {
      if (current === ability) {
        units.add(source);

        if (units.size === 1) {
          lifecycle.start();
        }
      }
    }

    function disableAbility(current: Abilities, source: Unit): void {
      if (ability === current) {
        units.delete(source);

        if (units.size === 0) {
          lifecycle.stop();
        }
      }
    }

    battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
      enableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
      disableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitEnableAbility, EventPriority.Post, (event) => {
      enableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitDisableAbility, EventPriority.Post, (event) => {
      disableAbility(event.ability, event.source);
    });
  };
}

/**
 * The AI half of an ability that punishes whoever touches its holder
 * — Static, Flame Body, Poison Point, Effect Spore, Cute Charm.
 *
 * It is only the *warning*: what the ability actually does to the
 * attacker stays where it is written, since each of the five does
 * something different with a different chance. This is the one thing
 * they share, and it is a thing the AI cannot work out for itself —
 * the effect fires on a damage event that the speculative pass never
 * emits, so without being told, a pokemon punches a Static Pikachu
 * exactly as readily as it punches anything else.
 *
 * A warning rather than a refusal: the move still lands, so it loses
 * to an equally good one that costs nothing and beats standing about
 */
export function createContactHazard(
  battle: Battle,
  targetAbility: Abilities,
): EventListenerLifecycle<CheckUnitAIMoveScoreEvent> {
  return battle.on(BattleEvents.CheckUnitAIMoveScore, AttackPriority.Post, (event) => {
    if (
      event.target.type === MoveTargetType.Unit &&
      event.target.unit !== event.source &&
      event.source.checkMoveContact(event.move, event.target) &&
      event.target.unit.hasAbility(targetAbility)
    ) {
      event.score -= RISKY_PENALTY;
    }
  });
}
