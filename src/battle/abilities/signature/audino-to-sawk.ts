import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';
import { allyHolder, createBeltAbility, createDamageTaken } from './__create';

/**
 * What the rest of Pinwheel Forest holds: the listener, the labourers,
 * the croakers and the dojo's two halves.
 */

/** How much of a blow the beam takes, and what dropping it is worth */
export const LOAD_BEARING_THRESHOLD = 1 / 2;
export const LOAD_BEARING_TAKEN = 0.6;
export const LOAD_BEARING_DEALT = 1.4;

/** How far the shake carries past whoever it was aimed at */
export const RIPPLE_OUT_FRACTION = 1 / 4;

const setupAbilities = [
  /**
   * Ward: it hears a teammate failing and keeps them on their feet.
   * One each, tracked per unit rather than per fight, so a teammate
   * that arrives again is covered again
   */
  createAbility(Abilities.Ward, (battle) => {
    /** Who has already been kept standing */
    const spent = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
        const target = event.target;
        const keeper = allyHolder(battle, target, Abilities.Ward);

        if (
          !target.alive ||
          keeper == null ||
          spent.has(target) ||
          event.value < target.health ||
          target.hasAbility(Abilities.Ward)
        ) {
          return;
        }

        event.value = target.health - 1;
        spent.add(target);
        keeper.triggerAbility(Abilities.Ward);
      }),

      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          spent.delete(event.source);
        }
      }),
    ]);
  }),

  /**
   * Load Bearing: the beam is up while it is healthy and down once it
   * is not. Both halves read the same resolve, so the swap is one
   * listener asking which side of the line the holder is on
   */
  createAbility(Abilities.LoadBearing, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const carrying = (unit: Unit): boolean =>
        unit.health >= unit.checkStat(Stats.HP, 0) * LOAD_BEARING_THRESHOLD;

      if (parent.target.hasAbility(Abilities.LoadBearing) && carrying(parent.target)) {
        event.value *= LOAD_BEARING_TAKEN;
      }

      if (parent.source.hasAbility(Abilities.LoadBearing) && !carrying(parent.source)) {
        event.value *= LOAD_BEARING_DEALT;
      }
    }),
  ),

  /**
   * Ripple Out: the shake reaches whoever is standing near the one it
   * hit. The splash is indirect, so it never sets itself off again
   */
  createAbility(Abilities.RippleOut, (battle) => {
    const damage = createDamageTaken(battle);

    return new MergedLifecycle([
      ...damage.lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const taken = damage.taken(event);
        const cause = event.cause;

        if (
          !event.success ||
          taken == null ||
          taken <= 0 ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          !cause.unit.hasAbility(Abilities.RippleOut)
        ) {
          return;
        }

        const source = cause.unit;

        source.triggerAbility(Abilities.RippleOut);

        for (const other of battle.units(source.team.alliance)) {
          if (other !== event.target && other.alive) {
            source.damage(
              { type: EffectType.Ability, ability: Abilities.RippleOut, unit: source },
              other,
              taken * RIPPLE_OUT_FRACTION,
              DamageFlags.Indirect,
            );
          }
        }
      }),
    ]);
  }),

  // The dojo's two halves, one factory and one line each
  createBeltAbility(Abilities.RedBelt, 'throws'),
  createBeltAbility(Abilities.BlueBelt, 'strikes'),
];

export default setupAbilities;
