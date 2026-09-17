import { AttackPriority } from '../../../core/event-emitter';
import { Stages } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { Statuses } from '../../../data/ids/status';
import { BattleEvents } from '../../events';
import { createAbility, getAbilityHolders } from '../__create';
import { createSealedAbility } from './__create';

/** What is already burning is worth, with the dome standing over it. */
export const LAVADOME_SCALE = 1.25;

/** The master golem deals its own damage whole while it is sealed. */
const TITAN_SEALED_SCALE = 1;

const setupAbilities = [
  /**
   * Heatran hangs over the far side and keeps it at the temperature
   * it lit them at: a burn is worth more than its chip while the dome
   * is up, whoever the blow came from. Nothing is written to the
   * enemy, so it cools the moment Heatran leaves
   */
  createAbility(Abilities.Lavadome, (battle) =>
    battle.on(BattleEvents.UnitDamage, AttackPriority.Post, (event) => {
      const target = event.target;

      if (event.value <= 0 || target.status[Statuses.Burned] == null) {
        return;
      }

      for (const dome of getAbilityHolders(battle, Abilities.Lavadome)) {
        if (
          dome.alive &&
          dome.team.alliance !== target.team.alliance &&
          dome.hasAbility(Abilities.Lavadome)
        ) {
          event.value *= LAVADOME_SCALE;
          return;
        }
      }
    }),
  ),

  // The fourth seal, and the one that shut the other three in
  createSealedAbility(Abilities.TitanSeal, Stages.Attack, TITAN_SEALED_SCALE),
];

export default setupAbilities;
