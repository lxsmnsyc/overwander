import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { Moves } from '../../../data/ids/moves';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import type Unit from '../../unit';
import { hasAnyStatus } from '../../utils';
import { createAbility } from '../__create';

/**
 * Celestial Tower and the road to it: the lamp that is already burning
 * what it took, the pair that came down in the desert, and the clay
 * still following its orders.
 */

/** What a lamp is worth against something already suffering */
export const HEXLIGHT_SCALE = 1.4;

/** The same statuses Hex answers, so the two never disagree */
const HEXED = new Set<Statuses>([...MAJOR_STATUS_CONDITIONS, Statuses.Comatose]);

/** What comes loose with the seal, and what it costs */
export const BROKEN_SEAL_ATTACK = 2;
export const BROKEN_SEAL_DEFENSE = -1;
export const BROKEN_SEAL_THRESHOLD = 1 / 2;

const setupAbilities = [
  /**
   * Hexlight: it burns what is already going wrong, so it needs the
   * status to be there rather than putting one there itself
   */
  createAbility(Abilities.Hexlight, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (parent.source.hasAbility(Abilities.Hexlight) && hasAnyStatus(parent.target, HEXED)) {
        event.value *= HEXLIGHT_SCALE;
      }
    }),
  ),

  /**
   * Swap Field: the room arrives with it. The move keeps its own
   * duration and its own second-casting rule, so nothing here has to
   * know how long a room stands
   */
  createAbility(
    Abilities.SwapField,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.SwapField)) {
            event.source.triggerAbility(Abilities.SwapField);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability === Abilities.SwapField) {
            event.source.triggerMove(Moves.WonderRoom, { type: MoveTargetType.None }, 0);
          }
        }),
      ]),
  ),

  /**
   * Broken Seal: the seal holds the thing in the chest still, and a
   * hard enough blow shakes it loose once. It grows back between
   * fights rather than between arrivals, the way a tuft does
   */
  createAbility(Abilities.BrokenSeal, (battle) => {
    /** Which holders have already had theirs come loose */
    const spent = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
        const holder = event.target;

        if (
          !event.success ||
          !holder.alive ||
          spent.has(holder) ||
          !holder.hasAbility(Abilities.BrokenSeal) ||
          holder.health >= holder.checkStat(Stats.HP, 0) * BROKEN_SEAL_THRESHOLD
        ) {
          return;
        }

        spent.add(holder);
        holder.triggerAbility(Abilities.BrokenSeal);

        const cause = {
          type: EffectType.Ability,
          ability: Abilities.BrokenSeal,
          unit: holder,
        } as const;

        holder.addStage(Stages.Attack, BROKEN_SEAL_ATTACK, cause);
        holder.addStage(Stages.Defense, BROKEN_SEAL_DEFENSE, cause);
      }),

      battle.on(BattleEvents.UnitFaints, EventPriority.Post, (event) => {
        spent.delete(event.source);
      }),
    ]);
  }),
];

export default setupAbilities;
