import { AttackPriority, EventPriority } from '../../../../core/event-emitter';
import type { Stages } from '../../../../data/constants/stats';
import { Stats } from '../../../../data/constants/stats';
import type Abilities from '../../../../data/ids/abilities';
import type { Types } from '../../../../data/constants/types';
import { MoveAttackFlags, MoveCategories } from '../../../../data/ids/moves';
import type { Statuses } from '../../../../data/ids/status';
import type Battle from '../../../core';
import { BattleEvents, EffectType, type UnitAttackResolveAmountEvent } from '../../../events';
import { MergedLifecycle } from '../../../lifecycle';
import type Unit from '../../../unit';
import { createAbility, getAbilityHolders } from '../../__create';
import { allyHolder } from './helpers';

/**
 * What the three Unova starters share: the **first** move each lands in
 * a fight carries something extra, and every move after it is an
 * ordinary one. What the extra is belongs to the family.
 *
 * The opening is spent on real damage only, so a speculative resolve
 * never uses it up
 */
export function createOpeningAbility(
  ability: Abilities,
  open: (hit: { event: UnitAttackResolveAmountEvent; source: Unit; target: Unit }) => void,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    /** Who has already opened its fight */
    const opened = new Set<Unit>();

    return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        event.value > 0 &&
        !(parent.flags & MoveAttackFlags.Simulated) &&
        !opened.has(parent.source) &&
        parent.source.hasAbility(ability)
      ) {
        opened.add(parent.source);
        parent.source.triggerAbility(ability);
        open({ event, source: parent.source, target: parent.target });
      }
    });
  });
}

/** What each half of the dojo is worth to the team standing with it */
export const RED_BELT_SCALE = 0.85;
export const BLUE_BELT_SCALE = 1.15;

/** Which half of the pair a belt is: the throw or the strike */
export type BeltSide = 'throws' | 'strikes';

/**
 * Throh and Sawk train the same team, one covering it against physical
 * moves and one arming its physical moves. Both read the same resolve,
 * so the pair is one listener with the predicate swapped
 */
export function createBeltAbility(
  ability: Abilities,
  side: BeltSide,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (parent.category !== MoveCategories.Physical) {
        return;
      }

      // The dojo covers whoever stands in it, the holder included
      const unit = side === 'throws' ? parent.target : parent.source;

      if (unit.hasAbility(ability) || allyHolder(battle, unit, ability) != null) {
        event.value *= side === 'throws' ? RED_BELT_SCALE : BLUE_BELT_SCALE;
      }
    }),
  );
}

/** How low the monkeys let themselves get before they spend the tuft */
export const TUFT_THRESHOLD = 1 / 2;

/**
 * The elemental monkeys each carry their element in a tuft and spend
 * it once, on the whole enemy side, the first time a blow takes them
 * under half. What each one leaves behind is a status that keeps
 * costing: a burn, a whirlpool, a seed. A line that spends a move
 * rather than a status passes what it does to each enemy instead
 */
export function createTuftAbility(
  ability: Abilities,
  burst: Statuses | ((holder: Unit, enemy: Unit) => void),
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) => {
    /** Which holders have already spent theirs */
    const spent = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const holder = event.target;

        if (
          !event.success ||
          !holder.alive ||
          spent.has(holder) ||
          !holder.hasAbility(ability) ||
          holder.health >= holder.checkStat(Stats.HP, 0) * TUFT_THRESHOLD
        ) {
          return;
        }

        spent.add(holder);
        holder.triggerAbility(ability);

        const cause = { type: EffectType.Ability, ability, unit: holder } as const;

        for (const enemy of battle.units(holder.team.alliance)) {
          if (!enemy.alive) {
            continue;
          }

          if (typeof burst === 'function') {
            burst(holder, enemy);
          } else {
            enemy.addStatus(burst, cause);
          }
        }
      }),

      // A tuft grows back between fights, not between arrivals
      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        spent.delete(event.source);
      }),
    ]);
  });
}

/** What a fallen body is worth to each of the two birds */
export const WARCRY_STAGES = 2;
export const BONEWEAR_STAGES = 1;

/**
 * The eagle and the vulture never share a sky, and each is worth
 * something the moment a body hits the ground: Braviary reads its own
 * side's dead and answers with Attack, Mandibuzz reads the enemy's and
 * answers with armour. Same trigger, opposite side, opposite stat
 */
export function createCarrionAbility(
  ability: Abilities,
  own: boolean,
  stages: [stage: Stages, value: number][],
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
      const fallen = event.source;

      for (const holder of getAbilityHolders(battle, ability)) {
        const theirs = holder.team.alliance === fallen.team.alliance;

        if (!holder.alive || holder === fallen || theirs !== own) {
          continue;
        }
        holder.triggerAbility(ability);

        const cause = { type: EffectType.Ability, ability, unit: holder } as const;

        for (const [stage, value] of stages) {
          holder.addStage(stage, value, cause);
        }
      }
    }),
  );
}

/** What keeping a creed is worth on a blow that answers it */
export const CREED_SCALE = 1.3;

/**
 * The tao trio's shared shape: each dragon holds one conviction and
 * asks the thing it is hitting whether the answer is yes, pressing
 * only where it is
 */
export function createCreedAbility(
  ability: Abilities,
  answers: (target: Unit) => boolean,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (event.value > 0 && parent.source.hasAbility(ability) && answers(parent.target)) {
        event.value *= CREED_SCALE;
      }
    }),
  );
}

/** What a genie standing over the field is worth to its own element */
export const GENIE_SCALE = 1.3;

/**
 * The three that ride the storm clouds lift one element apiece for
 * the side they stand on. Same rule three times over, turned by the
 * genie's own type, so a trio standing together lifts three
 */
export function createGenieAbility(
  ability: Abilities,
  type: Types,
): ((battle: Battle) => void) & { ability: Abilities } {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (parent.type !== type) {
        return;
      }

      // The genie covers its own team, never the whole alliance
      for (const mate of parent.source.team.units) {
        if (mate.alive && mate.hasAbility(ability)) {
          event.value *= GENIE_SCALE;
          return;
        }
      }
    }),
  );
}
