import { EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents, EffectType } from '../../events';
import { createAbility, getAbilityHolders } from '../__create';

/**
 * Heart Swap read as theft rather than a trade: whatever the far side
 * talks itself into, the prince of the sea has as well. Nothing is
 * taken off the enemy, so there is no drop for anybody to refuse
 */
const setupAbilities = [
  createAbility(Abilities.Heartcurrent, (battle) =>
    battle.on(BattleEvents.UnitAddStage, EventPriority.Post, (event) => {
      // Gains only, and a copy never answers itself
      if (
        event.value <= 0 ||
        (event.cause.type === EffectType.Ability && event.cause.ability === Abilities.Heartcurrent)
      ) {
        return;
      }

      const gained = event.source;

      for (const holder of getAbilityHolders(battle, Abilities.Heartcurrent)) {
        if (
          holder.alive &&
          holder.team.alliance !== gained.team.alliance &&
          holder.hasAbility(Abilities.Heartcurrent)
        ) {
          holder.triggerAbility(Abilities.Heartcurrent);
          holder.addStage(event.stage, event.value, {
            type: EffectType.Ability,
            ability: Abilities.Heartcurrent,
            unit: holder,
          });
        }
      }
    }),
  ),
];

export default setupAbilities;
