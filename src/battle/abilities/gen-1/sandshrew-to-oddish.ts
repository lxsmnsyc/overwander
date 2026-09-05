import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { ItemTypes, type Items } from '../../../data/ids/items';
import { DamageFlags, MoveAttackFlags, MoveCategories, Moves } from '../../../data/ids/moves';
import { Genders } from '../../../data/ids/species';
import { Statuses, TeamStatuses, Weathers } from '../../../data/ids/status';
import { getItemData } from '../../../data/items';
import { getMoveData } from '../../../data/moves';
import { FEED_BONUS } from '../../ai/score';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { STATUS_MOVES, hasAttackEffect } from '../../moves/status';
import type Unit from '../../unit';
import { isWeatherSandstorm, unitTarget } from '../../utils';
import {
  chipImmunity,
  createAbility,
  createContactHazard,
  createFeedScoring,
  createSandRushAbility,
  movesOfType,
} from '../__create';
import { MergedLifecycle } from '../../lifecycle';

/**
 * Sandshrew to Oddish: the sand, the powders and the first of the
 * abilities that answer being touched
 */
const sandshrewToOddish = [
  // Sandshrew
  // https://bulbapedia.bulbagarden.net/wiki/Sand_Veil_(Ability)
  createAbility(
    Abilities.SandVeil,
    (battle) =>
      new MergedLifecycle([
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
  createSandRushAbility(Abilities.SandRush, isWeatherSandstorm, Weathers.Sandstorm),

  // https://bulbapedia.bulbagarden.net/wiki/Rough_Skin_(Ability)
  createAbility(
    Abilities.RoughSkin,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          if (
            event.success &&
            !(event.flags & DamageFlags.Indirect) &&
            event.cause.type === EffectType.Move &&
            event.cause.unit !== event.target &&
            event.target.hasAbility(Abilities.RoughSkin) &&
            event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target))
          ) {
            const attacker = event.cause.unit;

            event.target.triggerAbility(Abilities.RoughSkin);

            event.target.damage(
              {
                type: EffectType.Ability,
                ability: Abilities.RoughSkin,
                unit: event.target,
              },
              attacker,
              attacker.checkStat(Stats.HP, 0) / 8,
              DamageFlags.Indirect,
            );
          }
        }),
        // Touching it costs something, so the AI is told before it
        // decides to
        createContactHazard(battle, Abilities.RoughSkin),
      ]),
  ),

  // Nidoran
  // https://bulbapedia.bulbagarden.net/wiki/Poison_Point_(Ability)
  createAbility(Abilities.PoisonPoint, (battle) => {
    const CHANCE = 0.3;

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          event.cause.type === EffectType.Move &&
          event.cause.unit !== event.target &&
          event.target.hasAbility(Abilities.PoisonPoint) &&
          event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target)) &&
          battle.random() < CHANCE
        ) {
          event.target.triggerAbility(Abilities.PoisonPoint);

          event.cause.unit.addStatus(Statuses.Poisoned, {
            type: EffectType.Ability,
            ability: Abilities.PoisonPoint,
            unit: event.target,
          });
        }
      }),
      // Touching it costs something, so the AI is told before it
      // decides to
      createContactHazard(battle, Abilities.PoisonPoint),
    ]);
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

    return new MergedLifecycle([
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

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          event.cause.type === EffectType.Move &&
          event.cause.unit !== event.target &&
          event.target.hasAbility(Abilities.CuteCharm) &&
          event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target)) &&
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
      }),
      // Touching it costs something, so the AI is told before it
      // decides to
      createContactHazard(battle, Abilities.CuteCharm),
    ]);
  }),

  // https://bulbapedia.bulbagarden.net/wiki/Magic_Guard_(Ability)
  createAbility(Abilities.MagicGuard, (battle) => {
    /**
     * What a move would be spent on for nothing: statuses whose whole
     * point is the health they take. A burn is not among them — the
     * chip is refused but the halved Attack is not, and that is what
     * a burn is mostly for
     */
    const POINTLESS = new Set<Statuses>([Statuses.Poisoned, Statuses.BadlyPoisoned]);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitCanDamage, EventPriority.Post, (event) => {
        // Only direct attack damage can hurt the holder — and what the
        // holder spends on purpose, which is not damage done to it: a
        // Substitute's price and an Explosion's own life are paid
        // whoever pays them
        const indirect = event.flags & DamageFlags.Indirect && !(event.flags & DamageFlags.Cost);

        // A confusion hit rides the attack pipeline but is nobody's
        // move, so the holder is spared it the way it is spared a
        // burn. The lost cast still costs it
        const confusion =
          event.cause.type === EffectType.Move && event.cause.move === Moves._Confused;

        if (
          event.success &&
          (indirect || confusion) &&
          event.target.hasAbility(Abilities.MagicGuard)
        ) {
          event.success = false;
        }
      }),
      // A poison that will never take a point of health is a cast
      // spent on nothing, so the AI is refused it outright — the
      // holder is not immune to the status, it is immune to the only
      // thing the status does
      battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
        const status = STATUS_MOVES[event.move];

        // Explicit null check: the first Statuses enum member is 0
        if (
          event.usable &&
          status != null &&
          POINTLESS.has(status) &&
          event.target.type === MoveTargetType.Unit &&
          event.target.unit.hasAbility(Abilities.MagicGuard)
        ) {
          event.usable = false;
        }
      }),
    ]);
  }),

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

    return new MergedLifecycle([
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
      // Lighting a teammate's Flash Fire is worth a hit; a second
      // one adds nothing, since the boost does not stack
      createFeedScoring(battle, Abilities.FlashFire, movesOfType(Types.Fire), (holder) =>
        activated.has(holder) ? 0 : FEED_BONUS,
      ),
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
      new MergedLifecycle([
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
  createAbility(Abilities.Frisk, (battle) => {
    /**
     * What each holder pocketed on the way in. The item stays in its
     * owner's grip and reads as unusable through `CheckUnitItem`, so
     * nothing has to be handed back when the holder leaves
     */
    const pocketed = new Map<Unit, { unit: Unit; item: Items }>();

    // Berries are exempt: taking one away is Unnerve's job, and
    // stacking the two would leave a berry holder with nothing
    function frisk(unit: Unit): Items | undefined {
      for (const key in unit.items) {
        // tsc requires the assertion to index the Items-mapped record;
        // tsgolint resolves the const enum to number and disagrees
        // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
        const item = Number(key) as Items;

        if (unit.hasItem(item) && getItemData(item).type !== ItemTypes.Berry) {
          return item;
        }
      }

      return undefined;
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (pocketed.has(event.source) || !event.source.hasAbility(Abilities.Frisk)) {
          return;
        }

        for (const unit of battle.units(event.source.team.alliance)) {
          const item = unit.alive ? frisk(unit) : undefined;

          if (item != null) {
            pocketed.set(event.source, { unit, item });
            event.source.triggerAbility(Abilities.Frisk);
            return;
          }
        }
      }),
      // Pure query: the pocketed item reads as unusable while the
      // frisker stands
      battle.on(BattleEvents.CheckUnitItem, EventPriority.Post, (event) => {
        if (!event.enabled) {
          return;
        }

        for (const taken of pocketed.values()) {
          if (taken.unit === event.source && taken.item === event.item) {
            event.enabled = false;
            return;
          }
        }
      }),
      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        pocketed.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        pocketed.delete(event.source);
      }),
    ]);
  }),

  // Zubat
  // https://bulbapedia.bulbagarden.net/wiki/Inner_Focus_(Ability)
  createAbility(
    Abilities.InnerFocus,
    (battle) =>
      new MergedLifecycle([
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
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.cause.type === EffectType.Ability &&
            event.cause.ability === Abilities.Intimidate &&
            event.source.hasAbility(Abilities.InnerFocus)
          ) {
            event.success = false;

            // A cue is something a watcher sees, so it waits for a real
            // attempt rather than the AI weighing one
            if (!event.simulated) {
              event.source.triggerAbility(Abilities.InnerFocus);
            }
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

    return new MergedLifecycle([
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
      battle.on(BattleEvents.UnitAttack, AttackPriority.Pre, (event) => {
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

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
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

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          event.cause.type === EffectType.Move &&
          event.cause.unit !== event.target &&
          event.target.hasAbility(Abilities.EffectSpore) &&
          event.cause.unit.checkMoveContact(event.cause.move, unitTarget(event.target)) &&
          // Grass types and Overcoat holders are immune to spores
          // (modern mechanics; explicit check)
          !event.cause.unit.types.has(Types.Grass) &&
          !event.cause.unit.hasAbility(Abilities.Overcoat)
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
      }),
      // Touching it costs something, so the AI is told before it
      // decides to
      createContactHazard(battle, Abilities.EffectSpore),
    ]);
  }),
];

export default sandshrewToOddish;
