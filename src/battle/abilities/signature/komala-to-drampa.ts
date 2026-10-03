import { AttackPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveCategories, Moves } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { onUnitActs, unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { createHitBackAbility, createUnitState } from './__create';

/** How many times it acts between naps */
export const NAP_TIME_EVERY = 3;

/** What a nap heals */
export const NAP_TIME_FRACTION = 1 / 4;

/**
 * Ula'ula's roads: the koala that dozes as it fights, the two old
 * dragons that hit back for their team, and the rag that holds a grudge
 */
const setupAbilities = [
  // Komala: every few moves it drifts off, and wakes up rested. The count
  // runs the whole fight rather than restarting on each entrance
  createAbility(Abilities.NapTime, (battle) => {
    const acted = new Map<Unit, number>();

    return new MergedLifecycle([
      ...onUnitActs(battle, (unit) => {
        if (!unit.hasAbility(Abilities.NapTime)) {
          return;
        }

        const count = (acted.get(unit) ?? 0) + 1;

        acted.set(unit, count);
        if (count % NAP_TIME_EVERY === 0) {
          unit.triggerAbility(Abilities.NapTime);
          unit.heal(
            { type: EffectType.Ability, ability: Abilities.NapTime, unit },
            unit,
            unit.checkStat(Stats.HP, 0) * NAP_TIME_FRACTION,
            0,
          );
        }
      }),
    ]);
  }),

  // Turtonator and Drampa, the Sun and Moon pair: one answers physical
  // blows on its team with fire, the other special ones with dragon breath
  createHitBackAbility(Abilities.BlastShell, MoveCategories.Physical, Types.Fire),
  createHitBackAbility(Abilities.EldersIre, MoveCategories.Special, Types.Dragon),

  // Mimikyu: whoever first lands a blow on it is repaid with Spite, once
  // each for the fight
  createAbility(Abilities.GrudgeShroud, (battle) => {
    const { state: grudges, lifecycles } = createUnitState<Set<Unit>>(battle);

    return new MergedLifecycle([
      ...lifecycles,
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const { cause, target } = event;

        if (
          !event.success ||
          event.flags & DamageFlags.Indirect ||
          cause.type !== EffectType.Move ||
          cause.unit === target ||
          cause.unit.team.alliance === target.team.alliance ||
          !cause.unit.alive ||
          !target.hasAbility(Abilities.GrudgeShroud)
        ) {
          return;
        }

        const held = grudges.get(target) ?? new Set<Unit>();

        if (held.has(cause.unit)) {
          return;
        }
        held.add(cause.unit);
        grudges.set(target, held);
        target.triggerAbility(Abilities.GrudgeShroud);
        target.triggerMove(Moves.Spite, unitTarget(cause.unit), 0);
      }),
    ]);
  }),
];

export default setupAbilities;
