import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents, EffectType } from '../../events';
import { MAJOR_STATUS_CONDITIONS } from '../../status';
import { createAbility } from '../__create';

/** What one status landed is worth to the fungus */
export const FUNGAL_BLOOM_FRACTION = 1 / 8;

const parasToTentacool = [
  // Paras: the mushroom is what fights, and what it puts on somebody
  // else is what feeds it
  createAbility(Abilities.FungalBloom, (battle) =>
    battle.on(BattleEvents.UnitAddStatus, EventPriority.Post, (event) => {
      const cause = event.cause;

      if (
        !MAJOR_STATUS_CONDITIONS.has(event.status) ||
        cause.type === EffectType.None ||
        cause.type === EffectType.Weather
      ) {
        return;
      }

      const holder = cause.unit;

      if (
        holder === event.source ||
        holder.team.alliance === event.source.team.alliance ||
        !holder.hasAbility(Abilities.FungalBloom)
      ) {
        return;
      }

      holder.triggerAbility(Abilities.FungalBloom);

      holder.heal(
        { type: EffectType.Ability, ability: Abilities.FungalBloom, unit: holder },
        holder,
        holder.checkStat(Stats.HP, 0) * FUNGAL_BLOOM_FRACTION,
        0,
      );
    }),
  ),
];

export default parasToTentacool;
