import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags, MoveCategories } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility, getAbilityHolders } from '../__create';

/** What a watched teammate keeps of a blow */
export const VIGIL_SCALE = 0.8;

/** Whether one of the swords is standing watch over this unit's side */
function watched(unit: Unit, ability: Abilities): boolean {
  for (const holder of getAbilityHolders(unit.battle, ability)) {
    if (holder.alive && holder.team === unit.team && holder.hasAbility(ability)) {
      return true;
    }
  }

  return false;
}

/**
 * The two that stand in front of one kind of blow. The cut is the
 * team's, the holder among them, and a speculative resolve is left
 * alone
 */
function createVigilAbility(
  ability: Abilities,
  blow: MoveCategories,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        event.value > 0 &&
        parent.category === blow &&
        !(parent.flags & MoveAttackFlags.Simulated) &&
        watched(parent.target, ability)
      ) {
        event.value *= VIGIL_SCALE;
      }
    }),
  );
}

/**
 * The four swords, each keeping watch over its team against one kind
 * of harm: the blow that lands, the blow that burns from a distance,
 * and the two things done to a pokemon rather than to its health
 */
const setupAbilities = [
  createVigilAbility(Abilities.IronVigil, MoveCategories.Physical),
  createVigilAbility(Abilities.StoneVigil, MoveCategories.Special),

  /**
   * Leaf Vigil: what a pokemon spent on purpose is still paid in
   * full, the way the lodge pays it, so only what was done to it is
   * softened
   */
  createAbility(
    Abilities.LeafVigil,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
          if (
            event.value > 0 &&
            event.flags & DamageFlags.Indirect &&
            !(event.flags & (DamageFlags.Cost | DamageFlags.Pure)) &&
            watched(event.target, Abilities.LeafVigil)
          ) {
            event.value *= VIGIL_SCALE;
          }
        }),
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            (event.status === Statuses.Poisoned || event.status === Statuses.BadlyPoisoned) &&
            watched(event.source, Abilities.LeafVigil)
          ) {
            event.immune = true;
          }
        }),
      ]),
  ),

  /**
   * Tide Vigil: a stage the holder's own side hands out is welcome,
   * so only a drop from across the field is refused
   */
  createAbility(
    Abilities.TideVigil,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            event.status === Statuses.Flinched &&
            watched(event.source, Abilities.TideVigil)
          ) {
            event.immune = true;
          }
        }),
        battle.on(BattleEvents.CheckUnitCanAddStage, EventPriority.Post, (event) => {
          if (
            event.success &&
            event.value < 0 &&
            event.cause.type !== EffectType.None &&
            event.cause.unit.team !== event.source.team &&
            watched(event.source, Abilities.TideVigil)
          ) {
            event.success = false;
          }
        }),
      ]),
  ),
];

export default setupAbilities;
