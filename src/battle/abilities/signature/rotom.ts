import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { Types } from '../../../data/constants/types';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents } from '../../events';
import { createAbility } from '../__create';

/** What the machine it is plugged into is worth. */
export const APPLIANCE_SCALE = 1.3;

const setupAbilities = [
  /**
   * One rule that means six things: whatever the shape gives it
   * besides the current it is made of hits harder. Ghost as it is
   * met, then fire, water, ice, wind or grass. Read off the unit's
   * own types rather than its species, so anything that repaints it
   * repaints what it is good at
   */
  createAbility(Abilities.Appliance, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveStat, EventPriority.Post, (event) => {
      const source = event.parent.source;
      const type = event.parent.type;

      if (
        type !== Types.Electric &&
        event.unit === source &&
        (event.stat === Stats.Attack || event.stat === Stats.SpecialAttack) &&
        source.types.has(type) &&
        source.hasAbility(Abilities.Appliance)
      ) {
        event.value *= APPLIANCE_SCALE;
      }
    }),
  ),
];

export default setupAbilities;
