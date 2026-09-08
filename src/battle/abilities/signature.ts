import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import Abilities from '../../data/ids/abilities';
import { MoveAttackFlags, MoveCategories } from '../../data/ids/moves';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { MergedLifecycle } from '../lifecycle';
import type Unit from '../unit';
import { createAbility } from './__create';

/** What share of a blow the bulb keeps hold of */
export const SEED_CACHE_BANK_FRACTION = 1 / 4;

/** How far the bank can fill, as a share of the holder's max HP */
export const SEED_CACHE_CAP_FRACTION = 1 / 2;

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
      // A fresh arrival brings an empty bulb
      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        banked.delete(event.source);
      }),
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        banked.delete(event.source);
      }),
    ]);
  }),
];

export default function setupSignatureAbilities(battle: Battle): void {
  for (const setup of setupAbilities) {
    setup(battle);
  }
}
