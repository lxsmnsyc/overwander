import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { hasFreeItemSlot, stealableItem } from '../../utils';
import { createAbility } from '../__create';

/**
 * What a walk out of the first town meets: the scouts, the dogs and
 * the thieves.
 */

/** What a called shot is worth: a fifth again on the accuracy roll */
export const SPOTTER_ACCURACY = 1.2;

/** What one stage of a defence is worth, which is what standing guard buys */
export const GUARD_FACTOR = 1.5;

/** The health a teammate has to be under before the dog plants itself */
const GUARD_SHARE = 0.5;

/** Whether the unit is in the middle of a move, which is the moment a shot is called */
function committed(unit: Unit): boolean {
  return unit.casting != null || unit.channeling != null;
}

const setupAbilities = [
  /**
   * Spotter: a Watchog on the field calls what it sees, and its own
   * side throws at a target already committed to something. The
   * accuracy is the whole of it, so the scout gains nothing for itself
   * beyond what it is worth to the two in front of it
   */
  createAbility(Abilities.Spotter, (battle) =>
    battle.on(BattleEvents.CheckUnitMoveAccuracy, EventPriority.Post, (event) => {
      if (event.accuracy == null || event.target.type !== MoveTargetType.Unit) {
        return;
      }

      const target = event.target.unit;

      if (!committed(target)) {
        return;
      }
      // Anybody on the caster's own team, the scout included, so long
      // as one of them is standing there watching
      for (const unit of event.source.team.units) {
        if (unit.alive && unit.hasAbility(Abilities.Spotter)) {
          event.accuracy *= SPOTTER_ACCURACY;
          unit.triggerAbility(Abilities.Spotter);
          return;
        }
      }
    }),
  ),

  /**
   * Loyal Guard: the dog plants itself in front of whoever is hurt.
   * Read off the team rather than stored, so it comes and goes with
   * the teammate's health instead of having to be taken off again
   */
  createAbility(Abilities.LoyalGuard, (battle) =>
    battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        (event.stat !== Stats.Defense && event.stat !== Stats.SpecialDefense) ||
        !event.source.hasAbility(Abilities.LoyalGuard)
      ) {
        return;
      }

      for (const unit of event.source.team.units) {
        if (
          unit !== event.source &&
          unit.alive &&
          unit.health < unit.checkStat(Stats.HP, 0) * GUARD_SHARE
        ) {
          event.value *= GUARD_FACTOR;
          return;
        }
      }
    }),
  ),

  /**
   * Cat Burglar: the first thing it lands on somebody carrying
   * something leaves that thing in its own hands. Once a fight, and
   * only where it has a hand free, so it is a theft rather than a
   * hoard
   */
  createAbility(Abilities.CatBurglar, (battle) => {
    /** Who has already had their moment */
    const taken = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          taken.has(event.source) ||
          !event.source.alive ||
          !event.source.hasAbility(Abilities.CatBurglar) ||
          !hasFreeItemSlot(event.source)
        ) {
          return;
        }

        const item = stealableItem(event.target);

        if (item == null) {
          return;
        }
        taken.add(event.source);
        event.source.triggerAbility(Abilities.CatBurglar);
        event.target.removeItem(item, {
          type: EffectType.Ability,
          ability: Abilities.CatBurglar,
          unit: event.source,
        });
        event.source.addItem(item);
      }),

      battle.on(BattleEvents.UnitLeavesField, EventPriority.Post, (event) => {
        taken.delete(event.source);
      }),
    ]);
  }),
];

export default setupAbilities;
