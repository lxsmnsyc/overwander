import { EventPriority } from '../../../core/event-emitter';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents } from '../../events';
import { createAbility } from '../__create';

const setupAbilities = [
  /**
   * Firstlight: what it throws as the type it is wearing falls the
   * same on everybody. A resistance is read as no resistance, an
   * immunity still holds, and a weakness is still a weakness: it
   * opens doors rather than taking the chart away.
   *
   * Asked once per defending type, so each half of a dual type is
   * lifted on its own
   */
  createAbility(Abilities.Firstlight, (battle) =>
    battle.on(BattleEvents.UnitAttackResolveEffectiveness, EventPriority.Post, (event) => {
      const source = event.parent.source;

      if (
        event.multiplier > 0 &&
        event.multiplier < 1 &&
        source.types.has(event.parent.type) &&
        source.hasAbility(Abilities.Firstlight)
      ) {
        event.multiplier = 1;
      }
    }),
  ),
];

export default setupAbilities;
