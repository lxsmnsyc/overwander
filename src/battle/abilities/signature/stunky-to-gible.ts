import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { hasAnyStatus, onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';

/** What a poisoned target is worth to the spray */
export const RANK_AIR_SCALE = 1.25;

/** What one swing of the bell costs everything facing it */
export const DEEP_TOLL_FRACTION = 1 / 16;

/** What is caught in the air, once the ground stops sheltering it */
export const SKYHUNT_SCALE = 1.2;

/** Either poison is poison as far as the spray is concerned */
const POISONS = new Set([Statuses.Poisoned, Statuses.BadlyPoisoned]);

/**
 * The skunk, the bell and the shark: one presses whatever it has
 * already fouled, one tolls for the far side every time it moves, and
 * one goes after what it cannot normally reach
 */
const setupAbilities = [
  /**
   * Rank Air: the cloud stays on a target that is already breathing
   * it, so the line's own poison is what the damage is spent on
   */
  createAbility(Abilities.RankAir, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const target = event.target;

      if (
        event.power == null ||
        target.type !== MoveTargetType.Unit ||
        !hasAnyStatus(target.unit, POISONS) ||
        !event.source.hasAbility(Abilities.RankAir)
      ) {
        return;
      }

      event.power *= RANK_AIR_SCALE;
    }),
  ),

  /**
   * Deep Toll: the bell rings when the bell swings, so the line's own
   * Speed is the rate it tolls at rather than a clock
   */
  createAbility(
    Abilities.DeepToll,
    (battle) =>
      new MergedLifecycle([
        ...onUnitActs(battle, (unit) => {
          if (unit.hasAbility(Abilities.DeepToll)) {
            unit.triggerAbility(Abilities.DeepToll);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.DeepToll) {
            return;
          }

          const source = event.source;
          const cause = {
            type: EffectType.Ability,
            ability: Abilities.DeepToll,
            unit: source,
          } as const;

          for (const enemy of battle.units(source.team.alliance)) {
            if (enemy.alive) {
              source.damage(
                cause,
                enemy,
                enemy.checkStat(Stats.HP, 0) * DEEP_TOLL_FRACTION,
                DamageFlags.Indirect,
              );
            }
          }
        }),
      ]),
  ),

  /**
   * Skyhunt: standing is the whole of what a Ground move asks, so the
   * answer is to take the question away rather than to retype the move
   */
  createAbility(
    Abilities.Skyhunt,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveImmunity, EventPriority.Post, (event) => {
          if (
            event.immune &&
            event.type === Types.Ground &&
            event.target.type === MoveTargetType.Unit &&
            event.source.hasAbility(Abilities.Skyhunt)
          ) {
            event.immune = false;
          }
        }),
        battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
          const target = event.target;

          if (
            event.power == null ||
            target.type !== MoveTargetType.Unit ||
            target.unit.checkGrounded() ||
            !event.source.hasAbility(Abilities.Skyhunt) ||
            event.source.checkMoveType(event.move, target) !== Types.Ground
          ) {
            return;
          }

          event.power *= SKYHUNT_SCALE;
        }),
        // The cue belongs to a blow that landed: a check event is asked
        // speculatively by the AI as well
        battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
          if (
            event.success &&
            !(event.flags & MoveAttackFlags.Simulated) &&
            !event.target.checkGrounded() &&
            event.source.hasAbility(Abilities.Skyhunt) &&
            event.source.checkMoveType(event.move, unitTarget(event.target)) === Types.Ground
          ) {
            event.source.triggerAbility(Abilities.Skyhunt);
          }
        }),
      ]),
  ),
];

export default setupAbilities;
