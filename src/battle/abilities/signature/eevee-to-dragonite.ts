import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents } from '../../events';
import { createAbility } from '../__create';

/** What the unspent half of a pokemon is worth */
export const LATENT_POTENTIAL_SCALE = 1.3;

/**
 * The five a fight is fought with. HP is left out: it is not a stat a
 * pokemon leans on, it is the room it has to be wrong in
 */
const BATTLE_STATS = [
  Stats.Attack,
  Stats.Defense,
  Stats.SpecialAttack,
  Stats.SpecialDefense,
  Stats.Speed,
];

const eeveeToDragonite = [
  // Eevee: whatever it has least of is what has not been spent yet.
  // Reading the other four means asking for them, so the listener steps
  // aside while it measures
  createAbility(Abilities.LatentPotential, (battle) => {
    let measuring = false;

    return battle.on(BattleEvents.CheckUnitStat, EventPriority.Post, (event) => {
      if (
        measuring ||
        !BATTLE_STATS.includes(event.stat) ||
        !event.source.hasAbility(Abilities.LatentPotential)
      ) {
        return;
      }

      measuring = true;

      let lowest = event.stat;
      let lowestValue = Number.POSITIVE_INFINITY;

      for (const stat of BATTLE_STATS) {
        const value = event.source.checkStat(stat, 0);

        if (value < lowestValue) {
          lowest = stat;
          lowestValue = value;
        }
      }

      measuring = false;

      if (lowest === event.stat) {
        event.value *= LATENT_POTENTIAL_SCALE;
      }
    });
  }),
];

export default eeveeToDragonite;
