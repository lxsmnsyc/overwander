import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import type Abilities from '../../../../data/ids/abilities';
import type { Moves } from '../../../../data/ids/moves';
import {
  MoveAttackFlags,
  MoveCategories,
  MoveTargets,
  affectsFoesOnly,
} from '../../../../data/ids/moves';
import { getMoveData } from '../../../../data/moves';
import { Statuses } from '../../../../data/ids/status';
import type Battle from '../../../battle';
import { BattleEvents, EffectType } from '../../../events';
import { type Lifecycle, MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { createAbility, getAbilityHolders } from '../../__create';
import { createUnitState } from './helpers';

/** What a Monkey's Oath makes of its avenging wind-up */
export const AVENGING_CAST_SCALE = 0.6;

/** The one thing each of the Loyal Three adds to its avenging blow */
export type AvengingEdge = 'critical' | 'quick' | 'spread';

/**
 * What the Loyal Three share: a chain that answers a fallen teammate.
 * The holder's next damaging move is sure to badly poison what it
 * lands on, with one more edge each. Armed until a damaging move goes
 * off, then held for that move until it has landed
 */
export function createAvengingChainAbility(
  ability: Abilities,
  edge: AvengingEdge,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    const { state: armed, lifecycles } = createUnitState<true>(battle);
    const { state: striking, lifecycles: strikes } = createUnitState<Moves>(battle);

    const cause = (unit: Unit) => ({ type: EffectType.Ability, ability, unit }) as const;

    function avenges(unit: Unit, move: Moves): boolean {
      return (
        getMoveData(move).category !== MoveCategories.Status &&
        (armed.has(unit) || striking.get(unit) === move) &&
        unit.hasAbility(ability)
      );
    }

    // The one edge this member adds
    function sharpen(): Lifecycle {
      if (edge === 'critical') {
        // Before the roll, the way Merciless answers, so armour still refuses it
        return battle.on(BattleEvents.UnitAttackResolveCriticalHit, EventPriority.Pre, (event) => {
          if (avenges(event.parent.source, event.parent.move)) {
            event.critical = true;
          }
        });
      }
      if (edge === 'quick') {
        return battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
          if (armed.has(event.source) && avenges(event.source, event.move)) {
            event.duration *= AVENGING_CAST_SCALE;
          }
        });
      }
      // The same widening a Boss gets
      return battle.on(BattleEvents.CheckUnitMoveTargeting, EventPriority.Post, (event) => {
        if (
          event.target === MoveTargets.Unit &&
          affectsFoesOnly(event.affects) &&
          avenges(event.source, event.move)
        ) {
          event.target = MoveTargets.None;
        }
      });
    }

    return new MergedLifecycle([
      ...lifecycles,
      ...strikes,
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        const fallen = event.source;

        for (const holder of getAbilityHolders(battle, ability)) {
          if (
            holder !== fallen &&
            holder.alive &&
            holder.team === fallen.team &&
            holder.hasAbility(ability)
          ) {
            holder.triggerAbility(ability);
          }
        }
      }),
      battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
        if (event.ability === ability) {
          armed.set(event.source, true);
        }
      }),
      battle.on(BattleEvents.UnitTriggerMove, AttackPriority.Pre, (event) => {
        const unit = event.source;

        if (
          armed.has(unit) &&
          getMoveData(event.move).category !== MoveCategories.Status &&
          unit.hasAbility(ability)
        ) {
          armed.delete(unit);
          striking.set(unit, event.move);
        }
      }),
      battle.on(BattleEvents.UnitTriggerMoveEnd, EventPriority.Post, (event) => {
        if (striking.get(event.source) === event.move) {
          striking.delete(event.source);
        }
      }),
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const target = event.target;

        if (
          event.success &&
          !(event.flags & MoveAttackFlags.Simulated) &&
          target.alive &&
          target.team.alliance !== event.source.team.alliance &&
          striking.get(event.source) === event.move &&
          event.source.hasAbility(ability)
        ) {
          target.addStatus(Statuses.BadlyPoisoned, cause(event.source));
        }
      }),
      sharpen(),
    ]);
  });
}
