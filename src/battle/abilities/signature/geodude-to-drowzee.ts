import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveCategories } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs } from '../../utils';
import { createAbility } from '../__create';
import { createUnitCounter, createUnitState, fieldHasAbility } from './__create';

/** What rock all the way through is worth, each way */
export const SOLID_CORE_PHYSICAL_SCALE = 0.7;
export const SOLID_CORE_SPECIAL_SCALE = 1.3;

/** What one stride adds, and how many strides it has in it */
export const GALLOP_STEP = 0.1;
export const GALLOP_MAX_STACKS = 5;

/** What share of a blow it does not feel yet, and how long until it does */
export const DELAYED_REACTION_SHARE = 0.5;
export const DELAYED_REACTION_DELAY = 4000;

/** What the field does to anything thrown rather than swung */
export const REPULSION_FIELD_SCALE = 0.9;

/** What the leek is worth in a duel, and what fighting without armour costs */
export const LEEK_DUELIST_CRITICAL_STAGES = 2;
export const LEEK_DUELIST_CRITICAL_SCALE = 1.25;
export const LEEK_DUELIST_EXPOSED_SCALE = 1.25;

/** Half a blow, waiting for the duck to notice it */
interface Debt {
  amount: number;
  remaining: number;
  source: Unit;
}

const geodudeToDrowzee = [
  // Geodude: rock the whole way in, with the hole that implies. Read
  // off the attacker's own stat, so it answers the blow rather than the
  // type
  createAbility(Abilities.SolidCore, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        event.unit !== parent.source ||
        (event.stat !== Stats.Attack && event.stat !== Stats.SpecialAttack) ||
        !parent.target.hasAbility(Abilities.SolidCore)
      ) {
        return;
      }

      if (parent.category === MoveCategories.Physical) {
        event.value *= SOLID_CORE_PHYSICAL_SCALE;
      } else if (parent.category === MoveCategories.Special) {
        event.value *= SOLID_CORE_SPECIAL_SCALE;
      }
    }),
  ),

  // Ponyta: it builds speed as it runs, and a horse that is hit stops
  // running. Nothing here reads its type, which is what keeps it
  // fitting a Rapidash with no fire in it
  createAbility(Abilities.Gallop, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
        const strides = counter.get(event.source);

        if (
          strides > 0 &&
          event.stat === Stats.Speed &&
          event.source.hasAbility(Abilities.Gallop)
        ) {
          event.value *= 1 + GALLOP_STEP * strides;
        }
      }),
      ...onUnitActs(battle, (unit) => {
        const strides = counter.get(unit);

        if (strides < GALLOP_MAX_STACKS && unit.hasAbility(Abilities.Gallop)) {
          counter.set(unit, strides + 1);
          unit.triggerAbility(Abilities.Gallop);
        }
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        if (event.success && event.target.hasAbility(Abilities.Gallop)) {
          counter.clear(event.target);
        }
      }),
      ...lifecycles,
    ]);
  }),

  // Slowpoke: it does not feel half of a blow until several seconds
  // later, so a burst can be healed off before the rest of it arrives
  createAbility(Abilities.DelayedReaction, (battle) => {
    const { state, lifecycles } = createUnitState<Debt[]>(battle);

    // The settling blow must not be halved and deferred again
    let settling = false;

    const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
      for (const [unit, debts] of state) {
        for (const debt of debts) {
          debt.remaining -= event.duration;
        }

        const due = debts.filter((debt) => debt.remaining <= 0);
        const pending = debts.filter((debt) => debt.remaining > 0);

        if (pending.length > 0) {
          state.set(unit, pending);
        } else {
          state.delete(unit);
        }

        for (const debt of due) {
          if (unit.alive) {
            settling = true;

            unit.triggerAbility(Abilities.DelayedReaction);

            debt.source.damage(
              {
                type: EffectType.Ability,
                ability: Abilities.DelayedReaction,
                unit,
              },
              unit,
              debt.amount,
              DamageFlags.Indirect,
            );

            settling = false;
          }
        }
      }

      if (state.size === 0) {
        clock.stop();
      }
    });

    clock.stop();

    return new MergedLifecycle([
      clock,
      // Before Exact, which is where the health actually comes off
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        if (settling || event.value <= 0 || !event.target.hasAbility(Abilities.DelayedReaction)) {
          return;
        }

        const withheld = event.value * DELAYED_REACTION_SHARE;

        event.value -= withheld;

        state.set(event.target, [
          ...(state.get(event.target) ?? []),
          { amount: withheld, remaining: DELAYED_REACTION_DELAY, source: event.source },
        ]);

        clock.start();
      }),
      ...lifecycles,
    ]);
  }),

  // Magnemite: the field it throws bends anything thrown through it,
  // whoever threw it, so it dampens its own shots as well
  createAbility(Abilities.RepulsionField, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      if (
        event.unit === event.parent.source &&
        event.stat === Stats.SpecialAttack &&
        fieldHasAbility(battle, Abilities.RepulsionField)
      ) {
        event.value *= REPULSION_FIELD_SCALE;
      }
    }),
  ),

  // Farfetch'd: the leek is a duelling sword and there is no armour
  // behind it. Reads the same on a Sirfetch'd holding a lance
  createAbility(
    Abilities.LeekDuelist,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackCheckCriticalRatio, EventPriority.Post, (event) => {
          if (event.parent.source.hasAbility(Abilities.LeekDuelist)) {
            event.value += LEEK_DUELIST_CRITICAL_STAGES;
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveCriticalMult, EventPriority.Post, (event) => {
          if (event.parent.source.hasAbility(Abilities.LeekDuelist)) {
            event.value *= LEEK_DUELIST_CRITICAL_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;

          if (
            event.unit === parent.source &&
            (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
            parent.target.hasAbility(Abilities.LeekDuelist)
          ) {
            event.value *= LEEK_DUELIST_EXPOSED_SCALE;
          }
        }),
      ]),
  ),
];

export default geodudeToDrowzee;
