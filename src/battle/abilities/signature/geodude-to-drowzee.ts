import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { Statuses } from '../../../data/ids/status';
import { DamageFlags, MoveAttackFlags, MoveCategories } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs, stealableItem, unitTarget } from '../../utils';
import { createAbility, createContactHazard } from '../__create';
import {
  allyHolder,
  createTimedMarks,
  createUnitCounter,
  createUnitState,
  fieldHasAbility,
} from './__create';

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

/** How long a fright keeps a wound open */
export const NIGHT_TERROR_DURATION = 4000;

/** What the tunnel is worth to the party, and what holding it costs */
export const LIVING_TUNNEL_ALLY_SCALE = 0.8;
export const LIVING_TUNNEL_SELF_SCALE = 1.2;

/** What one eaten dream is worth */
export const DREAM_FEAST_FRACTION = 1 / 8;

/** How often the spare head gets a turn, and what its blow is worth */
export const SECOND_HEAD_INTERVAL = 3;
export const SECOND_HEAD_POWER_SCALE = 0.5;

/** What slides off a swimmer, and what does not */
export const SLEEK_HIDE_CONTACT_SCALE = 0.75;
export const SLEEK_HIDE_RANGED_SCALE = 1.1;

/** What the spikes take off a blow, and out of whoever threw it */
export const SPIKE_SHELL_CONTACT_SCALE = 0.5;
export const SPIKE_SHELL_FRACTION = 1 / 8;

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

  // Doduo: the heads take turns, so every third blow is the spare one
  // getting its go
  createAbility(Abilities.SecondHead, (battle) => {
    const { counter, lifecycles } = createUnitCounter(battle);

    // The spare head's blow is not one of the three
    const striking = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          !event.target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          striking.has(source) ||
          !source.hasAbility(Abilities.SecondHead)
        ) {
          return;
        }

        const landed = counter.get(source) + 1;

        if (landed < SECOND_HEAD_INTERVAL) {
          counter.set(source, landed);
          return;
        }

        counter.clear(source);

        striking.add(source);
        source.triggerAbility(Abilities.SecondHead);

        source.attack(
          event.target,
          event.move,
          event.value * SECOND_HEAD_POWER_SCALE,
          event.type,
          event.category,
          event.flags,
        );

        striking.delete(source);
      }),
      ...lifecycles,
    ]);
  }),

  // Seel: a swimmer's hide sheds what is dragged across it and takes
  // what is thrown at it badly
  createAbility(Abilities.SleekHide, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const attacker = parent.source;

      if (
        event.unit !== attacker ||
        (event.stat !== Stats.Attack && event.stat !== Stats.SpecialAttack) ||
        !parent.target.hasAbility(Abilities.SleekHide)
      ) {
        return;
      }

      event.value *= attacker.checkMoveContact(parent.move, unitTarget(parent.target))
        ? SLEEK_HIDE_CONTACT_SCALE
        : SLEEK_HIDE_RANGED_SCALE;
    }),
  ),

  // Grimer: the sludge eats what touches it. The item is gone rather
  // than knocked loose, so nothing picks it back up
  createAbility(
    Abilities.CorrosiveOoze,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          const target = event.target;
          const cause = event.cause;

          if (
            !event.success ||
            event.flags & DamageFlags.Indirect ||
            cause.type !== EffectType.Move ||
            cause.unit === target ||
            !target.hasAbility(Abilities.CorrosiveOoze) ||
            !cause.unit.checkMoveContact(cause.move, unitTarget(target))
          ) {
            return;
          }

          const item = stealableItem(cause.unit);

          if (item == null) {
            return;
          }

          target.triggerAbility(Abilities.CorrosiveOoze);

          cause.unit.removeItem(item, {
            type: EffectType.Ability,
            ability: Abilities.CorrosiveOoze,
            unit: target,
          });
        }),
        createContactHazard(battle, Abilities.CorrosiveOoze),
      ]),
  ),

  // Shellder: all spikes. A blow dragged across them is worth less and
  // costs the arm that threw it
  createAbility(
    Abilities.SpikeShell,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
          const parent = event.parent;
          const attacker = parent.source;

          if (
            event.unit === attacker &&
            (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
            parent.target.hasAbility(Abilities.SpikeShell) &&
            attacker.checkMoveContact(parent.move, unitTarget(parent.target))
          ) {
            event.value *= SPIKE_SHELL_CONTACT_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          const target = event.target;
          const cause = event.cause;

          if (
            !event.success ||
            event.flags & DamageFlags.Indirect ||
            cause.type !== EffectType.Move ||
            cause.unit === target ||
            !target.hasAbility(Abilities.SpikeShell) ||
            !cause.unit.checkMoveContact(cause.move, unitTarget(target))
          ) {
            return;
          }

          const attacker = cause.unit;

          target.triggerAbility(Abilities.SpikeShell);

          target.damage(
            { type: EffectType.Ability, ability: Abilities.SpikeShell, unit: target },
            attacker,
            attacker.checkStat(Stats.HP, 0) * SPIKE_SHELL_FRACTION,
            DamageFlags.Indirect,
          );
        }),
        createContactHazard(battle, Abilities.SpikeShell),
      ]),
  ),

  // Gastly: what it touches does not mend. The mark lets go on its own
  // rather than waiting for anything to happen
  createAbility(Abilities.NightTerror, (battle) => {
    const frightened = createTimedMarks(battle);

    return new MergedLifecycle([
      ...frightened.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          !event.target.alive ||
          event.target === source ||
          !source.hasAbility(Abilities.NightTerror)
        ) {
          return;
        }

        source.triggerAbility(Abilities.NightTerror);

        frightened.mark(event.target, NIGHT_TERROR_DURATION);
      }),
      // A refusal rather than a reduction: the wound simply will not
      // close while the fright is on it
      battle.on(BattleEvents.CheckUnitCanHeal, EventPriority.Post, (event) => {
        if (event.success && frightened.has(event.target)) {
          event.success = false;
        }
      }),
    ]);
  }),

  // Onix: the party fights from behind it, and what the rock turns
  // aside from them it takes itself
  createAbility(Abilities.LivingTunnel, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      if (
        event.unit !== parent.source ||
        (event.stat !== Stats.Attack && event.stat !== Stats.SpecialAttack) ||
        (parent.type !== Types.Rock && parent.type !== Types.Ground)
      ) {
        return;
      }

      if (target.hasAbility(Abilities.LivingTunnel)) {
        event.value *= LIVING_TUNNEL_SELF_SCALE;
        return;
      }

      if (allyHolder(battle, target, Abilities.LivingTunnel)) {
        event.value *= LIVING_TUNNEL_ALLY_SCALE;
      }
    }),
  ),

  // Drowzee: it eats the dream whole rather than sipping at it
  createAbility(Abilities.DreamFeast, (battle) =>
    battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
      const source = event.source;

      if (
        !event.success ||
        event.flags & MoveAttackFlags.Simulated ||
        event.target.status[Statuses.Sleeping] == null ||
        !source.hasAbility(Abilities.DreamFeast)
      ) {
        return;
      }

      source.triggerAbility(Abilities.DreamFeast);

      source.heal(
        { type: EffectType.Ability, ability: Abilities.DreamFeast, unit: source },
        source,
        source.checkStat(Stats.HP, 0) * DREAM_FEAST_FRACTION,
        0,
      );
    }),
  ),
];

export default geodudeToDrowzee;
