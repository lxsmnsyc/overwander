import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveTargetPriorities } from '../../../data/ids/moves';
import { checkTeamUnit } from '../../ai/rating';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/** The share of their own HP a touch costs whoever lands it */
export const CASTLE_DRAIN_FRACTION = 1 / 8;

/** What the first cast after each entrance takes of its cast time */
export const STARFALL_SCALE = 0.5;

/** What a stored charge is worth to its next Electric move */
export const CHARGED_SPINES_SCALE = 1.5;

/**
 * Hano Beach and Mount Hokulani: the sandcastle that drains whoever digs
 * into it, the sea cucumber that gets thrown back into the sea, the
 * meteor that falls in fast, and the hedgehog that stores what touches it
 */
const setupAbilities = [
  // Sandygast: the touch that digs into it pays for it
  createAbility(Abilities.CastleDrain, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const { cause, target } = event;

      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        cause.type !== EffectType.Move ||
        cause.unit === target ||
        !cause.unit.alive ||
        !target.alive ||
        !target.hasAbility(Abilities.CastleDrain) ||
        !cause.unit.checkMoveContact(cause.move, unitTarget(target))
      ) {
        return;
      }

      const toucher = cause.unit;
      const drained = Math.min(
        toucher.health,
        toucher.checkStat(Stats.HP, 0) * CASTLE_DRAIN_FRACTION,
      );
      const drain = {
        type: EffectType.Ability,
        ability: Abilities.CastleDrain,
        unit: target,
      } as const;

      target.triggerAbility(Abilities.CastleDrain);
      target.damage(drain, toucher, drained, DamageFlags.Indirect);
      target.heal(drain, target, drained, 0);
    }),
  ),

  // Pyukumuku: once a fight, the blow that would finish it throws it back
  // instead. It survives on 1 HP even with nobody to come in for it
  createAbility(Abilities.TossedBack, (battle) => {
    const spent = new Set<Unit>();
    const tossed = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        const target = event.target;

        if (
          !target.alive ||
          event.flags & DamageFlags.Indirect ||
          event.value < target.health ||
          spent.has(target) ||
          !target.hasAbility(Abilities.TossedBack)
        ) {
          return;
        }
        spent.add(target);
        tossed.add(target);
        event.value = target.health - 1;
        target.triggerAbility(Abilities.TossedBack);
      }),
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const unit = event.target;

        if (!tossed.delete(unit) || !unit.alive) {
          return;
        }

        const replacement = checkTeamUnit(battle, unit.team, MoveTargetPriorities.Strongest, unit);

        if (replacement == null || !unit.checkEscape() || !replacement.checkEscape()) {
          return;
        }
        unit.forceSwitch(replacement, {
          type: EffectType.Ability,
          ability: Abilities.TossedBack,
          unit,
        });
      }),
    ]);
  }),

  // Minior: it falls onto the field already moving
  createAbility(Abilities.Starfall, (battle) => {
    const { state: spent, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
        if (spent.get(event.source) !== true && event.source.hasAbility(Abilities.Starfall)) {
          event.duration *= STARFALL_SCALE;
        }
      }),
      // After the cast time is read for real, which is what spends it
      battle.on(BattleEvents.UnitCast, EventPriority.Post, (event) => {
        if (event.source.hasAbility(Abilities.Starfall)) {
          spent.set(event.source, true);
        }
      }),
    ]);
  }),

  // Togedemaru: a touch leaves a charge in its spines, spent by the next
  // Electric move of its own that lands
  createAbility(Abilities.ChargedSpines, (battle) => {
    const { state: charged, lifecycles } = createUnitState<boolean>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const { cause, target } = event;

        if (
          event.success &&
          !(event.flags & DamageFlags.Indirect) &&
          cause.type === EffectType.Move &&
          cause.unit !== target &&
          target.alive &&
          charged.get(target) !== true &&
          target.hasAbility(Abilities.ChargedSpines) &&
          cause.unit.checkMoveContact(cause.move, unitTarget(target))
        ) {
          charged.set(target, true);
          target.triggerAbility(Abilities.ChargedSpines);
        }
      }),
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        if (
          event.power != null &&
          charged.get(event.source) === true &&
          event.source.checkMoveType(event.move, event.target) === Types.Electric
        ) {
          event.power *= CHARGED_SPINES_SCALE;
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (event.success && event.type === Types.Electric) {
          charged.delete(event.source);
        }
      }),
    ]);
  }),
];

export default setupAbilities;
