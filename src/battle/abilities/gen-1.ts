import { EventPriority } from '../../core/event-emitter';
import { Stages, Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Abilities } from '../../data/ids/abilities';
import { ItemTypes } from '../../data/ids/items';
import {
  DamageFlags,
  MoveAttackFlags,
  MoveCategories,
  MoveFlags,
} from '../../data/ids/moves';
import { Genders } from '../../data/ids/species';
import { Statuses, TeamStatuses } from '../../data/ids/status';
import { getItemData } from '../../data/items';
import { getMoveData } from '../../data/moves';
import type { Battle } from '../core';
import {
  BattleEvents,
  EffectType,
  MoveTargetType,
  type UnitAttackEvent,
} from '../events';
import { hasAttackEffect } from '../moves/status';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type { Team } from '../team';
import type { Unit } from '../unit';
import { isWeatherRainy, isWeatherSandstorm, isWeatherSunny } from '../utils';
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
        isWeatherSunny(event.source) &&
        event.stat === Stats.Speed &&
        event.source.hasAbility(Abilities.Chlorophyll)
      ) {
        event.value *= 2;
      }
    });
  }),

  // Bulbasaur (Mega Venusaur)
  // https://bulbapedia.bulbagarden.net/wiki/Thick_Fat_(Ability)
  createAbility(Abilities.ThickFat, battle => {
    return battle.on(
      BattleEvents.UnitAttackResolveStat,
      EventPriority.Post,
      event => {
        const type = event.parent.type;
        if (
          (type === Types.Fire || type === Types.Ice) &&
          event.unit === event.parent.source &&
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
    // No turn mechanics, we roll the 30% cure on move cast instead.
    return battle.on(BattleEvents.UnitCast, EventPriority.Post, event => {
      if (
        event.source.hasAbility(Abilities.ShedSkin) &&
        MAJOR_STATUS_CONDITIONS.some(status => event.source.status[status]) &&
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

  // Weedle/Beedrill
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

  // Rattata
  // https://bulbapedia.bulbagarden.net/wiki/Guts_(Ability)
  createAbility(Abilities.Guts, battle => {
    return new MergedAbilityLifecycle([
      battle.on(
        BattleEvents.UnitAttackResolveStat,
        EventPriority.Post,
        event => {
          if (
            event.stat === Stats.Attack &&
            event.unit === event.parent.source &&
            event.unit.hasAbility(Abilities.Guts) &&
            MAJOR_STATUS_CONDITIONS.some(status => event.unit.status[status])
          ) {
            event.value *= 1.5;
          }
        },
      ),
      // Guts ignores the burn physical-damage halving; compensate the
      // 0.5 factor applied by the burn status (same guards)
      battle.on(
        BattleEvents.UnitAttackResolveDamage,
        EventPriority.Post,
        event => {
          if (
            event.parent.category === MoveCategories.Physical &&
            event.parent.source.status[Statuses.Burned] &&
            event.parent.source.hasAbility(Abilities.Guts) &&
            !(event.parent.flags & MoveAttackFlags.Pure) &&
            !(event.parent.flags & MoveAttackFlags.Confused)
          ) {
            event.value *= 2;
          }
        },
      ),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Hustle_(Ability)
  createAbility(Abilities.Hustle, battle => {
    return new MergedAbilityLifecycle([
      battle.on(
        BattleEvents.UnitAttackResolveStat,
        EventPriority.Post,
        event => {
          if (
            event.stat === Stats.Attack &&
            event.unit === event.parent.source &&
            event.unit.hasAbility(Abilities.Hustle)
          ) {
            event.value *= 1.5;
          }
        },
      ),
      battle.on(
        BattleEvents.CheckUnitMoveAccuracy,
        EventPriority.Post,
        event => {
          if (
            event.accuracy != null &&
            event.source.hasAbility(Abilities.Hustle) &&
            getMoveData(event.move).category === MoveCategories.Physical
          ) {
            event.accuracy *= 0.8;
          }
        },
      ),
    ]);
  }),

  // Ekans
  // https://bulbapedia.bulbagarden.net/wiki/Intimidate_(Ability)
  createAbility(Abilities.Intimidate, battle => {
    return battle.on(
      BattleEvents.UnitEntersField,
      EventPriority.Post,
      event => {
        if (!event.source.hasAbility(Abilities.Intimidate)) {
          return;
        }

        const cause = {
          type: EffectType.Ability,
          ability: Abilities.Intimidate,
          unit: event.source,
        } as const;

        const ownAlliance = event.source.team.alliance;

        for (const alliance of battle.alliances) {
          if (alliance !== ownAlliance) {
            for (const team of alliance.teams) {
              for (const unit of team.units) {
                if (unit.alive) {
                  unit.addStage(Stages.Attack, -1, cause);
                }
              }
            }
          }
        }

        // For visual cues
        event.source.triggerAbility(Abilities.Intimidate);
      },
    );
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Unnerve_(Ability)
  createAbility(Abilities.Unnerve, battle => {
    /**
     * Unnerve holders currently pressuring each enemy team. The
     * Unnerved team status is kept while at least one holder is up,
     * so consumption checks are a single status lookup.
     */
    const holders = new Map<Team, Set<Unit>>();

    function pressure(source: Unit) {
      const cause = {
        type: EffectType.Ability,
        ability: Abilities.Unnerve,
        unit: source,
      } as const;

      const ownAlliance = source.team.alliance;

      for (const alliance of battle.alliances) {
        if (alliance !== ownAlliance) {
          for (const team of alliance.teams) {
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
        }
      }

      // For visual cues
      source.triggerAbility(Abilities.Unnerve);
    }

    function release(source: Unit) {
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
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, event => {
        if (event.source.hasAbility(Abilities.Unnerve)) {
          pressure(event.source);
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, event => {
        release(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, event => {
        release(event.source);
      }),
      battle.on(
        BattleEvents.CheckUnitCanConsumeItem,
        EventPriority.Post,
        event => {
          if (
            event.success &&
            event.source.team.status[TeamStatuses.Unnerved] != null &&
            getItemData(event.item).type === ItemTypes.Berry
          ) {
            event.success = false;
          }
        },
      ),
    ]);
  }),

  // Pikachu
  // https://bulbapedia.bulbagarden.net/wiki/Static_(Ability)
  createAbility(Abilities.Static, battle => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, event => {
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
  createAbility(Abilities.LightningRod, battle => {
    return new MergedAbilityLifecycle([
      // Pure query: grants the immunity, no side effects
      battle.on(
        BattleEvents.CheckUnitMoveImmunity,
        EventPriority.Post,
        event => {
          if (
            event.type === Types.Electric &&
            event.target.type === MoveTargetType.Unit &&
            event.target.unit !== event.source &&
            event.target.unit.hasAbility(Abilities.LightningRod)
          ) {
            event.immune = true;
          }
        },
      ),
      // The absorb boost only fires when a real move actually fails
      // against the holder, never on speculative immunity checks
      battle.on(
        BattleEvents.UnitTriggerMoveFailed,
        EventPriority.Post,
        event => {
          const parent = event.parent;

          if (
            parent.target.type === MoveTargetType.Unit &&
            parent.target.unit !== parent.source &&
            parent.target.unit.hasAbility(Abilities.LightningRod) &&
            parent.source.checkMoveType(parent.move, parent.target) ===
              Types.Electric
          ) {
            const holder = parent.target.unit;

            holder.triggerAbility(Abilities.LightningRod);

            holder.addStage(Stages.SpecialAttack, 1, {
              type: EffectType.Ability,
              ability: Abilities.LightningRod,
              unit: holder,
            });
          }
        },
      ),
    ]);
  }),

  // Sandshrew
  // https://bulbapedia.bulbagarden.net/wiki/Sand_Veil_(Ability)
  createAbility(Abilities.SandVeil, battle => {
    return battle.on(
      BattleEvents.CheckUnitMoveAccuracy,
      EventPriority.Post,
      event => {
        if (
          event.accuracy != null &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit.hasAbility(Abilities.SandVeil) &&
          isWeatherSandstorm(event.target.unit)
        ) {
          event.accuracy *= 0.8;
        }
      },
    );
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Sand_Rush_(Ability)
  createAbility(Abilities.SandRush, battle => {
    return battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, event => {
      if (
        event.stat === Stats.Speed &&
        event.source.hasAbility(Abilities.SandRush) &&
        isWeatherSandstorm(event.source)
      ) {
        event.value *= 2;
      }
    });
  }),

  // Nidoran
  // https://bulbapedia.bulbagarden.net/wiki/Poison_Point_(Ability)
  createAbility(Abilities.PoisonPoint, battle => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, event => {
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
  createAbility(Abilities.Rivalry, battle => {
    return battle.on(
      BattleEvents.UnitAttackResolveDamage,
      EventPriority.Post,
      event => {
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
      },
    );
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Sheer_Force_(Ability)
  createAbility(Abilities.SheerForce, battle => {
    const FACTOR = 5325 / 4096;

    return new MergedAbilityLifecycle([
      // Moves with a secondary effect hit harder...
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, event => {
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
      battle.on(
        BattleEvents.CheckUnitAttackEffect,
        EventPriority.Post,
        event => {
          if (
            event.success &&
            event.parent.source.hasAbility(Abilities.SheerForce)
          ) {
            event.success = false;
          }
        },
      ),
    ]);
  }),

  // Clefairy
  // https://bulbapedia.bulbagarden.net/wiki/Cute_Charm_(Ability)
  createAbility(Abilities.CuteCharm, battle => {
    const CHANCE = 0.3;

    return battle.on(BattleEvents.UnitDamage, EventPriority.Post, event => {
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
  createAbility(Abilities.MagicGuard, battle => {
    return battle.on(BattleEvents.UnitDamage, EventPriority.Pre, event => {
      // Only direct attack damage can hurt the holder
      if (
        event.flags & DamageFlags.Indirect &&
        event.target.hasAbility(Abilities.MagicGuard)
      ) {
        event.disabled = true;
      }
    });
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Friend_Guard_(Ability)
  createAbility(Abilities.FriendGuard, battle => {
    return battle.on(
      BattleEvents.UnitAttackResolveDamage,
      EventPriority.Post,
      event => {
        const target = event.parent.target;

        for (const unit of target.team.units) {
          if (
            unit !== target &&
            unit.alive &&
            unit.hasAbility(Abilities.FriendGuard)
          ) {
            event.value *= 0.75;
            return;
          }
        }
      },
    );
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Unaware_(Ability)
  createAbility(Abilities.Unaware, battle => {
    return battle.on(
      BattleEvents.UnitAttackResolveStat,
      EventPriority.Post,
      event => {
        const parent = event.parent;

        /**
         * An Unaware defender ignores the attacker's offensive stages;
         * an Unaware attacker ignores the defender's defensive stages.
         * Either way the stat resolves without its stage factor.
         */
        const ignored =
          (event.unit === parent.source &&
            parent.target.hasAbility(Abilities.Unaware)) ||
          (event.unit === parent.target &&
            parent.source.hasAbility(Abilities.Unaware));

        if (ignored) {
          event.value = event.unit.checkStat(event.stat, 0);
        }
      },
    );
  }),
];

export function setupGen1Abilities(battle: Battle) {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
