import { EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import type { Types } from '../../data/constants/types';
import type Abilities from '../../data/ids/abilities';
import { Weathers } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type Unit from '../unit';

interface AbilityLifecycle {
  start(): void;
  stop(): void;
}

export class MergedAbilityLifecycle implements AbilityLifecycle {
  constructor(public lifecycles: AbilityLifecycle[]) {
    // no-op
  }

  start(): void {
    for (const lifecycle of this.lifecycles) {
      lifecycle.start();
    }
  }

  stop(): void {
    for (const lifecycle of this.lifecycles) {
      lifecycle.stop();
    }
  }
}

export function createAbility(ability: Abilities, setup: (battle: Battle) => AbilityLifecycle) {
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
 * This is a meta ability for Blaze, Overgrow, Swarm and Torrent
 * https://bulbapedia.bulbagarden.net/wiki/Overgrow_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Blaze_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Torrent_(Ability)
 */
export function createBlazeAbility(
  targetAbility: Abilities,
  targetType: Types,
): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
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
    }),
  );
}

/**
 * Meta ability for weather status guards (Hydration, Leaf Guard):
 * the holder cannot receive major status conditions while its
 * weather is up
 * https://bulbapedia.bulbagarden.net/wiki/Hydration_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Leaf_Guard_(Ability)
 */
export function createHydrationAbility(
  targetAbility: Abilities,
  inWeather: (unit: Unit) => boolean,
): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: no major status conditions in the weather
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            MAJOR_STATUS_CONDITIONS.has(event.status) &&
            inWeather(event.source) &&
            event.source.hasAbility(targetAbility)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (
            MAJOR_STATUS_CONDITIONS.has(event.status) &&
            inWeather(event.source) &&
            event.source.hasAbility(targetAbility)
          ) {
            event.source.triggerAbility(targetAbility);
          }
        }),
      ]),
  );
}

/**
 * Meta ability for type-absorbing healers (Water Absorb, Volt
 * Absorb): the holder is immune to the type and heals a quarter of
 * its max health when a real move of it fails against it
 * https://bulbapedia.bulbagarden.net/wiki/Water_Absorb_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Volt_Absorb_(Ability)
 */
export function createWaterAbsorbAbility(
  targetAbility: Abilities,
  targetType: Types,
): (battle: Battle) => void {
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: grants the type immunity
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === targetType &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(targetAbility)
          ) {
            event.immune = true;
          }
        }),
        // Detection: a real move of the type fails against the holder
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(targetAbility) &&
            parent.source.checkMoveType(parent.move, parent.target) === targetType
          ) {
            parent.target.unit.triggerAbility(targetAbility);
          }
        }),
        // Effect: the quarter-max-health heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === targetAbility) {
            event.source.heal(
              {
                type: EffectType.Ability,
                ability: targetAbility,
                unit: event.source,
              },
              event.source,
              event.source.checkStat(Stats.HP, 0) / 4,
              0,
            );
          }
        }),
      ]),
  );
}

/**
 * Meta ability for Keen Eye and Illuminate (modern mechanics): other
 * units cannot lower the holder's accuracy
 * https://bulbapedia.bulbagarden.net/wiki/Keen_Eye_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Illuminate_(Ability)
 */
export function createKeenEyeAbility(targetAbility: Abilities): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) =>
    battle.on(BattleEvents.CheckUnitAddStage, EventPriority.Post, (event) => {
      if (
        event.success &&
        event.stage === Stages.Accuracy &&
        event.value < 0 &&
        event.source.hasAbility(targetAbility) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.success = false;

        // For visual cues
        event.source.triggerAbility(targetAbility);
      }
    }),
  );
}

/**
 * Meta ability for Shell Armor and Battle Armor: critical hits never
 * land on the holder
 * https://bulbapedia.bulbagarden.net/wiki/Shell_Armor_(Ability)
 * https://bulbapedia.bulbagarden.net/wiki/Battle_Armor_(Ability)
 */
export function createShellArmorAbility(targetAbility: Abilities): (battle: Battle) => void {
  return createAbility(targetAbility, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
      if (event.critical && event.parent.target.hasAbility(targetAbility)) {
        event.critical = false;
      }
    }),
  );
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
): (battle: Battle) => void {
  // Primal weathers cannot be overridden
  const PRIMAL_WEATHERS = new Set<Weathers>([
    Weathers.ExtremeSunny,
    Weathers.HeavyRain,
    Weathers.StrongWinds,
  ]);

  function triggerWeather(battle: Battle, source: Unit): void {
    if (source.hasAbility(targetAbility) && !PRIMAL_WEATHERS.has(battle.weather.current)) {
      source.triggerAbility(targetAbility);
    }
  }
  return createAbility(
    targetAbility,
    (battle) =>
      new MergedAbilityLifecycle([
        // For when the unit transforms
        battle.on(BattleEvents.UnitAddAbility, EventPriority.Post, (event) => {
          triggerWeather(battle, event.source);
        }),
        // For when the unit re-enters
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          triggerWeather(battle, event.source);
        }),
        // The weather change rides the trigger; scope resolves
        // through the unit (battle mode, Boss override)
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === targetAbility) {
            event.source.setWeather(targetWeather);
          }
        }),
      ]),
  );
}
