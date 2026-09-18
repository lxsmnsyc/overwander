import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stages, Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { Statuses } from '../../../data/ids/status';
import { Types } from '../../../data/constants/types';
import { isDanceMove } from '../../../data/moves/dances';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import type Unit from '../../unit';
import { createAbility } from '../__create';

/**
 * What Driftveil holds: the two schools, the birds, the snow and the
 * one that carries everybody home.
 */

/** What each bleeding enemy is worth to a school, and where it stops */
export const BLOOD_WATER_STEP = 0.15;
export const BLOOD_WATER_MAX = 1.45;
export const BLOOD_WATER_THRESHOLD = 1 / 2;

/** What a dance is worth on top of itself */
export const SWAN_DANCE_STAGES = 1;

/** What every heal on the team is worth while it stands */
export const TIDE_POOL_SCALE = 1.3;

const setupAbilities = [
  /**
   * Blood Water: a school turns on whatever is already failing, and
   * counts every one of them rather than the one it is aimed at
   */
  createAbility(Abilities.BloodWater, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const source = event.parent.source;

      if (!source.hasAbility(Abilities.BloodWater)) {
        return;
      }

      let bleeding = 0;

      for (const enemy of battle.units(source.team.alliance)) {
        if (enemy.alive && enemy.health < enemy.checkStat(Stats.HP, 0) * BLOOD_WATER_THRESHOLD) {
          bleeding += 1;
        }
      }

      if (bleeding > 0) {
        event.value *= Math.min(BLOOD_WATER_MAX, 1 + bleeding * BLOOD_WATER_STEP);
      }
    }),
  ),

  /**
   * Swan Dance: whatever the dance was for, it also leaves the dancer
   * moving faster. Read off the move rather than the stage, so a dance
   * that raises nothing still counts
   */
  createAbility(Abilities.SwanDance, (battle) =>
    battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Post, (event) => {
      const source = event.source;

      if (!isDanceMove(event.move) || !source.hasAbility(Abilities.SwanDance)) {
        return;
      }
      source.triggerAbility(Abilities.SwanDance);
      source.addStage(Stages.Speed, SWAN_DANCE_STAGES, {
        type: EffectType.Ability,
        ability: Abilities.SwanDance,
        unit: source,
      });
    }),
  ),

  /**
   * Flash Freeze: the first cold it lands each fight takes hold for
   * certain, whatever the move's own odds were
   */
  createAbility(Abilities.FlashFreeze, (battle) => {
    /** Who has already spent theirs */
    const spent = new Set<Unit>();

    return new MergedLifecycle([
      battle.on(BattleEvents.UnitAttack, AttackPriority.Post, (event) => {
        const source = event.source;
        const target = event.target;

        if (
          !event.success ||
          spent.has(source) ||
          !target.alive ||
          target.status[Statuses.Frozen] != null ||
          !source.hasAbility(Abilities.FlashFreeze) ||
          source.checkMoveType(event.move, { type: MoveTargetType.Unit, unit: target }) !==
            Types.Ice
        ) {
          return;
        }

        spent.add(source);
        source.triggerAbility(Abilities.FlashFreeze);
        target.addStatus(Statuses.Frozen, {
          type: EffectType.Ability,
          ability: Abilities.FlashFreeze,
          unit: source,
        });
      }),

      battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
        if (!event.reactivation) {
          spent.delete(event.source);
        }
      }),
    ]);
  }),

  /**
   * Tide Pool: it does not do the healing, it makes the healing worth
   * more, so anything its team is given counts for half again
   */
  createAbility(Abilities.TidePool, (battle) =>
    // Before Exact, which is where the health actually goes back
    battle.on(BattleEvents.UnitHeal, EventPriority.Pre, (event) => {
      const target = event.target;

      for (const mate of target.team.units) {
        if (mate.alive && mate.hasAbility(Abilities.TidePool)) {
          event.value *= TIDE_POOL_SCALE;
          return;
        }
      }
    }),
  ),
];

export default setupAbilities;
