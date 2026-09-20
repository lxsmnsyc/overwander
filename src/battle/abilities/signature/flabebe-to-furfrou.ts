import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import type Unit from '../../unit';
import { MergedLifecycle } from '../../lifecycle';
import { createAbility } from '../__create';
import { createUnitState } from './__create';

/** The share of a teammate's hit the goat carries, and where it stops */
export const BROAD_BACK_SHARE = 1 / 3;
export const BROAD_BACK_FLOOR = 1 / 4;

/** What refusing the first status is worth */
export const WELL_GROOMED_STAGES = 1;

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
 * The flower road's three: the garden that puts its own roof over
 * everything growing under it, the goat that carries a share of what
 * its team is hit with, and the poodle whose coat shrugs the first
 * thing off
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

  createAbility(Abilities.BroadBack, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      const hurt = event.target;

      // Only a blow somebody struck is shared: poison, weather and the
      // share itself are already nobody's to carry
      if (event.value <= 0 || !hurt.alive || (event.flags & DamageFlags.Indirect) !== 0) {
        return;
      }

      const carrier = standing(hurt, Abilities.BroadBack);

      if (carrier == null || carrier.health <= carrier.checkStat(Stats.HP, 0) * BROAD_BACK_FLOOR) {
        return;
      }

      const share = event.value * BROAD_BACK_SHARE;

      event.value -= share;
      carrier.triggerAbility(Abilities.BroadBack);
      carrier.damage(
        { type: EffectType.Ability, ability: Abilities.BroadBack, unit: carrier },
        carrier,
        share,
        DamageFlags.Indirect,
      );
    }),
  ),

  createAbility(Abilities.WellGroomed, (battle) => {
    // Whether the coat has already turned something away this fight
    const { state, lifecycles } = createUnitState<boolean>(battle);

    function fresh(unit: Unit): boolean {
      return unit.hasAbility(Abilities.WellGroomed) && state.get(unit) !== true;
    }

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.CheckUnitStatusImmunity, EventPriority.Post, (event) => {
        if (!event.immune && fresh(event.source)) {
          event.immune = true;
        }
      }),
      battle.on(BattleEvents.UnitAddStatusFailed, EventPriority.Post, (event) => {
        const unit = event.source;

        if (!fresh(unit)) {
          return;
        }
        state.set(unit, true);
        unit.triggerAbility(Abilities.WellGroomed);
        unit.addStage(Stages.Speed, WELL_GROOMED_STAGES, {
          type: EffectType.Ability,
          ability: Abilities.WellGroomed,
          unit,
        });
      }),
    ]);
  }),
];

export default setupAbilities;
