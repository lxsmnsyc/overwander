import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import { Stages } from '../../../../data/constants/stats';
import type Abilities from '../../../../data/ids/abilities';
import type { Types } from '../../../../data/constants/types';
import type { Moves } from '../../../../data/ids/moves';
import { DamageFlags, MoveCategories } from '../../../../data/ids/moves';
import type Battle from '../../../core';
import { BattleEvents, EffectType } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { unitTarget } from '../../../utils';
import { createAbility } from '../../__create';

/** What each Kalos starter's bond is worth to the team standing with it */
export const BOND_SHELTER_SCALE = 0.85;
export const BOND_KINDLE_SCALE = 1.15;
export const BOND_SHADE_SCALE = 0.85;

/** Which of the three bonds this is */
export type BondKind = 'shelter' | 'kindle' | 'shade';

/** Whether this unit's own team has a standing holder of the ability */
function bonded(unit: Unit, ability: Abilities): boolean {
  for (const mate of unit.team.units) {
    if (mate.alive && mate.hasAbility(ability)) {
      return true;
    }
  }

  return false;
}

/**
 * What the Kalos starters share: standing there is worth something to
 * the whole team rather than to itself. Each covers one thing, so a
 * team fielding all three is sheltered, sharper and quicker at once,
 * and a second copy of one is worth nothing
 */
export function createBondAbility(
  ability: Abilities,
  kind: BondKind,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    if (kind === 'shade') {
      const quicken = (event: { source: Unit; duration: number }): void => {
        if (bonded(event.source, ability)) {
          event.duration *= BOND_SHADE_SCALE;
        }
      };

      return new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, quicken),
        battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Post, quicken),
      ]);
    }

    return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (kind === 'shelter') {
        if (parent.category === MoveCategories.Physical && bonded(parent.target, ability)) {
          event.value *= BOND_SHELTER_SCALE;
        }
        return;
      }
      if (parent.category === MoveCategories.Special && bonded(parent.source, ability)) {
        event.value *= BOND_KINDLE_SCALE;
      }
    });
  });
}

/**
 * What a version pair's two curses share: a move it lands puts the
 * caster's own type onto the target, cast as the line's signature
 * move so the move's own rules stand. A target already carrying that
 * type is left alone, which is what keeps it to once each
 */
export function createCurseAbility(
  ability: Abilities,
  move: Moves,
  type: Types,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const target = event.target;
      const cause = event.cause;

      if (
        !event.success ||
        (event.flags & DamageFlags.Indirect) !== 0 ||
        cause.type !== EffectType.Move ||
        cause.unit.team === target.team ||
        !cause.unit.hasAbility(ability) ||
        target.types.has(type)
      ) {
        return;
      }

      cause.unit.triggerAbility(ability);
      cause.unit.triggerMove(move, unitTarget(target), 0);
    }),
  );
}

/** What a spent item is worth, to either side of the field */
export const SPENT_ITEM_STAGES = 1;

/**
 * What the two sweet shops share: finishing its own held item moves
 * the field a step, Swirlix towards its own side and Spritzee away
 * from the other. Only what the holder spends itself counts, so an
 * item knocked out of its hands is nobody's
 */
export function createSpentItemAbility(
  ability: Abilities,
  own: boolean,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitRemoveItem, EventPriority.Post, (event) => {
      const shop = event.source;

      if (event.cause.type !== EffectType.Item || !shop.hasAbility(ability)) {
        return;
      }

      shop.triggerAbility(ability);

      const cause = { type: EffectType.Ability, ability, unit: shop } as const;

      for (const unit of own ? shop.team.units : battle.units(shop.team.alliance)) {
        if (unit.alive) {
          unit.addStage(Stages.Speed, own ? SPENT_ITEM_STAGES : -SPENT_ITEM_STAGES, cause);
        }
      }
    }),
  );
}
