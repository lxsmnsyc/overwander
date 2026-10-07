import { AttackPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import type Abilities from '../../../data/ids/abilities';
import { DamageFlags, MoveTargetPriorities } from '../../../data/ids/moves';
import { checkTeamUnit } from '../../ai/rating';
import type Battle from '../../core';
import { BattleEvents, EffectType } from '../../events';
import { createAbility } from './create';

/** The share of its HP a retreating holder bolts below */
export const RETREAT_THRESHOLD = 1 / 2;

/**
 * Meta ability for the ones that bolt once a hit takes them under half
 * their HP (Wimp Out, Emergency Exit), sending in the strongest teammate
 * https://bulbapedia.bulbagarden.net/wiki/Wimp_Out_(Ability)
 */
export function createRetreatAbility(ability: Abilities): (battle: Battle) => void {
  return createAbility(ability, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const unit = event.target;
      const line = unit.checkStat(Stats.HP, 0) * RETREAT_THRESHOLD;

      if (
        !event.success ||
        !unit.alive ||
        event.flags & DamageFlags.Cost ||
        unit.health >= line ||
        unit.health + event.value < line ||
        !unit.hasAbility(ability)
      ) {
        return;
      }

      const replacement = checkTeamUnit(battle, unit.team, MoveTargetPriorities.Strongest, unit);

      if (replacement == null || !unit.checkEscape() || !replacement.checkEscape()) {
        return;
      }
      unit.triggerAbility(ability);
      unit.forceSwitch(replacement, { type: EffectType.Ability, ability, unit });
    }),
  );
}
