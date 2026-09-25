import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { onUnitActs } from '../../utils';
import { createAbility, getAbilityHolders } from '../__create';

/**
 * Route 12 and what the last roads hold: the anteater, the nest it
 * comes for, and the moth a world once mistook for the sun.
 */

/** What a nest is worth to the thing that opens nests */
export const ANTEATER_SCALE = 1.5;

/** What the armour is worth against the one thing it was built for */
export const ANT_GUARD_SCALE = 0.5;

/** What standing near a small sun costs, each time a body acts */
export const EMBER_HALO_SHARE = 1 / 16;

/** The nest: what a Heatmor came for, and what a Durant is made of */
const PREY = new Set<Types>([Types.Bug, Types.Steel]);

const setupAbilities = [
  /**
   * Anteater and Ant Guard cancel rather than complement, so the two
   * are separate listeners: one answers a type it is hunting, the
   * other answers the type hunting it. Meeting each other they come
   * to 0.75x, and the ant wins the exchange it was built to lose
   */
  createAbility(Abilities.Anteater, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (!parent.source.hasAbility(Abilities.Anteater)) {
        return;
      }

      for (const type of PREY) {
        if (parent.target.types.has(type)) {
          event.value *= ANTEATER_SCALE;
          return;
        }
      }
    }),
  ),

  createAbility(Abilities.AntGuard, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (parent.type === Types.Fire && parent.target.hasAbility(Abilities.AntGuard)) {
        event.value *= ANT_GUARD_SCALE;
      }
    }),
  ),

  /**
   * Ember Halo: it does not burn anything, it simply stands there
   * being a sun, and anything that reaches for a move near it pays
   */
  createAbility(
    Abilities.EmberHalo,
    (battle) =>
      new MergedLifecycle(
        onUnitActs(battle, (unit) => {
          if (!unit.alive) {
            return;
          }

          for (const moth of getAbilityHolders(battle, Abilities.EmberHalo)) {
            if (!moth.alive || moth.team.alliance === unit.team.alliance) {
              continue;
            }
            moth.triggerAbility(Abilities.EmberHalo);
            moth.damage(
              { type: EffectType.Ability, ability: Abilities.EmberHalo, unit: moth },
              unit,
              Math.max(1, Math.floor(unit.checkStat(Stats.HP, 0) * EMBER_HALO_SHARE)),
              DamageFlags.Indirect,
            );
            return;
          }
        }),
      ),
  ),
];

export default setupAbilities;
