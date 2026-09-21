import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveCategories } from '../../../data/ids/moves';
import { BattleEvents } from '../../events';
import { createAbility } from '../__create';

/** What a stage is worth to something with seven hands on it */
export const MANY_HANDS_SCALE = 1.5;

/**
 * The share of a target's HP a shot never falls under, and the share
 * of its own a blow has to reach before the kelp feels it. One number
 * for both halves of the pair: the shot is measured to clear exactly
 * what the kelp ignores
 */
export const SHOT_FLOOR = 1 / 8;

/**
 * Skrelp and Clauncher, the two the sea's own routes pair off, and
 * the rock that holds itself together beside them. The dragon ignores
 * anything small and the gunner cannot fire small, so meeting each
 * other is the one fight where neither is worth anything
 */
const setupAbilities = [
  createAbility(Abilities.ManyHands, (battle) =>
    battle.on(BattleEvents.CheckUnitStage, EventPriority.Post, (event) => {
      // Both ways round: seven hands pull harder and are pulled
      // harder, so a drop on it costs half again as much
      if (event.value !== 0 && event.source.hasAbility(Abilities.ManyHands)) {
        event.value = Math.round(event.value * MANY_HANDS_SCALE);
      }
    }),
  ),

  createAbility(Abilities.DeepKelp, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      const target = event.target;

      // Only what somebody swung: poison, weather and the rest are
      // already the sea it lies in
      if (
        event.value <= 0 ||
        (event.flags & DamageFlags.Indirect) !== 0 ||
        !target.hasAbility(Abilities.DeepKelp)
      ) {
        return;
      }

      if (event.value < target.checkStat(Stats.HP, 0) * SHOT_FLOOR) {
        event.value = 0;
        target.triggerAbility(Abilities.DeepKelp);
      }
    }),
  ),

  createAbility(Abilities.RangingShot, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      // A shot that was refused outright stays refused: the floor is
      // under what lands rather than under what cannot
      if (
        event.value <= 0 ||
        parent.category !== MoveCategories.Special ||
        !parent.source.hasAbility(Abilities.RangingShot)
      ) {
        return;
      }

      const floor = parent.target.checkStat(Stats.HP, 0) * SHOT_FLOOR;

      if (event.value < floor) {
        event.value = floor;
      }
    }),
  ),
];

export default setupAbilities;
