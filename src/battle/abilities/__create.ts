import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import type { Types } from '../../data/constants/types';
import type { Abilities } from '../../data/ids/abilities';
import { Weathers } from '../../data/ids/status';
import type { Battle } from '../core';
import { BattleEvents } from '../events';
import type { Unit } from '../unit';

interface AbilityLifecycle {
  start(): void;
  stop(): void;
}

export class MergedAbilityLifecycle implements AbilityLifecycle {
  constructor(public lifecycles: AbilityLifecycle[]) {
    // no-op
  }

  start() {
    for (const lifecycle of this.lifecycles) {
      lifecycle.start();
    }
  }

  stop() {
    for (const lifecycle of this.lifecycles) {
      lifecycle.stop();
    }
  }
}

export function createAbility(
  ability: Abilities,
  setup: (battle: Battle) => AbilityLifecycle,
) {
  return (battle: Battle) => {
    const lifecycle = setup(battle);

    const units = new Set<Unit>();

    function enableAbility(current: Abilities, source: Unit) {
      if (current === ability) {
        units.add(source);

        if (units.size === 1) {
          lifecycle.start();
        }
      }
    }

    function disableAbility(current: Abilities, source: Unit) {
      if (ability === current) {
        units.delete(source);

        if (units.size === 0) {
          lifecycle.stop();
        }
      }
    }

    battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, event => {
      enableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, event => {
      disableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitEnableAbility, EventPriority.Post, event => {
      enableAbility(event.ability, event.source);
    });

    battle.on(BattleEvents.UnitDisableAbility, EventPriority.Post, event => {
      disableAbility(event.ability, event.source);
    });
  };
}

/**
 * This is a meta ability for Blaze, Overgrow, Swarm and Torrent
 * https://bulbapedia.bulbagarden.net/wiki/Overgrow_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Blaze_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Torrent_(Ability)
 */
export function createBlazeAbility(
  targetAbility: Abilities,
  targetType: Types,
) {
  return createAbility(targetAbility, battle => {
    return battle.on(
      BattleEvents.UnitAttackResolveStat,
      EventPriority.Post,
      event => {
        const source = event.parent.source;
        const type = event.parent.type;
        if (
          type === targetType &&
          event.unit === source &&
          (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
          source.hasAbility(targetAbility)
        ) {
          const currentHP = source.health;
          const maxHP = source.checkStat(Stats.HP, 0);

          if (currentHP <= maxHP / 3) {
            event.value *= 1.5;
          }
        }
      },
    );
  });
}

/**
 * Meta ability for Drizzle, Drought, Sand Stream and Snow Warning
 * https://bulbapedia.bulbagarden.net/wiki/Drizzle_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Drought_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Sand_Stream_(Ability)
 */
export function createDrizzleAbility(
  targetAbility: Abilities,
  targetWeather: Weathers,
) {
  function triggerWeather(battle: Battle, source: Unit) {
    if (source.hasAbility(targetAbility)) {
      switch (battle.weather.current) {
        case Weathers.ExtremeSunny:
        case Weathers.HeavyRain:
        case Weathers.StrongWinds:
          break;
        default:
          battle.setWeather(targetWeather);
          source.triggerAbility(targetAbility);
          break;
      }
    }
  }
  return createAbility(targetAbility, battle => {
    return new MergedAbilityLifecycle([
      // For when the unit transforms
      battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, event => {
        triggerWeather(battle, event.source);
      }),
      // For when the unit re-enters
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, event => {
        triggerWeather(battle, event.source);
      }),
    ]);
  });
}
