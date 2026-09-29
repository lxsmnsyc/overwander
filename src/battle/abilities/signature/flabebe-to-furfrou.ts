import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveCategories } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import type { EffectCause } from '../../events';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Unit from '../../unit';
import { MergedLifecycle } from '../../lifecycle';
import { hasAnyStatus } from '../../utils';
import { createAbility } from '../__create';

/** How much health a goat needs left before it will carry anything */
export const SADDLE_BURDEN_FLOOR = 1 / 2;

/** What a kept coat turns away, and how hurt it may be and still turn it */
export const PEDIGREE_COAT_SCALE = 0.8;
export const PEDIGREE_COAT_FLOOR = 1 / 2;

/** The teammate holding the ability, if one is standing */
function standing(unit: Unit, ability: Abilities): Unit | undefined {
  for (const mate of unit.team.units) {
    if (mate !== unit && mate.alive && mate.hasAbility(ability)) {
      return mate;
    }
  }

  return undefined;
}

/**
 * The teammate that will take this status in the unit's place: one
 * with health to spare and nothing on it already. A burden it is
 * handing over is never handed back, which is what keeps two goats
 * from passing one poison between them
 */
function carrier(unit: Unit, cause: EffectCause): Unit | undefined {
  if (cause.type === EffectType.Ability && cause.ability === Abilities.SaddleBurden) {
    return undefined;
  }

  const goat = standing(unit, Abilities.SaddleBurden);

  if (
    goat == null ||
    goat.health <= goat.checkStat(Stats.HP, 0) * SADDLE_BURDEN_FLOOR ||
    hasAnyStatus(goat, MAJOR_STATUS_CONDITIONS)
  ) {
    return undefined;
  }

  return goat;
}

/**
 * The flower road's three: the garden that puts its own roof over
 * everything growing under it, the goat that takes what its team is
 * dosed with, and the poodle whose coat turns what its fur cannot
 */
const setupAbilities = [
  createAbility(Abilities.Hothouse, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const sheltered = event.unit;

      if (event.stat !== Stats.SpecialDefense || sheltered !== event.parent.target) {
        return;
      }

      const keeper = standing(sheltered, Abilities.Hothouse);
      // The roof is the keeper's own number, stages and all, and it is
      // only a roof where it stands higher than what is under it
      const under = keeper?.checkStat(Stats.SpecialDefense, 0) ?? 0;

      if (under > event.value) {
        event.value = under;
      }
    }),
  ),

  createAbility(
    Abilities.SaddleBurden,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
          if (
            !event.immune &&
            MAJOR_STATUS_CONDITIONS.has(event.status) &&
            carrier(event.source, event.cause) != null
          ) {
            event.immune = true;
          }
        }),
        // Taken on only where a real dose actually failed to land
        battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
          if (!MAJOR_STATUS_CONDITIONS.has(event.status)) {
            return;
          }

          const goat = carrier(event.source, event.cause);

          if (goat == null) {
            return;
          }
          goat.triggerAbility(Abilities.SaddleBurden);
          goat.addStatus(event.status, {
            type: EffectType.Ability,
            ability: Abilities.SaddleBurden,
            unit: goat,
          });
        }),
      ]),
  ),

  createAbility(Abilities.PedigreeCoat, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const target = event.parent.target;

      if (
        event.parent.category === MoveCategories.Special &&
        target.hasAbility(Abilities.PedigreeCoat) &&
        target.health >= target.checkStat(Stats.HP, 0) * PEDIGREE_COAT_FLOOR
      ) {
        event.value *= PEDIGREE_COAT_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
