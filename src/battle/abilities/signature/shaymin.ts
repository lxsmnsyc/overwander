import { EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents } from '../../events';
import { createAbility, getAbilityHolders } from '../__create';

/** The two the flower takes the sting out of. */
const PUREBLOOM_STATUSES = new Set([Statuses.Poisoned, Statuses.BadlyPoisoned]);

const setupAbilities = [
  /**
   * The air Shaymin cleans: poison is still on its team and still
   * running its clock, it just costs them nothing. Asked at the
   * damage check rather than written anywhere, so it lifts the moment
   * Shaymin leaves and two of them never stack
   */
  createAbility(Abilities.Purebloom, (battle) =>
    battle.on(BattleEvents.CheckUnitStatusDamage, EventPriority.Post, (event) => {
      if (event.value <= 0 || !PUREBLOOM_STATUSES.has(event.status)) {
        return;
      }

      for (const flower of getAbilityHolders(battle, Abilities.Purebloom)) {
        if (
          flower.alive &&
          flower.team === event.source.team &&
          flower.hasAbility(Abilities.Purebloom)
        ) {
          event.value = 0;
          return;
        }
      }
    }),
  ),
];

export default setupAbilities;
