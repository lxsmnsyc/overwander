import { AttackPriority } from '../../../../core/event-emitter';
import type { Stages } from '../../../../data/constants/stats';
import { Stats } from '../../../../data/constants/stats';
import type Abilities from '../../../../data/ids/abilities';
import { DamageFlags, MoveAttackFlags } from '../../../../data/ids/moves';
import { Statuses } from '../../../../data/ids/status';
import type Battle from '../../../battle';
import { BattleEvents, EffectType } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import onUnitActs from '../../../acts';
import { createAbility } from '../../__create';
import { createUnitState } from './helpers';

/** What a mark left on something takes each time it moves, and the deeper bite */
export const MARK_FRACTION = 1 / 16;
export const MARK_DEEP_FRACTION = 1 / 8;

/** What each starter's mark does besides taking its share */
export type MarkRider = 'drink' | 'kindle' | 'hold';

/**
 * What the Johto starters share: a landed move leaves the line's own
 * element on whatever it hit, and that thing pays for it every time it
 * moves. The mark is kept on the marked unit, so it goes when that unit
 * leaves the field or falls
 */
export function createMarkAbility(
  ability: Abilities,
  rider: MarkRider,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const { state, lifecycles } = createUnitState<Unit>(battle);

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !event.success ||
          !target.alive ||
          event.flags & MoveAttackFlags.Simulated ||
          !source.hasAbility(ability)
        ) {
          return;
        }

        // A jaw holds one thing: marking something else lets the last
        // one go
        if (rider === 'hold') {
          for (const [marked, marker] of state) {
            if (marker === source && marked !== target) {
              state.delete(marked);
            }
          }
        }

        state.set(target, source);
      }),
      ...onUnitActs(battle, (unit) => {
        const marker = state.get(unit);

        if (marker == null || !marker.alive || !marker.hasAbility(ability)) {
          return;
        }

        const deep =
          rider === 'hold' || (rider === 'kindle' && unit.status[Statuses.Burned] != null);
        const amount = unit.checkStat(Stats.HP, 0) * (deep ? MARK_DEEP_FRACTION : MARK_FRACTION);
        const cause = { type: EffectType.Ability, ability, unit: marker } as const;

        marker.triggerAbility(ability);
        marker.damage(cause, unit, amount, DamageFlags.Indirect);

        if (rider === 'drink') {
          marker.heal(cause, marker, amount, 0);
        }
      }),
      ...lifecycles,
    ]);
  });
}

/**
 * What the three legendary beasts share: the first blow that would
 * finish one leaves it standing on 1 HP, cured of whatever it was
 * carrying, and a stage sharper in the stat that beast is built on.
 * Once per battle rather than once per arrival, the way a revival is
 */
export function createRisenAbility(
  ability: Abilities,
  stage: Stages,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const spent = new Set<Unit>();

    return battle.on(BattleEvents.UnitDamage, AttackPriority.Pre, (event) => {
      const target = event.target;

      if (
        !target.alive ||
        event.flags & DamageFlags.Indirect ||
        event.value < target.health ||
        spent.has(target) ||
        !target.hasAbility(ability)
      ) {
        return;
      }

      spent.add(target);
      event.value = target.health - 1;

      const cause = { type: EffectType.Ability, ability, unit: target } as const;

      target.triggerAbility(ability);
      target.cure(cause);
      target.addStage(stage, 1, cause);
    });
  });
}
