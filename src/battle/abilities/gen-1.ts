import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Abilities } from '../../data/ids/abilities';
import { DamageFlags, MoveFlags } from '../../data/ids/moves';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import { BattleEvents, EffectType } from '../events';
import { isWeatherRainy, isWeatherSunny } from '../utils';
import {
  createAbility,
  createBlazeAbility,
  MergedAbilityLifecycle,
} from './__create';

const setupAbilities = [
  // Bulbasaur
  createBlazeAbility(Abilities.Overgrow, Types.Grass),
  createAbility(Abilities.Chlorophyll, battle => {
    // https://bulbapedia.bulbagarden.net/wiki/Chlorophyll_(Ability)
    return battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, event => {
      if (
        event.stat === Stats.Speed &&
        event.source.hasAbility(Abilities.Chlorophyll)
      ) {
        event.value *= 2;
      }
    });
  }),

  // Mega Venusaur
  // https://bulbapedia.bulbagarden.net/wiki/Thick_Fat_(Ability)
  createAbility(Abilities.ThickFat, battle => {
    return battle.on(
      BattleEvents.UnitAttackResolveStat,
      EventPriority.Post,
      event => {
        const type = event.parent.type;
        if (
          (type === Types.Fire || type === Types.Ice) &&
          (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
          event.parent.target.hasAbility(Abilities.ThickFat)
        ) {
          event.value *= 0.5;
        }
      },
    );
  }),

  // Charmander
  createBlazeAbility(Abilities.Blaze, Types.Fire),

  // https://bulbapedia.bulbagarden.net/wiki/Solar_Power_(Ability)
  createAbility(Abilities.SolarPower, battle => {
    return new MergedAbilityLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, event => {
        if (
          isWeatherSunny(battle) &&
          event.stat === Stats.SpecialAttack &&
          event.source.hasAbility(Abilities.SolarPower)
        ) {
          event.value *= 2;
        }
      }),
      // Due to the lack of turn mechanics, we only need to damage the
      // unit when it starts using an ability
      battle.on(BattleEvents.MoveStartCast, EventPriority.Post, event => {
        if (
          isWeatherSunny(battle) &&
          event.move.source.hasAbility(Abilities.SolarPower)
        ) {
          const maxHP = event.move.source.checkStat(Stats.HP, 0);
          event.move.source.damage(
            {
              type: EffectType.Ability,
              ability: Abilities.SolarPower,
              unit: event.move.source,
            },
            event.move.source,
            maxHP / 8,
            DamageFlags.NonLethal,
          );

          // For visual cues
          event.move.source.triggerAbility(Abilities.SolarPower);
        }
      }),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Tough_Claws_(Ability)
  createAbility(Abilities.ToughClaws, battle => {
    const FACTOR = 5325 / 4096;
    return battle.on(BattleEvents.CheckMovePower, EventPriority.Post, event => {
      if (event.power != null) {
        const moveData = getMoveData(event.move);
        if (
          event.source.hasAbility(Abilities.ToughClaws) &&
          moveData.flags & MoveFlags.Contact
        ) {
          event.power *= FACTOR;
        }
      }
    });
  }),

  // createDrizzleAbility(Abilities.Drought, Weathers.Sunny),

  // Squirtle
  createBlazeAbility(Abilities.Torrent, Types.Water),

  // https://bulbapedia.bulbagarden.net/wiki/Rain_Dish_(Ability)
  createAbility(Abilities.RainDish, battle => {
    // No turn mechanics, we use move cast instead.
    return battle.on(BattleEvents.MoveStartCast, EventPriority.Post, event => {
      if (
        isWeatherRainy(battle) &&
        event.move.source.hasAbility(Abilities.RainDish)
      ) {
        const maxHP = event.move.source.checkStat(Stats.HP, 0);
        event.move.source.setHealth(event.move.source.health + maxHP);

        // For visual cues
        event.move.source.triggerAbility(Abilities.RainDish);
      }
    });
  }),

  // Caterpie/Weedle
  // https://bulbapedia.bulbagarden.net/wiki/Shield_Dust_(Ability)
  createAbility(Abilities.ShieldDust, battle => {
    return battle.on(
      BattleEvents.UnitAttackEffect,
      EventPriority.Pre,
      event => {
        // Disable event
        if (event.parent.target.hasAbility(Abilities.ShieldDust)) {
          event.disabled = true;

          // For visual cues
          event.parent.target.triggerAbility(Abilities.ShieldDust);
        }
      },
    );
  }),
  // https://bulbapedia.bulbagarden.net/wiki/Run_Away_(Ability)
  createAbility(Abilities.RunAway, battle => {
    return battle.on(
      BattleEvents.CheckUnitEscape,
      EventPriority.Post,
      event => {
        if (event.source.hasAbility(Abilities.RunAway)) {
          event.success = true;

          // For visual cues
          event.source.triggerAbility(Abilities.RunAway);
        }
      },
    );
  }),

  // Metapod/Kakuna
];

export function setupGen1Abilities(battle: Battle) {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
