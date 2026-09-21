import { AttackPriority, EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { DamageFlags } from '../../../data/ids/moves';
import { BattleEvents, EffectType, MoveTargetType } from '../../events';
import type Unit from '../../unit';
import { createAbility } from '../__create';

/**
 * What the charged cave holds: the spider that drinks the current, the
 * pod that covers whoever stands behind it and the gears.
 */

/** What a bolt landing anywhere is worth to something feeding on it */
export const STATIC_FEED_SHARE = 1 / 8;

/** What the spikes take off a contact move aimed at a teammate */
export const THORN_CURTAIN_SCALE = 0.85;

/** What a meshed pair is worth, coming and going */
export const MESHING_TAKEN = 0.9;
export const MESHING_DEALT = 1.2;

const setupAbilities = [
  /**
   * Static Feed: it lives off whatever current is going, whoever
   * threw it and whoever it was aimed at
   */
  createAbility(Abilities.StaticFeed, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const cause = event.cause;

      if (
        !event.success ||
        event.flags & DamageFlags.Indirect ||
        cause.type !== EffectType.Move ||
        cause.unit.checkMoveType(cause.move, { type: MoveTargetType.Unit, unit: event.target }) !==
          Types.Electric
      ) {
        return;
      }

      for (const unit of battle.units()) {
        const maxHealth = unit.checkStat(Stats.HP, 0);

        if (unit.alive && unit.health < maxHealth && unit.hasAbility(Abilities.StaticFeed)) {
          unit.triggerAbility(Abilities.StaticFeed);
          unit.heal(
            { type: EffectType.Ability, ability: Abilities.StaticFeed, unit },
            unit,
            maxHealth * STATIC_FEED_SHARE,
            0,
          );
        }
      }
    }),
  ),

  /**
   * Thorn Curtain: the spikes are between whoever reached in and the
   * rest of the team, so only a touch is answered and only for the
   * ones standing behind them
   */
  createAbility(Abilities.ThornCurtain, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      if (
        !parent.source.checkMoveContact(parent.move, { type: MoveTargetType.Unit, unit: target })
      ) {
        return;
      }

      for (const mate of target.team.units) {
        if (mate !== target && mate.alive && mate.hasAbility(Abilities.ThornCurtain)) {
          event.value *= THORN_CURTAIN_SCALE;
          return;
        }
      }
    }),
  ),

  /**
   * Meshing: a gear is nothing on its own, so both halves of this ask
   * whether anything is standing beside it to turn against
   */
  createAbility(Abilities.Meshing, (battle) => {
    function meshed(unit: Unit): boolean {
      for (const mate of unit.team.units) {
        if (mate !== unit && mate.alive) {
          return true;
        }
      }

      return false;
    }

    return battle.on(BattleEvents.UnitAttackResolveDamage, EventPriority.Post, (event) => {
      const parent = event.parent;
      const target = parent.target;

      for (const mate of target.team.units) {
        if (mate.alive && mate.hasAbility(Abilities.Meshing) && meshed(mate)) {
          event.value *= MESHING_TAKEN;
          break;
        }
      }

      if (parent.source.hasAbility(Abilities.Meshing) && meshed(parent.source)) {
        event.value *= MESHING_DEALT;
      }
    });
  }),
];

export default setupAbilities;
