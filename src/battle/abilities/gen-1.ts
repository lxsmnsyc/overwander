import { type EventListenerLifecycle, EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { ItemTypes } from '../../data/ids/items';
import { DamageFlags, MoveAttackFlags, MoveCategories, MoveFlags } from '../../data/ids/moves';
import { Genders } from '../../data/ids/species';
import { Statuses, TeamStatuses, Weathers } from '../../data/ids/status';
import { getItemData } from '../../data/items';
import { getMoveData } from '../../data/moves';
import type Battle from '../core';
import {
  BattleEvents,
  EffectType,
  MoveTargetType,
  type UnitAttackEvent,
  type UnitDamageEvent,
} from '../events';
import { OHKO_MOVES } from '../moves/fixed-damage';
import { SELF_DESTRUCT_MOVES } from '../moves/self-destruct';
import { hasAttackEffect } from '../moves/status';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type Team from '../team';
import type Unit from '../unit';
import {
  countHeldItems,
  hasAnyStatus,
  holdsAnyItem,
  isWeatherHail,
  isWeatherRainy,
  isWeatherSandstorm,
  isWeatherSunny,
} from '../utils';
import {
  MergedAbilityLifecycle,
  createAbility,
  createBlazeAbility,
  createDrizzleAbility,
} from './__create';

// Vetoes the residual weather chip damage carried by the given weather
// cause (see mechanics/weather.ts)
function chipImmunity(
  battle: Battle,
  ability: Abilities,
  weather: Weathers,
): EventListenerLifecycle<UnitDamageEvent> {
  return battle.on(BattleEvents.UnitDamage, EventPriority.Pre, (event) => {
    if (
      event.cause.type === EffectType.Weather &&
      event.cause.weather === weather &&
      event.target.hasAbility(ability)
    ) {
      event.disabled = true;
    }
  });
}

const setupAbilities = [
  // Bulbasaur
  createBlazeAbility(Abilities.Overgrow, Types.Grass),
  createAbility(Abilities.Chlorophyll, (battle) =>
    // https://bulbapedia.bulbagarden.net/wiki/Chlorophyll_(Ability)
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        isWeatherSunny(event.source) &&
        event.stat === Stats.Speed &&
        event.source.hasAbility(Abilities.Chlorophyll)
      ) {
        event.value *= 2;
      }
    }),
  ),

  // Bulbasaur (Mega Venusaur)
  // https://bulbapedia.bulbagarden.net/wiki/Thick_Fat_(Ability)
  createAbility(Abilities.ThickFat, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const type = event.parent.type;
      if (
        (type === Types.Fire || type === Types.Ice) &&
        event.unit === event.parent.source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        event.parent.target.hasAbility(Abilities.ThickFat)
      ) {
        event.value *= 0.5;
      }
    }),
  ),

  // Charmander
  createBlazeAbility(Abilities.Blaze, Types.Fire),

  // https://bulbapedia.bulbagarden.net/wiki/Solar_Power_(Ability)
  createAbility(
    Abilities.SolarPower,
    (battle) =>
      new MergedAbilityLifecycle([
        battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
          if (
            isWeatherSunny(event.source) &&
            event.stat === Stats.SpecialAttack &&
            event.source.hasAbility(Abilities.SolarPower)
          ) {
            event.value *= 2;
          }
        }),
        // Due to the lack of turn mechanics, we only detect on move
        // cast; the chip damage rides the trigger
        battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
          if (isWeatherSunny(event.source) && event.source.hasAbility(Abilities.SolarPower)) {
            event.source.triggerAbility(Abilities.SolarPower);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.SolarPower) {
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
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Tough_Claws_(Ability)
  createAbility(Abilities.ToughClaws, (battle) => {
    const FACTOR = 5325 / 4096;
    return battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (event.power != null) {
        const moveData = getMoveData(event.move);
        if (event.source.hasAbility(Abilities.ToughClaws) && moveData.flags & MoveFlags.Contact) {
          event.power *= FACTOR;
        }
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Drought_(Ability)
  createDrizzleAbility(Abilities.Drought, Weathers.Sunny),

  // Squirtle
  createBlazeAbility(Abilities.Torrent, Types.Water),

  // https://bulbapedia.bulbagarden.net/wiki/Rain_Dish_(Ability)
  createAbility(
    Abilities.RainDish,
    (battle) =>
      new MergedAbilityLifecycle([
        // No turn mechanics, we detect on move cast instead
        battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
          if (isWeatherRainy(event.source) && event.source.hasAbility(Abilities.RainDish)) {
            event.source.triggerAbility(Abilities.RainDish);
          }
        }),
        // The heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.RainDish) {
            const maxHP = event.source.checkStat(Stats.HP, 0) / 16;
            event.source.setHealth(event.source.health + maxHP);
          }
        }),
      ]),
  ),

  // Caterpie/Weedle
  // https://bulbapedia.bulbagarden.net/wiki/Shield_Dust_(Ability)
  createAbility(Abilities.ShieldDust, (battle) =>
    battle.on(BattleEvents.UnitAttackEffect, EventPriority.Pre, (event) => {
      // Disable event
      if (event.parent.target.hasAbility(Abilities.ShieldDust)) {
        event.disabled = true;

        // For visual cues
        event.parent.target.triggerAbility(Abilities.ShieldDust);
      }
    }),
  ),
  // https://bulbapedia.bulbagarden.net/wiki/Run_Away_(Ability)
  createAbility(Abilities.RunAway, (battle) =>
    battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.RunAway)) {
        event.success = true;

        // For visual cues
        event.source.triggerAbility(Abilities.RunAway);
      }
    }),
  ),

  // Metapod/Kakuna
  // https://bulbapedia.bulbagarden.net/wiki/Shed_Skin_(Ability)
  createAbility(
    Abilities.ShedSkin,
    (battle) =>
      new MergedAbilityLifecycle([
        // No turn mechanics, we roll the 30% cure on move cast instead
        battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
          if (
            event.source.hasAbility(Abilities.ShedSkin) &&
            hasAnyStatus(event.source, MAJOR_STATUS_CONDITIONS) &&
            battle.random() < 0.3
          ) {
            event.source.triggerAbility(Abilities.ShedSkin);
          }
        }),
        // The cure rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.ShedSkin) {
            event.source.cure({
              type: EffectType.Ability,
              ability: Abilities.ShedSkin,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // Butterfree
  // https://bulbapedia.bulbagarden.net/wiki/Compound_Eyes_(Ability)
  createAbility(Abilities.CompoundEyes, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
      if (event.accuracy != null && event.source.hasAbility(Abilities.CompoundEyes)) {
        event.accuracy *= 1.3;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Tinted_Lens_(Ability)
  createAbility(Abilities.TintedLens, (battle) => {
    // Total effectiveness per attack; doubling applies once on the
    // final damage when the attack is not very effective overall.
    const totals = new WeakMap<UnitAttackEvent, number>();

    return new MergedAbilityLifecycle([
      battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
        if (event.parent.source.hasAbility(Abilities.TintedLens)) {
          totals.set(event.parent, (totals.get(event.parent) ?? 1) * event.multiplier);
        }
      }),
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const total = totals.get(event.parent);

        if (total != null && total < 1) {
          event.value *= 2;
        }
      }),
    ]);
  }),

  // Weedle/Beedrill
  createBlazeAbility(Abilities.Swarm, Types.Bug),

  // https://bulbapedia.bulbagarden.net/wiki/Sniper_(Ability)
  createAbility(Abilities.Sniper, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveCriticalMult, EventPriority.Post, (event) => {
      if (event.parent.source.hasAbility(Abilities.Sniper)) {
        event.value *= 1.5;
      }
    }),
  ),

  // Pidgey
  // https://bulbapedia.bulbagarden.net/wiki/Keen_Eye_(Ability)
  createAbility(Abilities.KeenEye, (battle) =>
    battle.on(BattleEvents.CheckUnitAddStage, EventPriority.Post, (event) => {
      if (
        event.success &&
        event.stage === Stages.Accuracy &&
        event.value < 0 &&
        event.source.hasAbility(Abilities.KeenEye) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.success = false;

        // For visual cues
        event.source.triggerAbility(Abilities.KeenEye);
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Tangled_Feet_(Ability)
  createAbility(Abilities.TangledFeet, (battle) =>
    battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, (event) => {
      if (
        event.stage === Stages.Evasion &&
        event.source.status[Statuses.Confused] &&
        event.source.hasAbility(Abilities.TangledFeet)
      ) {
        event.value *= 2;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Big_Pecks_(Ability)
  createAbility(Abilities.BigPecks, (battle) =>
    battle.on(BattleEvents.CheckUnitAddStage, EventPriority.Post, (event) => {
      if (
        event.success &&
        event.stage === Stages.Defense &&
        event.value < 0 &&
        event.source.hasAbility(Abilities.BigPecks) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.success = false;

        // For visual cues
        event.source.triggerAbility(Abilities.BigPecks);
      }
    }),
  ),

  // Rattata
  // https://bulbapedia.bulbagarden.net/wiki/Guts_(Ability)
  createAbility(
    Abilities.Guts,
    (battle) =>
      new MergedAbilityLifecycle([
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          if (
            event.stat === Stats.Attack &&
            event.unit === event.parent.source &&
            event.unit.hasAbility(Abilities.Guts) &&
            hasAnyStatus(event.unit, MAJOR_STATUS_CONDITIONS)
          ) {
            event.value *= 1.5;
          }
        }),
        // Guts ignores the burn physical-damage halving; compensate the
        // 0.5 factor applied by the burn status (same guards)
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          if (
            event.parent.category === MoveCategories.Physical &&
            event.parent.source.status[Statuses.Burned] &&
            event.parent.source.hasAbility(Abilities.Guts) &&
            !(event.parent.flags & MoveAttackFlags.Pure) &&
            !(event.parent.flags & MoveAttackFlags.Confused)
          ) {
            event.value *= 2;
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Hustle_(Ability)
  createAbility(
    Abilities.Hustle,
    (battle) =>
      new MergedAbilityLifecycle([
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          if (
            event.stat === Stats.Attack &&
            event.unit === event.parent.source &&
            event.unit.hasAbility(Abilities.Hustle)
          ) {
            event.value *= 1.5;
          }
        }),
        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (
            event.accuracy != null &&
            event.source.hasAbility(Abilities.Hustle) &&
            getMoveData(event.move).category === MoveCategories.Physical
          ) {
            event.accuracy *= 0.8;
          }
        }),
      ]),
  ),

  // Ekans
  // https://bulbapedia.bulbagarden.net/wiki/Intimidate_(Ability)
  createAbility(
    Abilities.Intimidate,
    (battle) =>
      new MergedAbilityLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.Intimidate)) {
            event.source.triggerAbility(Abilities.Intimidate);
          }
        }),
        // The enemy attack drop rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.Intimidate) {
            return;
          }

          const cause = {
            type: EffectType.Ability,
            ability: Abilities.Intimidate,
            unit: event.source,
          } as const;

          for (const unit of battle.units(event.source.team.alliance)) {
            if (unit.alive) {
              unit.addStage(Stages.Attack, -1, cause);
            }
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Unnerve_(Ability)
  createAbility(Abilities.Unnerve, (battle) => {
    /**
     * Unnerve holders currently pressuring each enemy team. The
     * Unnerved team status is kept while at least one holder is up,
     * so consumption checks are a single status lookup.
     */
    const holders = new Map<Team, Set<Unit>>();

    function pressure(source: Unit): void {
      const cause = {
        type: EffectType.Ability,
        ability: Abilities.Unnerve,
        unit: source,
      } as const;

      for (const team of battle.teams(source.team.alliance)) {
        let units = holders.get(team);

        if (!units) {
          units = new Set();
          holders.set(team, units);
        }

        if (units.size === 0) {
          team.addStatus(TeamStatuses.Unnerved, cause);
        }

        units.add(source);
      }

      // For visual cues
      source.triggerAbility(Abilities.Unnerve);
    }

    function release(source: Unit): void {
      for (const [team, units] of holders) {
        if (units.delete(source) && units.size === 0) {
          team.removeStatus(TeamStatuses.Unnerved, {
            type: EffectType.Ability,
            ability: Abilities.Unnerve,
            unit: source,
          });
        }
      }
    }

    return new MergedAbilityLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Unnerve)) {
          pressure(event.source);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        release(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        release(event.source);
      }),
      battle.on(BattleEvents.CheckUnitCanConsumeItem, EventPriority.Post, (event) => {
        if (
          event.success &&
          event.source.team.status[TeamStatuses.Unnerved] != null &&
          getItemData(event.item).type === ItemTypes.Berry
        ) {
          event.success = false;
        }
      }),
    ]);
  }),

  // Pikachu
  // https://bulbapedia.bulbagarden.net/wiki/Static_(Ability)
  createAbility(Abilities.Static, (battle) => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.target.hasAbility(Abilities.Static) &&
        getMoveData(event.cause.move).flags & MoveFlags.Contact &&
        battle.random() < CHANCE
      ) {
        event.target.triggerAbility(Abilities.Static);

        event.cause.unit.addStatus(Statuses.Paralyzed, {
          type: EffectType.Ability,
          ability: Abilities.Static,
          unit: event.target,
        });
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Lightning_Rod_(Ability)
  createAbility(
    Abilities.LightningRod,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: grants the immunity, no side effects
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === Types.Electric &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.LightningRod)
          ) {
            event.immune = true;
          }
        }),
        // The absorb only fires when a real move actually fails
        // against the holder, never on speculative immunity checks
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(Abilities.LightningRod) &&
            parent.source.checkMoveType(parent.move, parent.target) === Types.Electric
          ) {
            parent.target.unit.triggerAbility(Abilities.LightningRod);
          }
        }),
        // The special attack boost rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.LightningRod) {
            event.source.addStage(Stages.SpecialAttack, 1, {
              type: EffectType.Ability,
              ability: Abilities.LightningRod,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // Sandshrew
  // https://bulbapedia.bulbagarden.net/wiki/Sand_Veil_(Ability)
  createAbility(
    Abilities.SandVeil,
    (battle) =>
      new MergedAbilityLifecycle([
        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (
            event.accuracy != null &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.SandVeil) &&
            isWeatherSandstorm(event.target.unit)
          ) {
            event.accuracy *= 0.8;
          }
        }),
        chipImmunity(battle, Abilities.SandVeil, Weathers.Sandstorm),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Sand_Rush_(Ability)
  createAbility(
    Abilities.SandRush,
    (battle) =>
      new MergedAbilityLifecycle([
        battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
          if (
            event.stat === Stats.Speed &&
            event.source.hasAbility(Abilities.SandRush) &&
            isWeatherSandstorm(event.source)
          ) {
            event.value *= 2;
          }
        }),
        chipImmunity(battle, Abilities.SandRush, Weathers.Sandstorm),
      ]),
  ),

  // Nidoran
  // https://bulbapedia.bulbagarden.net/wiki/Poison_Point_(Ability)
  createAbility(Abilities.PoisonPoint, (battle) => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.target.hasAbility(Abilities.PoisonPoint) &&
        getMoveData(event.cause.move).flags & MoveFlags.Contact &&
        battle.random() < CHANCE
      ) {
        event.target.triggerAbility(Abilities.PoisonPoint);

        event.cause.unit.addStatus(Statuses.Poisoned, {
          type: EffectType.Ability,
          ability: Abilities.PoisonPoint,
          unit: event.target,
        });
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Rivalry_(Ability)
  createAbility(Abilities.Rivalry, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const source = event.parent.source;
      const target = event.parent.target;

      if (
        source.hasAbility(Abilities.Rivalry) &&
        source.gender !== Genders.Genderless &&
        target.gender !== Genders.Genderless &&
        !(event.parent.flags & MoveAttackFlags.Pure) &&
        !(event.parent.flags & MoveAttackFlags.Confused)
      ) {
        event.value *= source.gender === target.gender ? 1.25 : 0.75;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Sheer_Force_(Ability)
  createAbility(Abilities.SheerForce, (battle) => {
    const FACTOR = 5325 / 4096;

    return new MergedAbilityLifecycle([
      // Moves with a secondary effect hit harder...
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          event.source.hasAbility(Abilities.SheerForce) &&
          hasAttackEffect(event.move)
        ) {
          event.power *= FACTOR;
        }
      }),
      // ...but lose the effect entirely (vetoed at the check, so the
      // effect chance is never even rolled)
      battle.on(BattleEvents.CheckUnitAttackEffect, EventPriority.Post, (event) => {
        if (event.success && event.parent.source.hasAbility(Abilities.SheerForce)) {
          event.success = false;
        }
      }),
    ]);
  }),

  // Clefairy
  // https://bulbapedia.bulbagarden.net/wiki/Cute_Charm_(Ability)
  createAbility(Abilities.CuteCharm, (battle) => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.target.hasAbility(Abilities.CuteCharm) &&
        getMoveData(event.cause.move).flags & MoveFlags.Contact &&
        battle.random() < CHANCE
      ) {
        event.target.triggerAbility(Abilities.CuteCharm);

        // The gender matchup is enforced by the status immunity
        event.cause.unit.addStatus(Statuses.Infatuated, {
          type: EffectType.Ability,
          ability: Abilities.CuteCharm,
          unit: event.target,
        });
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Magic_Guard_(Ability)
  createAbility(Abilities.MagicGuard, (battle) =>
    battle.on(BattleEvents.UnitDamage, EventPriority.Pre, (event) => {
      // Only direct attack damage can hurt the holder
      if (event.flags & DamageFlags.Indirect && event.target.hasAbility(Abilities.MagicGuard)) {
        event.disabled = true;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Friend_Guard_(Ability)
  createAbility(Abilities.FriendGuard, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const target = event.parent.target;

      for (const unit of target.team.units) {
        if (unit !== target && unit.alive && unit.hasAbility(Abilities.FriendGuard)) {
          event.value *= 0.75;
          return;
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Unaware_(Ability)
  createAbility(Abilities.Unaware, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;

      /**
       * An Unaware defender ignores the attacker's offensive stages;
       * an Unaware attacker ignores the defender's defensive stages.
       * Either way the stat resolves without its stage factor.
       */
      const ignored =
        (event.unit === parent.source && parent.target.hasAbility(Abilities.Unaware)) ||
        (event.unit === parent.target && parent.source.hasAbility(Abilities.Unaware));

      if (ignored) {
        event.value = event.unit.checkStat(event.stat, 0);
      }
    }),
  ),

  // Vulpix
  // https://bulbapedia.bulbagarden.net/wiki/Flash_Fire_(Ability)
  createAbility(Abilities.FlashFire, (battle) => {
    const FACTOR = 1.5;

    /**
     * Holders whose Flash Fire has been activated by absorbing a
     * Fire-type move; the boost lasts until they leave the field.
     */
    const activated = new Set<Unit>();

    return new MergedAbilityLifecycle([
      // Pure query: grants the immunity, no side effects
      battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
        if (
          event.type === Types.Fire &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit !== event.source &&
          event.target.unit.hasAbility(Abilities.FlashFire)
        ) {
          event.immune = true;
        }
      }),
      // The absorb activation only fires when a real move actually
      // fails against the holder, never on speculative immunity checks
      battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
        const parent = event.parent;

        if (
          parent.target.type === MoveTargetType.Unit &&
          parent.target.unit !== parent.source &&
          parent.target.unit.hasAbility(Abilities.FlashFire) &&
          parent.source.checkMoveType(parent.move, parent.target) === Types.Fire
        ) {
          const holder = parent.target.unit;

          if (!activated.has(holder)) {
            holder.triggerAbility(Abilities.FlashFire);
          }
        }
      }),
      // The activation rides the trigger
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === Abilities.FlashFire) {
          activated.add(event.source);
        }
      }),
      // An activated holder's own Fire moves hit harder
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          activated.has(event.source) &&
          event.source.hasAbility(Abilities.FlashFire) &&
          getMoveData(event.move).type === Types.Fire
        ) {
          event.power *= FACTOR;
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        activated.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        activated.delete(event.source);
      }),
    ]);
  }),

  // Jigglypuff
  // https://bulbapedia.bulbagarden.net/wiki/Competitive_(Ability)
  createAbility(
    Abilities.Competitive,
    (battle) =>
      new MergedAbilityLifecycle([
        // Detection: only stat drops inflicted by an enemy raise the
        // holder's ire; its own boost has a positive value, so it
        // never re-triggers
        battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
          const cause = event.cause;

          if (
            event.value < 0 &&
            event.source.hasAbility(Abilities.Competitive) &&
            cause.type !== EffectType.None &&
            cause.unit !== event.source &&
            cause.unit.team.alliance !== event.source.team.alliance
          ) {
            event.source.triggerAbility(Abilities.Competitive);
          }
        }),
        // Effect: the sharp Special Attack boost rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Competitive) {
            event.source.addStage(Stages.SpecialAttack, 2, {
              type: EffectType.Ability,
              ability: Abilities.Competitive,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Frisk_(Ability)
  createAbility(Abilities.Frisk, (battle) =>
    // Reveal is a visual cue: the trigger fires when any opposing
    // unit holds an item as the holder enters the field
    battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
      if (!event.source.hasAbility(Abilities.Frisk)) {
        return;
      }

      for (const unit of battle.units(event.source.team.alliance)) {
        if (unit.alive && holdsAnyItem(unit)) {
          event.source.triggerAbility(Abilities.Frisk);
          return;
        }
      }
    }),
  ),

  // Zubat
  // https://bulbapedia.bulbagarden.net/wiki/Inner_Focus_(Ability)
  createAbility(
    Abilities.InnerFocus,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: cannot flinch
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Flinched &&
            event.source.hasAbility(Abilities.InnerFocus)
          ) {
            event.immune = true;
          }
        }),
        // Unfazed by Intimidate (modern mechanics)
        battle.on(BattleEvents.CheckUnitAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.cause.type === EffectType.Ability &&
            event.cause.ability === Abilities.Intimidate &&
            event.source.hasAbility(Abilities.InnerFocus)
          ) {
            event.success = false;
            event.source.triggerAbility(Abilities.InnerFocus);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Infiltrator_(Ability)
  createAbility(Abilities.Infiltrator, (battle) => {
    // Inverse of the screens' 2732/4096 reduction; like the Guts burn
    // compensation, the bypass undoes the screen's cut on the total
    const SCREEN_COMPENSATION = 4096 / 2732;

    const SCREEN_BY_CATEGORY: { [key in MoveCategories]?: TeamStatuses } = {
      [MoveCategories.Physical]: TeamStatuses.Reflect,
      [MoveCategories.Special]: TeamStatuses.LightScreen,
    };

    return new MergedAbilityLifecycle([
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const screen = SCREEN_BY_CATEGORY[event.parent.category];

        if (
          screen != null &&
          event.parent.source.hasAbility(Abilities.Infiltrator) &&
          event.parent.target.team.status[screen] != null &&
          !(event.parent.flags & MoveAttackFlags.Confused)
        ) {
          event.value *= SCREEN_COMPENSATION;
        }
      }),
      // The holder's attacks pierce damage-absorbing shields (e.g.
      // Substitute); the flag is set before the attack resolves, so
      // the shield's own damage handler simply honors it
      battle.on(BattleEvents.UnitAttack, EventPriority.Pre, (event) => {
        if (event.source.hasAbility(Abilities.Infiltrator)) {
          event.flags |= MoveAttackFlags.Piercing;
        }
      }),
    ]);
  }),

  // Oddish
  // https://bulbapedia.bulbagarden.net/wiki/Stench_(Ability)
  createAbility(Abilities.Stench, (battle) => {
    const CHANCE = 0.1;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.cause.unit.hasAbility(Abilities.Stench) &&
        event.target.alive &&
        battle.random() < CHANCE
      ) {
        const holder = event.cause.unit;

        holder.triggerAbility(Abilities.Stench);

        event.target.addStatus(Statuses.Flinched, {
          type: EffectType.Ability,
          ability: Abilities.Stench,
          unit: holder,
        });
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Effect_Spore_(Ability)
  createAbility(Abilities.EffectSpore, (battle) => {
    // 30% total on contact: 9% poison, 10% paralysis, 11% sleep
    const POISON = 0.09;
    const PARALYSIS = 0.19;
    const SLEEP = 0.3;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.target.hasAbility(Abilities.EffectSpore) &&
        getMoveData(event.cause.move).flags & MoveFlags.Contact &&
        // Grass types are immune to spores (modern mechanics)
        !event.cause.unit.types.has(Types.Grass)
      ) {
        const roll = battle.random();

        let status: Statuses | undefined;
        if (roll < POISON) {
          status = Statuses.Poisoned;
        } else if (roll < PARALYSIS) {
          status = Statuses.Paralyzed;
        } else if (roll < SLEEP) {
          status = Statuses.Sleeping;
        }

        if (status != null) {
          event.target.triggerAbility(Abilities.EffectSpore);

          event.cause.unit.addStatus(status, {
            type: EffectType.Ability,
            ability: Abilities.EffectSpore,
            unit: event.target,
          });
        }
      }
    });
  }),

  // Paras
  // https://bulbapedia.bulbagarden.net/wiki/Dry_Skin_(Ability)
  createAbility(
    Abilities.DrySkin,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: grants the Water immunity
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === Types.Water &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.DrySkin)
          ) {
            event.immune = true;
          }
        }),
        // Absorbing a real Water move heals a quarter of max health
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(Abilities.DrySkin) &&
            parent.source.checkMoveType(parent.move, parent.target) === Types.Water
          ) {
            const holder = parent.target.unit;

            holder.triggerAbility(Abilities.DrySkin);

            holder.heal(
              { type: EffectType.Ability, ability: Abilities.DrySkin, unit: holder },
              holder,
              holder.checkStat(Stats.HP, 0) / 4,
              0,
            );
          }
        }),
        // The dry skin burns: Fire damage hits harder
        battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
          if (
            event.parent.type === Types.Fire &&
            event.parent.target.hasAbility(Abilities.DrySkin) &&
            !(event.parent.flags & MoveAttackFlags.Pure) &&
            !(event.parent.flags & MoveAttackFlags.Confused)
          ) {
            event.value *= 1.25;
          }
        }),
        // Soaks up rain, dries out in the sun (rolled on cast, like
        // Rain Dish and Solar Power)
        battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
          if (!event.source.hasAbility(Abilities.DrySkin)) {
            return;
          }

          const maxHP = event.source.checkStat(Stats.HP, 0);

          if (isWeatherRainy(event.source)) {
            event.source.setHealth(event.source.health + maxHP / 8);
            event.source.triggerAbility(Abilities.DrySkin);
          } else if (isWeatherSunny(event.source)) {
            event.source.damage(
              { type: EffectType.Ability, ability: Abilities.DrySkin, unit: event.source },
              event.source,
              maxHP / 8,
              DamageFlags.NonLethal | DamageFlags.Indirect,
            );
            event.source.triggerAbility(Abilities.DrySkin);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Damp_(Ability)
  // TODO Aftermath suppression once Aftermath is implemented
  createAbility(Abilities.Damp, (battle) => {
    /**
     * Holders currently on the field (the Unnerve/Cloud Nine
     * pattern): cast checks reduce to a single size lookup instead
     * of scanning every unit each time
     */
    const holders = new Set<Unit>();

    return new MergedAbilityLifecycle([
      // Nobody on the field can blow itself up while a holder is up
      battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
        if (event.success && holders.size > 0 && SELF_DESTRUCT_MOVES.has(event.move)) {
          event.success = false;

          // For visual cues: every holder on the field reacts
          for (const holder of holders) {
            holder.triggerAbility(Abilities.Damp);
          }
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Damp)) {
          holders.add(event.source);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        holders.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        holders.delete(event.source);
      }),
      // Losing the ability mid-battle also lifts the suppression
      battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
        if (event.ability === Abilities.Damp) {
          holders.delete(event.source);
        }
      }),
    ]);
  }),

  // Venonat (Venomoth)
  // https://bulbapedia.bulbagarden.net/wiki/Wonder_Skin_(Ability)
  createAbility(Abilities.WonderSkin, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
      if (
        event.accuracy != null &&
        event.accuracy > 50 &&
        getMoveData(event.move).category === MoveCategories.Status &&
        event.target.type === MoveTargetType.Unit &&
        event.target.unit !== event.source &&
        event.target.unit.hasAbility(Abilities.WonderSkin)
      ) {
        event.accuracy = 50;
      }
    }),
  ),

  // Diglett
  // https://bulbapedia.bulbagarden.net/wiki/Arena_Trap_(Ability)
  createAbility(Abilities.ArenaTrap, (battle) =>
    battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        // Airborne and Ghost-type units cannot be trapped, and Run
        // Away escapes regardless: the explicit check (instead of a
        // Post override) keeps the trap cue from firing spuriously
        !source.checkGrounded() ||
        source.types.has(Types.Ghost) ||
        source.hasAbility(Abilities.RunAway)
      ) {
        return;
      }

      for (const unit of battle.units(source.team.alliance)) {
        if (unit.alive && unit.hasAbility(Abilities.ArenaTrap)) {
          event.success = false;

          // For visual cues: every holder reacts, not just the first
          unit.triggerAbility(Abilities.ArenaTrap);
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Sand_Force_(Ability)
  createAbility(Abilities.SandForce, (battle) => {
    const BOOSTED = new Set<Types>([Types.Ground, Types.Rock, Types.Steel]);
    const FACTOR = 1.3;

    return new MergedAbilityLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          event.source.hasAbility(Abilities.SandForce) &&
          isWeatherSandstorm(event.source) &&
          BOOSTED.has(getMoveData(event.move).type)
        ) {
          event.power *= FACTOR;
        }
      }),
      chipImmunity(battle, Abilities.SandForce, Weathers.Sandstorm),
    ]);
  }),

  // Meowth
  // https://bulbapedia.bulbagarden.net/wiki/Pickup_(Ability)
  createAbility(Abilities.Pickup, (battle) =>
    // In-battle behavior: when another unit consumes its item, a
    // holder with a free item slot scavenges it
    battle.on(BattleEvents.UnitTriggerItem, EventPriority.Post, (event) => {
      for (const unit of battle.units()) {
        if (
          unit !== event.source &&
          unit.alive &&
          unit.hasAbility(Abilities.Pickup) &&
          countHeldItems(unit) < battle.limits.items
        ) {
          unit.addItem(event.item);

          // Cue only when the pickup actually landed (the add can
          // still be vetoed, e.g. by the item limit)
          if (unit.items[event.item] === true) {
            unit.triggerAbility(Abilities.Pickup);
            return;
          }
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Technician_(Ability)
  createAbility(Abilities.Technician, (battle) => {
    const THRESHOLD = 60;
    const FACTOR = 1.5;

    return battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.power <= THRESHOLD &&
        event.source.hasAbility(Abilities.Technician)
      ) {
        event.power *= FACTOR;
      }
    });
  }),

  // Persian
  // https://bulbapedia.bulbagarden.net/wiki/Limber_(Ability)
  createAbility(
    Abilities.Limber,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: cannot be paralyzed
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Paralyzed &&
            event.source.hasAbility(Abilities.Limber)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (event.status === Statuses.Paralyzed && event.source.hasAbility(Abilities.Limber)) {
            event.source.triggerAbility(Abilities.Limber);
          }
        }),
      ]),
  ),

  // Psyduck
  // https://bulbapedia.bulbagarden.net/wiki/Cloud_Nine_(Ability)
  createAbility(Abilities.CloudNine, (battle) => {
    /**
     * Holders currently on the field (the Unnerve pattern): weather
     * checks reduce to a single size lookup instead of scanning
     * every unit each time
     */
    const holders = new Set<Unit>();

    return new MergedAbilityLifecycle([
      // Weather effects are suppressed while any holder is up
      battle.on(BattleEvents.CheckUnitWeather, EventPriority.Post, (event) => {
        if (holders.size > 0) {
          event.weather = Weathers.None;
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.CloudNine)) {
          holders.add(event.source);

          // Announce on entry
          event.source.triggerAbility(Abilities.CloudNine);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        holders.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        holders.delete(event.source);
      }),
      // Losing the ability mid-battle also lifts the suppression
      battle.on(BattleEvents.UnitRemoveAbility, EventPriority.Post, (event) => {
        if (event.ability === Abilities.CloudNine) {
          holders.delete(event.source);
        }
      }),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Swift_Swim_(Ability)
  createAbility(Abilities.SwiftSwim, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        isWeatherRainy(event.source) &&
        event.stat === Stats.Speed &&
        event.source.hasAbility(Abilities.SwiftSwim)
      ) {
        event.value *= 2;
      }
    }),
  ),

  // Mankey
  // https://bulbapedia.bulbagarden.net/wiki/Vital_Spirit_(Ability)
  createAbility(
    Abilities.VitalSpirit,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: cannot fall asleep
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Sleeping &&
            event.source.hasAbility(Abilities.VitalSpirit)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (
            event.status === Statuses.Sleeping &&
            event.source.hasAbility(Abilities.VitalSpirit)
          ) {
            event.source.triggerAbility(Abilities.VitalSpirit);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Anger_Point_(Ability)
  createAbility(
    Abilities.AngerPoint,
    (battle) =>
      new MergedAbilityLifecycle([
        // Detection: a real critical hit on the holder triggers it
        battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.critical &&
            parent.target.hasAbility(Abilities.AngerPoint) &&
            parent.target !== parent.source &&
            !(parent.flags & MoveAttackFlags.Simulated)
          ) {
            parent.target.triggerAbility(Abilities.AngerPoint);
          }
        }),
        // Effect: maximal rage; the stage clamp caps this at +6
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.AngerPoint) {
            event.source.addStage(Stages.Attack, 12, {
              type: EffectType.Ability,
              ability: Abilities.AngerPoint,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Defiant_(Ability)
  createAbility(
    Abilities.Defiant,
    (battle) =>
      new MergedAbilityLifecycle([
        // Detection: only stat drops inflicted by an enemy trigger
        // the defiance; its own boost has a positive value, so it
        // never re-triggers
        battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
          const cause = event.cause;

          if (
            event.value < 0 &&
            event.source.hasAbility(Abilities.Defiant) &&
            cause.type !== EffectType.None &&
            cause.unit !== event.source &&
            cause.unit.team.alliance !== event.source.team.alliance
          ) {
            event.source.triggerAbility(Abilities.Defiant);
          }
        }),
        // Effect: the sharp Attack boost rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Defiant) {
            event.source.addStage(Stages.Attack, 2, {
              type: EffectType.Ability,
              ability: Abilities.Defiant,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // Growlithe
  // https://bulbapedia.bulbagarden.net/wiki/Justified_(Ability)
  createAbility(
    Abilities.Justified,
    (battle) =>
      new MergedAbilityLifecycle([
        // Detection: direct damage from a Dark-type move
        battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
          if (
            event.success &&
            !(event.flags & DamageFlags.Indirect) &&
            event.cause.type === EffectType.Move &&
            event.cause.unit !== event.target &&
            event.target.hasAbility(Abilities.Justified) &&
            getMoveData(event.cause.move).type === Types.Dark
          ) {
            event.target.triggerAbility(Abilities.Justified);
          }
        }),
        // Effect: the Attack boost rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Justified) {
            event.source.addStage(Stages.Attack, 1, {
              type: EffectType.Ability,
              ability: Abilities.Justified,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // Poliwag
  // https://bulbapedia.bulbagarden.net/wiki/Water_Absorb_(Ability)
  createAbility(
    Abilities.WaterAbsorb,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: grants the Water immunity
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.type === Types.Water &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.WaterAbsorb)
          ) {
            event.immune = true;
          }
        }),
        // Detection: a real Water move fails against the holder
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(Abilities.WaterAbsorb) &&
            parent.source.checkMoveType(parent.move, parent.target) === Types.Water
          ) {
            parent.target.unit.triggerAbility(Abilities.WaterAbsorb);
          }
        }),
        // Effect: the quarter-max-health heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.WaterAbsorb) {
            event.source.heal(
              {
                type: EffectType.Ability,
                ability: Abilities.WaterAbsorb,
                unit: event.source,
              },
              event.source,
              event.source.checkStat(Stats.HP, 0) / 4,
              0,
            );
          }
        }),
      ]),
  ),

  // Abra
  // https://bulbapedia.bulbagarden.net/wiki/Synchronize_(Ability)
  createAbility(Abilities.Synchronize, (battle) => {
    const SYNC_STATUS = new Set<Statuses>([
      Statuses.Poisoned,
      Statuses.BadlyPoisoned,
      Statuses.Burned,
      Statuses.Paralyzed,
    ]);

    // The effect targets the inflicting unit, which the trigger event
    // cannot carry, so it stays inline. Two Synchronize holders never
    // ping-pong: the reflected status is non-refreshable on re-add
    return battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      const cause = event.cause;

      if (
        SYNC_STATUS.has(event.status) &&
        event.source.hasAbility(Abilities.Synchronize) &&
        cause.type !== EffectType.None &&
        cause.unit !== event.source
      ) {
        event.source.triggerAbility(Abilities.Synchronize);

        cause.unit.addStatus(event.status, {
          type: EffectType.Ability,
          ability: Abilities.Synchronize,
          unit: event.source,
        });
      }
    });
  }),

  // Machop
  // https://bulbapedia.bulbagarden.net/wiki/No_Guard_(Ability)
  createAbility(
    Abilities.NoGuard,
    (battle) =>
      new MergedAbilityLifecycle([
        // Moves used by or against the holder skip the accuracy check
        battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
          if (
            event.source.hasAbility(Abilities.NoGuard) ||
            (event.target.type === MoveTargetType.Unit &&
              event.target.unit.hasAbility(Abilities.NoGuard))
          ) {
            event.accuracy = undefined;
          }
        }),
        // ...and reach even semi-invulnerable targets (the roll only
        // resolves false here when something forced the miss)
        battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            !event.hit &&
            (parent.source.hasAbility(Abilities.NoGuard) ||
              (parent.target.type === MoveTargetType.Unit &&
                parent.target.unit.hasAbility(Abilities.NoGuard)))
          ) {
            event.hit = true;
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Steadfast_(Ability)
  createAbility(
    Abilities.Steadfast,
    (battle) =>
      new MergedAbilityLifecycle([
        // Detection: the holder flinches
        battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
          if (event.status === Statuses.Flinched && event.source.hasAbility(Abilities.Steadfast)) {
            event.source.triggerAbility(Abilities.Steadfast);
          }
        }),
        // Effect: the Speed boost rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Steadfast) {
            event.source.addStage(Stages.Speed, 1, {
              type: EffectType.Ability,
              ability: Abilities.Steadfast,
              unit: event.source,
            });
          }
        }),
      ]),
  ),

  // Bellsprout
  // https://bulbapedia.bulbagarden.net/wiki/Gluttony_(Ability)
  createAbility(Abilities.Gluttony, (battle) =>
    // The holder eats pinch items early: doubled threshold
    battle.on(BattleEvents.CheckUnitItemThreshold, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.Gluttony)) {
        event.threshold = Math.min(1, event.threshold * 2);
      }
    }),
  ),

  // Tentacool
  // https://bulbapedia.bulbagarden.net/wiki/Clear_Body_(Ability)
  createAbility(Abilities.ClearBody, (battle) =>
    // Mutates the in-flight check event, so the effect stays inline
    battle.on(BattleEvents.CheckUnitAddStage, EventPriority.Post, (event) => {
      if (
        event.success &&
        event.value < 0 &&
        event.source.hasAbility(Abilities.ClearBody) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.success = false;

        // For visual cues
        event.source.triggerAbility(Abilities.ClearBody);
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Liquid_Ooze_(Ability)
  createAbility(Abilities.LiquidOoze, (battle) =>
    // Drains from the holder backfire; only fired on real drains,
    // so the cue is safe here
    battle.on(BattleEvents.CheckUnitDrain, EventPriority.Post, (event) => {
      if (event.value > 0 && event.target.hasAbility(Abilities.LiquidOoze)) {
        event.value = -event.value;

        // For visual cues
        event.target.triggerAbility(Abilities.LiquidOoze);
      }
    }),
  ),

  // Geodude
  // https://bulbapedia.bulbagarden.net/wiki/Rock_Head_(Ability)
  createAbility(Abilities.RockHead, (battle) =>
    // Mutates the in-flight recoil check, so the effect stays inline
    battle.on(BattleEvents.CheckUnitRecoil, EventPriority.Post, (event) => {
      if (event.recoil && event.parent.source.hasAbility(Abilities.RockHead)) {
        event.recoil = false;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Sturdy_(Ability)
  createAbility(
    Abilities.Sturdy,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: one-hit KO moves cannot touch the holder
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            OHKO_MOVES.has(event.move) &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.Sturdy)
          ) {
            event.immune = true;
          }
        }),
        // Endures any single blow from full health with 1 HP left
        battle.on(BattleEvents.UnitDamage, EventPriority.Pre, (event) => {
          if (
            event.target.alive &&
            !(event.flags & DamageFlags.Indirect) &&
            event.value >= event.target.health &&
            event.target.hasAbility(Abilities.Sturdy) &&
            event.target.health >= event.target.checkStat(Stats.HP, 0)
          ) {
            event.value = event.target.health - 1;

            // For visual cues
            event.target.triggerAbility(Abilities.Sturdy);
          }
        }),
      ]),
  ),

  // Ponyta
  // https://bulbapedia.bulbagarden.net/wiki/Flame_Body_(Ability)
  createAbility(Abilities.FlameBody, (battle) => {
    const CHANCE = 0.3;

    // The effect targets the attacker, which the trigger event
    // cannot carry, so it stays inline
    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.target.hasAbility(Abilities.FlameBody) &&
        getMoveData(event.cause.move).flags & MoveFlags.Contact &&
        battle.random() < CHANCE
      ) {
        event.target.triggerAbility(Abilities.FlameBody);

        event.cause.unit.addStatus(Statuses.Burned, {
          type: EffectType.Ability,
          ability: Abilities.FlameBody,
          unit: event.target,
        });
      }
    });
  }),

  // Slowpoke
  // https://bulbapedia.bulbagarden.net/wiki/Oblivious_(Ability)
  createAbility(
    Abilities.Oblivious,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: cannot be infatuated
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Infatuated &&
            event.source.hasAbility(Abilities.Oblivious)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (
            event.status === Statuses.Infatuated &&
            event.source.hasAbility(Abilities.Oblivious)
          ) {
            event.source.triggerAbility(Abilities.Oblivious);
          }
        }),
        // Unfazed by Intimidate (modern mechanics)
        battle.on(BattleEvents.CheckUnitAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.cause.type === EffectType.Ability &&
            event.cause.ability === Abilities.Intimidate &&
            event.source.hasAbility(Abilities.Oblivious)
          ) {
            event.success = false;
            event.source.triggerAbility(Abilities.Oblivious);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Own_Tempo_(Ability)
  createAbility(
    Abilities.OwnTempo,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: cannot be confused
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Confused &&
            event.source.hasAbility(Abilities.OwnTempo)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (event.status === Statuses.Confused && event.source.hasAbility(Abilities.OwnTempo)) {
            event.source.triggerAbility(Abilities.OwnTempo);
          }
        }),
        // Unfazed by Intimidate (modern mechanics)
        battle.on(BattleEvents.CheckUnitAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.cause.type === EffectType.Ability &&
            event.cause.ability === Abilities.Intimidate &&
            event.source.hasAbility(Abilities.OwnTempo)
          ) {
            event.success = false;
            event.source.triggerAbility(Abilities.OwnTempo);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Regenerator_(Ability)
  createAbility(
    Abilities.Regenerator,
    (battle) =>
      new MergedAbilityLifecycle([
        // Detection: the holder withdraws from the field alive
        battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
          if (event.source.alive && event.source.hasAbility(Abilities.Regenerator)) {
            event.source.triggerAbility(Abilities.Regenerator);
          }
        }),
        // Effect: the third-of-max-health heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.Regenerator) {
            event.source.heal(
              {
                type: EffectType.Ability,
                ability: Abilities.Regenerator,
                unit: event.source,
              },
              event.source,
              event.source.checkStat(Stats.HP, 0) / 3,
              0,
            );
          }
        }),
      ]),
  ),

  // Magnemite
  // https://bulbapedia.bulbagarden.net/wiki/Magnet_Pull_(Ability)
  createAbility(Abilities.MagnetPull, (battle) =>
    battle.on(BattleEvents.CheckUnitEscape, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        // Only Steel types stick to the magnet; Ghost types and Run
        // Away escape regardless (the explicit check keeps the cue
        // from firing spuriously)
        !source.types.has(Types.Steel) ||
        source.types.has(Types.Ghost) ||
        source.hasAbility(Abilities.RunAway)
      ) {
        return;
      }

      for (const unit of battle.units(source.team.alliance)) {
        if (unit.alive && unit.hasAbility(Abilities.MagnetPull)) {
          event.success = false;

          // For visual cues: every holder reacts, not just the first
          unit.triggerAbility(Abilities.MagnetPull);
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Analytic_(Ability)
  createAbility(Abilities.Analytic, (battle) => {
    const FACTOR = 1.3;

    // Real-time analog of "moves last": the boost applies while the
    // target is already committed to its own move
    return battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      if (
        event.power != null &&
        event.source.hasAbility(Abilities.Analytic) &&
        event.target.type === MoveTargetType.Unit &&
        (event.target.unit.casting != null || event.target.unit.channeling != null)
      ) {
        event.power *= FACTOR;
      }
    });
  }),

  // Doduo
  // https://bulbapedia.bulbagarden.net/wiki/Early_Bird_(Ability)
  createAbility(Abilities.EarlyBird, (battle) =>
    // Mutates the in-flight duration check, so the effect stays inline
    battle.on(BattleEvents.CheckUnitStatusDuration, EventPriority.Post, (event) => {
      if (event.status === Statuses.Sleeping && event.source.hasAbility(Abilities.EarlyBird)) {
        event.duration /= 2;
      }
    }),
  ),

  // Seel
  // https://bulbapedia.bulbagarden.net/wiki/Hydration_(Ability)
  createAbility(
    Abilities.Hydration,
    (battle) =>
      new MergedAbilityLifecycle([
        // Pure query: no major status conditions in the rain
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            MAJOR_STATUS_CONDITIONS.has(event.status) &&
            isWeatherRainy(event.source) &&
            event.source.hasAbility(Abilities.Hydration)
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real application was blocked
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (
            MAJOR_STATUS_CONDITIONS.has(event.status) &&
            isWeatherRainy(event.source) &&
            event.source.hasAbility(Abilities.Hydration)
          ) {
            event.source.triggerAbility(Abilities.Hydration);
          }
        }),
      ]),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Ice_Body_(Ability)
  createAbility(
    Abilities.IceBody,
    (battle) =>
      new MergedAbilityLifecycle([
        // No turn mechanics, we detect on move cast instead
        battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
          if (isWeatherHail(event.source) && event.source.hasAbility(Abilities.IceBody)) {
            event.source.triggerAbility(Abilities.IceBody);
          }
        }),
        // The heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.IceBody) {
            const maxHP = event.source.checkStat(Stats.HP, 0) / 16;
            event.source.setHealth(event.source.health + maxHP);
          }
        }),
        chipImmunity(battle, Abilities.IceBody, Weathers.Hail),
      ]),
  ),

  // Grimer
  // https://bulbapedia.bulbagarden.net/wiki/Sticky_Hold_(Ability)
  createAbility(Abilities.StickyHold, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Pre, (event) => {
      // Only the holder itself (e.g. eating its berry) may remove its
      // item; removal forced by another unit is blocked
      if (
        'unit' in event.cause &&
        event.cause.unit !== event.source &&
        event.source.hasAbility(Abilities.StickyHold)
      ) {
        event.disabled = true;

        event.source.triggerAbility(Abilities.StickyHold);
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Poison_Touch_(Ability)
  createAbility(Abilities.PoisonTouch, (battle) => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
      if (
        event.success &&
        !(event.flags & DamageFlags.Indirect) &&
        event.cause.type === EffectType.Move &&
        event.cause.unit !== event.target &&
        event.cause.unit.hasAbility(Abilities.PoisonTouch) &&
        getMoveData(event.cause.move).flags & MoveFlags.Contact &&
        battle.random() < CHANCE
      ) {
        const attacker = event.cause.unit;

        attacker.triggerAbility(Abilities.PoisonTouch);

        event.target.addStatus(Statuses.Poisoned, {
          type: EffectType.Ability,
          ability: Abilities.PoisonTouch,
          unit: attacker,
        });
      }
    });
  }),

  // Shellder
  // https://bulbapedia.bulbagarden.net/wiki/Shell_Armor_(Ability)
  createAbility(Abilities.ShellArmor, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Post, (event) => {
      if (event.critical && event.parent.target.hasAbility(Abilities.ShellArmor)) {
        event.critical = false;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Skill_Link_(Ability)
  createAbility(Abilities.SkillLink, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveHits, EventPriority.Post, (event) => {
      if (event.source.hasAbility(Abilities.SkillLink)) {
        event.hits = event.max;
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Overcoat_(Ability)
  createAbility(
    Abilities.Overcoat,
    (battle) =>
      new MergedAbilityLifecycle([
        chipImmunity(battle, Abilities.Overcoat, Weathers.Sandstorm),
        chipImmunity(battle, Abilities.Overcoat, Weathers.Hail),
        // Pure query: powder- and spore-based moves cannot land
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit.hasAbility(Abilities.Overcoat) &&
            getMoveData(event.move).flags & MoveFlags.Powder
          ) {
            event.immune = true;
          }
        }),
        // The cue only fires when a real use was blocked
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const target = event.parent.target;

          if (
            target.type === MoveTargetType.Unit &&
            target.unit.hasAbility(Abilities.Overcoat) &&
            getMoveData(event.parent.move).flags & MoveFlags.Powder
          ) {
            target.unit.triggerAbility(Abilities.Overcoat);
          }
        }),
      ]),
  ),

  // Gastly
  // https://bulbapedia.bulbagarden.net/wiki/Levitate_(Ability)
  createAbility(
    Abilities.Levitate,
    (battle) =>
      new MergedAbilityLifecycle([
        // Airborne unless something (e.g. Gravity) forces grounding;
        // the shared immunity rule then blocks Ground moves
        battle.on(BattleEvents.CheckUnitGrounded, EventPriority.Post, (event) => {
          if (
            event.grounded &&
            event.source.status[Statuses.Grounded] == null &&
            event.source.hasAbility(Abilities.Levitate)
          ) {
            event.grounded = false;
          }
        }),
        // The cue only fires when a real Ground move was avoided
        battle.on(BattleEvents.UnitTriggerMoveFailed, EventPriority.Post, (event) => {
          const target = event.parent.target;

          if (
            target.type === MoveTargetType.Unit &&
            target.unit.hasAbility(Abilities.Levitate) &&
            !target.unit.checkGrounded() &&
            event.parent.source.checkMoveType(event.parent.move, target) === Types.Ground
          ) {
            target.unit.triggerAbility(Abilities.Levitate);
          }
        }),
      ]),
  ),

  // Onix
  // https://bulbapedia.bulbagarden.net/wiki/Weak_Armor_(Ability)
  createAbility(
    Abilities.WeakArmor,
    (battle) =>
      new MergedAbilityLifecycle([
        // Detection: direct damage from a physical move
        battle.on(BattleEvents.UnitDamage, EventPriority.Post, (event) => {
          if (
            event.success &&
            !(event.flags & DamageFlags.Indirect) &&
            event.cause.type === EffectType.Move &&
            event.cause.unit !== event.target &&
            event.target.hasAbility(Abilities.WeakArmor) &&
            getMoveData(event.cause.move).category === MoveCategories.Physical
          ) {
            event.target.triggerAbility(Abilities.WeakArmor);
          }
        }),
        // Effect: the armor cracks — Defense drops, Speed surges
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.WeakArmor) {
            const cause = {
              type: EffectType.Ability,
              ability: Abilities.WeakArmor,
              unit: event.source,
            } as const;

            event.source.addStage(Stages.Defense, -1, cause);
            event.source.addStage(Stages.Speed, 2, cause);
          }
        }),
      ]),
  ),
];

export default function setupGen1Abilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
