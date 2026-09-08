import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents, type CheckUnitMoveTimeEvent } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createAbility } from './__create';

/** What share of a blow the bulb keeps hold of */
export const SEED_CACHE_BANK_FRACTION = 1 / 4;

/** How far the bank can fill, as a share of the holder's max HP */
export const SEED_CACHE_CAP_FRACTION = 1 / 2;

/** What one landed Fire move takes off the wind-up */
export const AFTERBURN_STEP = 0.15;

/** How many of them the flame holds */
export const AFTERBURN_MAX_STACKS = 3;

/** What the pressure behind a shot is worth */
export const OVERPRESSURE_POWER_SCALE = 1.3;

/** What one shot leaves behind on the cannons */
export const OVERPRESSURE_COOLDOWN_STEP = 0.2;

/** How far the fouling builds */
export const OVERPRESSURE_MAX_STACKS = 3;

/**
 * A signature ability belongs to one family and is invented for it:
 * nothing in the mainline answers to these names
 */
const setupAbilities = [
  // Bulbasaur: the seed on its back grows on what it is fed, so
  // punching it is what loads the shot it fires back
  createAbility(Abilities.SeedCache, (battle) => {
    const banked = new Map<Unit, number>();

    // Health standing before the blow, so only what was actually
    // taken is banked: overkill and a non-lethal clamp settle out of
    // the difference
    const standing = new WeakMap<object, number>();

    function bankOf(unit: Unit): number {
      return banked.get(unit) ?? 0;
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        if (event.target.hasAbility(Abilities.SeedCache)) {
          standing.set(event, event.target.health);
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const before = standing.get(event);

        if (!event.success || before == null) {
          return;
        }

        standing.delete(event);

        const target = event.target;
        const taken = Math.max(0, before - target.health);
        const cap = target.checkStat(Stats.HP, 0) * SEED_CACHE_CAP_FRACTION;

        banked.set(target, Math.min(cap, bankOf(target) + taken * SEED_CACHE_BANK_FRACTION));
      }),
      // The bank rides on the blow itself rather than on the move's
      // power, so a resisted Grass move still delivers all of it
      battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
        const parent = event.parent;
        const source = parent.source;

        if (
          parent.type !== Types.Grass ||
          parent.category === MoveCategories.Status ||
          !source.hasAbility(Abilities.SeedCache)
        ) {
          return;
        }

        const bank = bankOf(source);

        if (bank <= 0) {
          return;
        }

        event.value += bank;

        // The AI weighs a move by running this same resolver, so a
        // bank it is only thinking about must survive the thought
        if (!(parent.flags & MoveAttackFlags.Simulated)) {
          banked.delete(source);
          source.triggerAbility(Abilities.SeedCache);
        }
      }),
      // A fresh arrival brings an empty bulb; an ability lifting and
      // settling again is not one
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          banked.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        banked.delete(event.source);
      }),
    ]);
  }),
  // Charmander: the tail flame feeds on its own fire, so a chain of
  // hits winds the line up and a single whiff blows it out
  createAbility(Abilities.Afterburn, (battle) => {
    const stacks = new Map<Unit, number>();

    function discount(event: CheckUnitMoveTimeEvent): void {
      const held = stacks.get(event.source) ?? 0;

      if (held > 0 && event.source.hasAbility(Abilities.Afterburn)) {
        event.duration *= 1 - AFTERBURN_STEP * held;
      }
    }

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
        const parent = event.parent;
        const source = parent.source;

        if (!source.hasAbility(Abilities.Afterburn)) {
          return;
        }

        const fire = source.checkMoveType(parent.move, parent.target) === Types.Fire;

        if (!event.hit || !fire) {
          stacks.delete(source);
          return;
        }

        const held = Math.min(AFTERBURN_MAX_STACKS, (stacks.get(source) ?? 0) + 1);

        stacks.set(source, held);
        source.triggerAbility(Abilities.Afterburn);
      }),
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, discount),
      battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Post, discount),
      // The flame it comes back with is the one it started with
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          stacks.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        stacks.delete(event.source);
      }),
    ]);
  }),

  // Squirtle: the shell cannons are worth more the harder they are
  // driven, and they foul as they go
  createAbility(Abilities.Overpressure, (battle) => {
    const fouling = new Map<Unit, number>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          event.source.hasAbility(Abilities.Overpressure) &&
          event.source.checkMoveType(event.move, event.target) === Types.Water
        ) {
          event.power *= OVERPRESSURE_POWER_SCALE;
        }
      }),
      battle.on(BattleEvents.CheckUnitMoveCooldown, EventPriority.Post, (event) => {
        const held = fouling.get(event.source) ?? 0;

        if (held > 0 && event.source.hasAbility(Abilities.Overpressure)) {
          event.duration *= 1 + OVERPRESSURE_COOLDOWN_STEP * held;
        }
      }),
      // Only a shot that lands fouls the cannons; anything else it
      // reaches for vents them
      battle.on(BattleEvents.UnitTriggerMoveRollHit, EventPriority.Post, (event) => {
        const parent = event.parent;
        const source = parent.source;

        if (!source.hasAbility(Abilities.Overpressure)) {
          return;
        }

        if (source.checkMoveType(parent.move, parent.target) !== Types.Water) {
          fouling.delete(source);
          return;
        }

        if (event.hit) {
          fouling.set(source, Math.min(OVERPRESSURE_MAX_STACKS, (fouling.get(source) ?? 0) + 1));
          source.triggerAbility(Abilities.Overpressure);
        }
      }),
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          fouling.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        fouling.delete(event.source);
      }),
    ]);
  }),
];

export default function setupSignatureAbilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
