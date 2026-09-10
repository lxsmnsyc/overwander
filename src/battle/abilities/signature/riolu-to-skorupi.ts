import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveAttackFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { isWeatherSandstorm, onUnitActs } from '../../utils';
import { createAbility } from '../__create';

/** What reading something in better shape than itself is worth */
export const AURA_MATCH_SCALE = 1.25;

/** What one roll in the sand puts back */
export const DUST_BATH_FRACTION = 1 / 16;

/** What the one blow nobody saw coming is worth */
export const AMBUSH_SCALE = 1.3;

/** What share of its pool a unit still holds */
function healthShare(unit: Unit): number {
  return unit.health / unit.checkStat(Stats.HP, 0);
}

/**
 * The aura, the sand and the sting: one rises to whatever it is
 * facing, one takes the weather it makes with it, and one gets a
 * single blow in before anybody knows it is there
 */
const setupAbilities = [
  /**
   * Aura Match: the reading is of what is left standing on either
   * side, so a fight it is losing is a fight it hits harder in
   */
  createAbility(Abilities.AuraMatch, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const target = event.target;
      const source = event.source;

      if (
        event.power == null ||
        target.type !== MoveTargetType.Unit ||
        !source.hasAbility(Abilities.AuraMatch) ||
        healthShare(target.unit) <= healthShare(source)
      ) {
        return;
      }

      event.power *= AURA_MATCH_SCALE;
    }),
  ),

  /**
   * Dust Bath: the sand is its own, so the healing is paid for by
   * standing in the weather it brings rather than by finding one
   */
  createAbility(
    Abilities.DustBath,
    (battle) =>
      new MergedLifecycle([
        ...onUnitActs(battle, (unit) => {
          if (unit.hasAbility(Abilities.DustBath) && isWeatherSandstorm(unit)) {
            unit.triggerAbility(Abilities.DustBath);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.DustBath) {
            return;
          }

          const source = event.source;

          source.heal(
            { type: EffectType.Ability, ability: Abilities.DustBath, unit: source },
            source,
            source.checkStat(Stats.HP, 0) * DUST_BATH_FRACTION,
            0,
          );
        }),
      ]),
  ),

  /**
   * Ambush: cover is spent the first time it is used on somebody, and
   * a speculative question never spends it
   */
  createAbility(Abilities.Ambush, (battle) => {
    /** Who each holder has already shown itself to */
    const struck = new WeakMap<Unit, Set<Unit>>();

    return new MergedLifecycle([
      battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
        const target = event.target;
        const source = event.source;

        if (
          event.power == null ||
          target.type !== MoveTargetType.Unit ||
          !source.hasAbility(Abilities.Ambush) ||
          struck.get(source)?.has(target.unit)
        ) {
          return;
        }

        event.power *= AMBUSH_SCALE;
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;

        if (
          !event.success ||
          event.flags & MoveAttackFlags.Simulated ||
          !source.hasAbility(Abilities.Ambush)
        ) {
          return;
        }

        let shown = struck.get(source);

        if (!shown) {
          shown = new Set();
          struck.set(source, shown);
        }
        shown.add(event.target);
      }),
    ]);
  }),
];

export default setupAbilities;
