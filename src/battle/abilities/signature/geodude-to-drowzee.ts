import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { MoveCategories } from '../../../data/ids/moves';
import { BattleEvents } from '../../events';
import { createAbility } from '../__create';

/** What rock all the way through is worth, each way */
export const SOLID_CORE_PHYSICAL_SCALE = 0.7;
export const SOLID_CORE_SPECIAL_SCALE = 1.3;

const geodudeToDrowzee = [
  // Geodude: rock the whole way in, with the hole that implies. Read
  // off the attacker's own stat, so it answers the blow rather than the
  // type
  createAbility(Abilities.SolidCore, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const parent = event.parent;

      if (
        event.unit !== parent.source ||
        (event.stat !== Stats.Attack && event.stat !== Stats.SpecialAttack) ||
        !parent.target.hasAbility(Abilities.SolidCore)
      ) {
        return;
      }

      if (parent.category === MoveCategories.Physical) {
        event.value *= SOLID_CORE_PHYSICAL_SCALE;
      } else if (parent.category === MoveCategories.Special) {
        event.value *= SOLID_CORE_SPECIAL_SCALE;
      }
    }),
  ),
];

export default geodudeToDrowzee;
