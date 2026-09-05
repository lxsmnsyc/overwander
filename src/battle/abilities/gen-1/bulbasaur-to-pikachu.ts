import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { ItemTypes } from '../../../data/ids/items';
import { DamageFlags, MoveAttackFlags, MoveCategories, MoveFlags } from '../../../data/ids/moves';
import { Statuses, TeamStatuses, Weathers } from '../../../data/ids/status';
import { getItemData } from '../../../data/items';
import { getMoveData } from '../../../data/moves';
import { BattleEvents, EffectType, MoveTargetType, type UnitAttackEvent } from '../../events';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Team from '../../team';
import type Unit from '../../unit';
import { hasAnyStatus, isWeatherRainy, isWeatherSunny, onUnitActs, unitTarget } from '../../utils';
import {
  createAbility,
  createBlazeAbility,
  createContactHazard,
  createDrizzleAbility,
  createKeenEyeAbility,
  createStageFeedScoring,
  createToughClawsAbility,
} from '../__create';
import { MergedLifecycle } from '../../lifecycle';

/**
 * What the first stretch of the dex is born with, Bulbasaur to
 * Pikachu
 */
const bulbasaurToPikachu = [
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
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
          if (
            isWeatherSunny(event.source) &&
            event.stat === Stats.SpecialAttack &&
            event.source.hasAbility(Abilities.SolarPower)
          ) {
            event.value *= 2;
          }
        }),
        // No turns to hang a residual on: it is paid as the holder
        // reaches for a move. The chip damage rides the trigger
        ...onUnitActs(battle, (unit) => {
          if (isWeatherSunny(unit) && unit.hasAbility(Abilities.SolarPower)) {
            unit.triggerAbility(Abilities.SolarPower);
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
  createToughClawsAbility(Abilities.ToughClaws, MoveFlags.Contact, 5325 / 4096),

  // https://bulbapedia.bulbagarden.net/wiki/Drought_(Ability)
  createDrizzleAbility(Abilities.Drought, Weathers.Sunny),

  // Squirtle
  createBlazeAbility(Abilities.Torrent, Types.Water),

  // https://bulbapedia.bulbagarden.net/wiki/Rain_Dish_(Ability)
  createAbility(
    Abilities.RainDish,
    (battle) =>
      new MergedLifecycle([
        // No turn mechanics: it is paid as the holder reaches for a
        // move
        ...onUnitActs(battle, (unit) => {
          if (isWeatherRainy(unit) && unit.hasAbility(Abilities.RainDish)) {
            unit.triggerAbility(Abilities.RainDish);
          }
        }),
        // The heal rides the trigger
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.RainDish) {
            const maxHP = event.source.checkStat(Stats.HP, 0) / 16;

            // Through the heal, so anything that refuses one refuses
            // this one
            event.source.heal(
              { type: EffectType.Ability, ability: Abilities.RainDish, unit: event.source },
              event.source,
              maxHP,
              0,
            );
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
      new MergedLifecycle([
        // No turn mechanics: the 30% cure is rolled as the holder
        // reaches for a move
        ...onUnitActs(battle, (unit) => {
          if (
            unit.hasAbility(Abilities.ShedSkin) &&
            hasAnyStatus(unit, MAJOR_STATUS_CONDITIONS) &&
            battle.random() < 0.3
          ) {
            unit.triggerAbility(Abilities.ShedSkin);
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

    return new MergedLifecycle([
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
  createKeenEyeAbility(Abilities.KeenEye),

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
    battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
      if (
        event.success &&
        event.stage === Stages.Defense &&
        event.value < 0 &&
        event.source.hasAbility(Abilities.BigPecks) &&
        event.cause.type !== EffectType.None &&
        event.cause.unit !== event.source
      ) {
        event.success = false;

        // A cue is something a watcher sees, so it waits for a real
        // attempt rather than the AI weighing one
        if (!event.simulated) {
          event.source.triggerAbility(Abilities.BigPecks);
        }
      }
    }),
  ),

  // https://bulbapedia.bulbagarden.net/wiki/Gale_Wings_(Ability)
  createAbility(Abilities.GaleWings, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePriority, EventPriority.Post, (event) => {
      if (
        event.source.hasAbility(Abilities.GaleWings) &&
        event.source.health >= event.source.checkStat(Stats.HP, 0) &&
        event.source.checkMoveType(event.move, event.target) === Types.Flying
      ) {
        event.priority += 1;
      }
    }),
  ),

  // Rattata
  // https://bulbapedia.bulbagarden.net/wiki/Guts_(Ability)
  createAbility(
    Abilities.Guts,
    (battle) =>
      new MergedLifecycle([
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
      new MergedLifecycle([
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
      new MergedLifecycle([
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

    return new MergedLifecycle([
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

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          event.cause.type === EffectType.Move &&
          event.cause.unit !== event.target &&
          event.target.hasAbility(Abilities.Static) &&
          event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target)) &&
          battle.random() < CHANCE
        ) {
          event.target.triggerAbility(Abilities.Static);

          event.cause.unit.addStatus(Statuses.Paralyzed, {
            type: EffectType.Ability,
            ability: Abilities.Static,
            unit: event.target,
          });
        }
      }),
      // Touching it costs something, so the AI is told before it
      // decides to
      createContactHazard(battle, Abilities.Static),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Lightning_Rod_(Ability)
  createAbility(
    Abilities.LightningRod,
    (battle) =>
      new MergedLifecycle([
        // Single-target Electric moves are drawn to a rod on the
        // defending side
        battle.on(BattleEvents.UnitTriggerMoveTarget, AttackPriority.Pre, (event) => {
          if (
            event.target.type !== MoveTargetType.Unit ||
            event.target.unit.hasAbility(Abilities.LightningRod) ||
            event.source.checkMoveType(event.move, event.target) !== Types.Electric
          ) {
            return;
          }

          const alliance = event.target.unit.team.alliance;

          for (const unit of battle.units()) {
            if (
              unit.alive &&
              unit !== event.source &&
              unit.team.alliance === alliance &&
              unit.hasAbility(Abilities.LightningRod)
            ) {
              event.target = { type: MoveTargetType.Unit, unit };
              return;
            }
          }
        }),
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
        createStageFeedScoring(
          battle,
          Abilities.LightningRod,
          Types.Electric,
          Stages.SpecialAttack,
        ),
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
];

export default bulbasaurToPikachu;
