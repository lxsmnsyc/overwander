import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags, Moves } from '../../../data/ids/moves';
import { BattleEvents, EffectType } from '../../events';
import { MergedLifecycle } from '../../lifecycle';
import { unitTarget } from '../../utils';
import { createAbility } from '../__create';
import { firstEnemy } from './__create';

/**
 * What the first cave holds: the ore, the bats of the passages and
 * the diggers.
 */

/** What surviving on 1 HP costs whoever threw the blow */
export const AFTERSHOCK_SHARE = 1 / 4;

/** What a spun-up drill is worth, and what the wind-up costs */
export const TORQUE_SCALE = 1.25;
export const TORQUE_WIND_UP = 1.25;

const setupAbilities = [
  /**
   * Aftershock: the rock holds together and the shock goes back up
   * the arm that hit it. The Sturdy in its own pool is what usually
   * leaves it standing on 1 HP, so the two are one trade
   */
  createAbility(Abilities.Aftershock, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        event.cause.type !== EffectType.Move ||
        event.cause.unit === event.target ||
        event.target.health !== 1 ||
        !event.target.alive ||
        !event.target.hasAbility(Abilities.Aftershock)
      ) {
        return;
      }

      const attacker = event.cause.unit;

      if (!attacker.alive) {
        return;
      }

      event.target.triggerAbility(Abilities.Aftershock);
      event.target.damage(
        { type: EffectType.Ability, ability: Abilities.Aftershock, unit: event.target },
        attacker,
        Math.max(1, Math.floor(attacker.checkStat(Stats.HP, 0) * AFTERSHOCK_SHARE)),
        DamageFlags.Indirect,
      );
    }),
  ),

  /**
   * Heart Mark: the heart its nose leaves is the opening move, so
   * Attract's own rules decide who it works on and for how long
   */
  createAbility(
    Abilities.HeartMark,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.UnitEntersField, EventPriority.Post, (event) => {
          if (!event.reactivation && event.source.hasAbility(Abilities.HeartMark)) {
            event.source.triggerAbility(Abilities.HeartMark);
          }
        }),
        battle.on(BattleEvents.UnitTriggerAbility, EventPriority.Exact, (event) => {
          if (event.ability !== Abilities.HeartMark) {
            return;
          }

          const enemy = firstEnemy(battle, event.source);

          if (enemy) {
            event.source.triggerMove(Moves.Attract, unitTarget(enemy), 0);
          }
        }),
      ]),
  ),

  /**
   * Torque: the drill has to be spun up before it bites, so every
   * move costs a longer wind-up and lands harder for it. Cooldowns
   * are untouched, which leaves Speed saying what it says
   */
  createAbility(
    Abilities.Torque,
    (battle) =>
      new MergedLifecycle([
        battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
          if (event.power != null && event.source.hasAbility(Abilities.Torque)) {
            event.power *= TORQUE_SCALE;
          }
        }),
        battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.Torque)) {
            event.duration *= TORQUE_WIND_UP;
          }
        }),
        battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Post, (event) => {
          if (event.source.hasAbility(Abilities.Torque)) {
            event.duration *= TORQUE_WIND_UP;
          }
        }),
      ]),
  ),
];

export default setupAbilities;
