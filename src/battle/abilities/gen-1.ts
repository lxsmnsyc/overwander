import { EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Abilities } from '../../data/ids/abilities';
import { DamageFlags, MoveFlags } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import { BattleEvents, EffectType, type UnitAttackEvent } from '../events';
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
          isWeatherSunny(event.source) &&
          event.stat === Stats.SpecialAttack &&
          event.source.hasAbility(Abilities.SolarPower)
        ) {
          event.value *= 2;
        }
      }),
      // Due to the lack of turn mechanics, we only need to damage the
      // unit when it starts using an ability
      battle.on(BattleEvents.UnitCast, EventPriority.Post, event => {
        if (
          isWeatherSunny(event.source) &&
          event.source.hasAbility(Abilities.SolarPower)
        ) {
          const maxHP = event.source.checkStat(Stats.HP, 0);
          event.source.damage(
            {
              type: EffectType.Ability,
              ability: Abilities.SolarPower,
              unit: event.source,
            },
            event.source,
            maxHP / 8,
            DamageFlags.NonLethal,
          );

          // For visual cues
          event.source.triggerAbility(Abilities.SolarPower);
        }
      }),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Tough_Claws_(Ability)
  createAbility(Abilities.ToughClaws, battle => {
    const FACTOR = 5325 / 4096;
    return battle.on(
      BattleEvents.CheckUnitMovePower,
      EventPriority.Post,
      event => {
        if (event.power != null) {
          const moveData = getMoveData(event.move);
          if (
            event.source.hasAbility(Abilities.ToughClaws) &&
            moveData.flags & MoveFlags.Contact
          ) {
            event.power *= FACTOR;
          }
        }
      },
    );
  }),

  // createDrizzleAbility(Abilities.Drought, Weathers.Sunny),

  // Squirtle
  createBlazeAbility(Abilities.Torrent, Types.Water),

  // https://bulbapedia.bulbagarden.net/wiki/Rain_Dish_(Ability)
  createAbility(Abilities.RainDish, battle => {
    // No turn mechanics, we use move cast instead.
    return battle.on(BattleEvents.UnitCast, EventPriority.Post, event => {
      if (
        isWeatherRainy(event.source) &&
        event.source.hasAbility(Abilities.RainDish)
      ) {
        const maxHP = event.source.checkStat(Stats.HP, 0) / 16;
        event.source.setHealth(event.source.health + maxHP);

        // For visual cues
        event.source.triggerAbility(Abilities.RainDish);
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
  // https://bulbapedia.bulbagarden.net/wiki/Shed_Skin_(Ability)
  createAbility(Abilities.ShedSkin, battle => {
    const CURABLE_STATUS = [
      Statuses.Poisoned,
      Statuses.BadlyPoisoned,
      Statuses.Paralyzed,
      Statuses.Sleeping,
      Statuses.Burned,
      Statuses.Frozen,
    ];

    // No turn mechanics, we roll the 30% cure on move cast instead.
    return battle.on(BattleEvents.UnitCast, EventPriority.Post, event => {
      if (
        event.source.hasAbility(Abilities.ShedSkin) &&
        CURABLE_STATUS.some(status => event.source.status[status]) &&
        battle.random() < 0.3
      ) {
        event.source.cure({
          type: EffectType.Ability,
          ability: Abilities.ShedSkin,
          unit: event.source,
        });

        // For visual cues
        event.source.triggerAbility(Abilities.ShedSkin);
      }
    });
  }),

  // Butterfree
  // https://bulbapedia.bulbagarden.net/wiki/Compound_Eyes_(Ability)
  createAbility(Abilities.CompoundEyes, battle => {
    return battle.on(
      BattleEvents.CheckUnitMoveAccuracy,
      EventPriority.Post,
      event => {
        if (
          event.accuracy != null &&
          event.source.hasAbility(Abilities.CompoundEyes)
        ) {
          event.accuracy *= 1.3;
        }
      },
    );
  }),

  // Beedrill
  createBlazeAbility(Abilities.Swarm, Types.Bug),

  // https://bulbapedia.bulbagarden.net/wiki/Sniper_(Ability)
  createAbility(Abilities.Sniper, battle => {
    return battle.on(
      BattleEvents.UnitAttackResolveCriticalMult,
      EventPriority.Post,
      event => {
        if (event.parent.source.hasAbility(Abilities.Sniper)) {
          event.value *= 1.5;
        }
      },
    );
  }),

  // Pidgey
  // https://bulbapedia.bulbagarden.net/wiki/Keen_Eye_(Ability)
  createAbility(Abilities.KeenEye, battle => {
    return battle.on(BattleEvents.UnitAddStage, EventPriority.Pre, event => {
      if (
        event.stage === Stages.Accuracy &&
        event.value < 0 &&
        event.source.hasAbility(Abilities.KeenEye) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.disabled = true;

        // For visual cues
        event.source.triggerAbility(Abilities.KeenEye);
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Tangled_Feet_(Ability)
  createAbility(Abilities.TangledFeet, battle => {
    return battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, event => {
      if (
        event.stage === Stages.Evasion &&
        event.source.status[Statuses.Confused] &&
        event.source.hasAbility(Abilities.TangledFeet)
      ) {
        event.value *= 2;
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Big_Pecks_(Ability)
  createAbility(Abilities.BigPecks, battle => {
    return battle.on(BattleEvents.UnitAddStage, EventPriority.Pre, event => {
      if (
        event.stage === Stages.Defense &&
        event.value < 0 &&
        event.source.hasAbility(Abilities.BigPecks) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.disabled = true;

        // For visual cues
        event.source.triggerAbility(Abilities.BigPecks);
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Tinted_Lens_(Ability)
  createAbility(Abilities.TintedLens, battle => {
    // Total effectiveness per attack; doubling applies once on the
    // final damage when the attack is not very effective overall.
    const totals = new WeakMap<UnitAttackEvent, number>();

    return new MergedAbilityLifecycle([
      battle.on(
        BattleEvents.UnitAttackResolveEffectiveness,
        EventPriority.Post,
        event => {
          if (event.parent.source.hasAbility(Abilities.TintedLens)) {
            totals.set(
              event.parent,
              (totals.get(event.parent) ?? 1) * event.multiplier,
            );
          }
        },
      ),
      battle.on(
        BattleEvents.UnitAttackResolveDamage,
        EventPriority.Post,
        event => {
          const total = totals.get(event.parent);

          if (total != null && total < 1) {
            event.value *= 2;
          }
        },
      ),
    ]);
  }),
];

export function setupGen1Abilities(battle: Battle) {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
