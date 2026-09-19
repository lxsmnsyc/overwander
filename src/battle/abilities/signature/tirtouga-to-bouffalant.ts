import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveCategories, Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { getMoveData } from '../../../data/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/**
 * The gap in the dex between Tirtouga and Bouffalant: the two fossils,
 * the two that trade shells, the mushroom, the jellyfish, the fish in
 * the mud and the bull.
 */

/** Where the fossils' two abilities both read, as a share of maximum HP */
export const FOSSIL_THRESHOLD = 0.5;

/** What Deep Hold puts on the shell for holding the line */
export const DEEP_HOLD_STAGES = 2;

/** What Featherstone gives back, as a share of maximum HP */
export const FEATHERSTONE_SHARE = 0.25;

/** What Shell Thief moves from one side to the other */
export const SHELL_THIEF_STAGES = 1;

/** What Barehide takes instead of the Defense it refused */
export const BAREHIDE_STAGES = 1;

/** How much longer an enemy takes to cast in Still Water */
export const STILL_WATER_SCALE = 1.2;

/** What Shockmud is worth, and how often the mud bites */
export const SHOCKMUD_SCALE = 1.2;
export const SHOCKMUD_CHANCE = 0.2;

/** What each other pokemon still standing is worth to the bull */
export const HERD_BOND_SHARE = 0.1;

const setupAbilities = [
  /**
   * Deep Hold: the shell refuses the blow that would take it under
   * half, once. Sturdy answers a hit from full health, so the two
   * never cover the same one
   */
  createAbility(Abilities.DeepHold, (battle) => {
    const { state, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        const target = event.target;
        const half = target.checkStat(Stats.HP, 0) * FOSSIL_THRESHOLD;

        if (
          !target.alive ||
          state.get(target) === true ||
          event.flags & DamageFlags.Indirect ||
          target.health <= half ||
          target.health - event.value > half ||
          !target.hasAbility(Abilities.DeepHold)
        ) {
          return;
        }

        state.set(target, true);
        event.value = target.health - half;
        target.triggerAbility(Abilities.DeepHold);
        target.addStage(Stages.Defense, DEEP_HOLD_STAGES, {
          type: EffectType.Ability,
          ability: Abilities.DeepHold,
          unit: target,
        });
      }),
    ]);
  }),

  /**
   * Featherstone: the same threshold from the other side. Defeatist
   * reads half health too, so this buys one flight back over it
   */
  createAbility(Abilities.Featherstone, (battle) => {
    const { state, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const target = event.target;
        const max = target.checkStat(Stats.HP, 0);

        if (
          !event.success ||
          !target.alive ||
          state.get(target) === true ||
          target.health > max * FOSSIL_THRESHOLD ||
          !target.hasAbility(Abilities.Featherstone)
        ) {
          return;
        }

        state.set(target, true);
        target.triggerAbility(Abilities.Featherstone);
        target.heal(
          { type: EffectType.Ability, ability: Abilities.Featherstone, unit: target },
          target,
          max * FEATHERSTONE_SHARE,
          0,
        );
      }),
    ]);
  }),

  /**
   * Shell Thief: one stage of armour changes hands per enemy, which is
   * the trade the line evolves by. Barehide is what answers it
   */
  createAbility(Abilities.ShellThief, (battle) => {
    const { state, lifecycles } = createUnitState<Set<Unit>>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const cause = event.cause;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === event.target ||
          !cause.unit.hasAbility(Abilities.ShellThief) ||
          getMoveData(cause.move).category !== MoveCategories.Physical
        ) {
          return;
        }

        const holder = cause.unit;
        const robbed = state.get(holder) ?? new Set<Unit>();

        if (robbed.has(event.target)) {
          return;
        }

        robbed.add(event.target);
        state.set(holder, robbed);
        holder.triggerAbility(Abilities.ShellThief);

        const taken = {
          type: EffectType.Ability,
          ability: Abilities.ShellThief,
          unit: holder,
        } as const;

        event.target.addStage(Stages.Defense, -SHELL_THIEF_STAGES, taken);
        holder.addStage(Stages.Defense, SHELL_THIEF_STAGES, taken);
      }),
    ]);
  }),

  /**
   * Barehide: nobody takes its Defense, and what they reached for is
   * paid back in the other guard
   */
  createAbility(Abilities.Barehide, (battle) =>
    battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
      if (
        !event.success ||
        event.value >= 0 ||
        event.stage !== Stages.Defense ||
        event.cause.type === EffectType.None ||
        event.cause.unit === event.source ||
        !event.source.hasAbility(Abilities.Barehide)
      ) {
        return;
      }

      event.success = false;

      // Weighing a drop is not throwing one: a caster that merely
      // considered it should not hand over a guard for thinking
      if (event.simulated) {
        return;
      }

      event.source.triggerAbility(Abilities.Barehide);
      event.source.addStage(Stages.SpecialDefense, BAREHIDE_STAGES, {
        type: EffectType.Ability,
        ability: Abilities.Barehide,
        unit: event.source,
      });
    }),
  ),

  /** Sporeburst: the lure is still working after whatever bit it walks off */
  createAbility(Abilities.Sporeburst, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const holder = event.source;

      if (!holder.hasAbility(Abilities.Sporeburst)) {
        return;
      }

      holder.triggerAbility(Abilities.Sporeburst);
      for (const enemy of battle.units(holder.team.alliance)) {
        if (enemy.alive) {
          holder.triggerMove(Moves.StunSpore, unitTarget(enemy), 0);
        }
      }
    }),
  ),

  /**
   * Still Water: cast times only. What a move takes to come back is
   * Speed's answer and nothing here touches it
   */
  createAbility(Abilities.StillWater, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
      for (const enemy of battle.units(event.source.team.alliance)) {
        if (enemy.alive && enemy.hasAbility(Abilities.StillWater)) {
          event.duration *= STILL_WATER_SCALE;
          return;
        }
      }
    }),
  ),

  /** Shockmud: the ground it is buried in carries a charge */
  createAbility(
    Abilities.Shockmud,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
          if (
            event.power != null &&
            event.source.hasAbility(Abilities.Shockmud) &&
            getMoveData(event.move).type === Types.Ground
          ) {
            event.power *= SHOCKMUD_SCALE;
          }
        }),
        battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
          const cause = event.cause;

          if (
            !event.success ||
            event.flags & DamageFlags.Indirect ||
            cause.type !== EffectType.Move ||
            cause.unit === event.target ||
            !cause.unit.hasAbility(Abilities.Shockmud) ||
            getMoveData(cause.move).type !== Types.Ground ||
            battle.random() >= SHOCKMUD_CHANCE
          ) {
            return;
          }

          cause.unit.triggerAbility(Abilities.Shockmud);
          event.target.addStatus(Statuses.Paralyzed, {
            type: EffectType.Ability,
            ability: Abilities.Shockmud,
            unit: cause.unit,
          });
        }),
      ]),
  ),

  /**
   * Herd Bond: the herd at its back, counted as it thins. Its own team
   * rather than the whole alliance, so a stranger's six are worth
   * nothing to it
   */
  createAbility(Abilities.HerdBond, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      const holder = event.source;

      if (event.stat !== Stats.Attack || !holder.hasAbility(Abilities.HerdBond)) {
        return;
      }

      let standing = 0;

      for (const mate of holder.team.units) {
        if (mate !== holder && mate.alive) {
          standing += 1;
        }
      }
      event.value *= 1 + standing * HERD_BOND_SHARE;
    }),
  ),
];

export default setupAbilities;
