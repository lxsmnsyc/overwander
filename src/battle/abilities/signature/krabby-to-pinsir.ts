import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import Abilities from '../../../data/ids/abilities';
import { BattleEvents } from '../../events';
import { createAbility } from '../__create';
import { isPhysicalMove } from './__create';

/** What a claw with strength behind it is worth */
export const HEAVY_PINCER_SCALE = 1.45;

/** The share of health the claw needs to close properly */
export const HEAVY_PINCER_THRESHOLD = 1 / 2;

const krabbyToPinsir = [
  // Krabby: the claw is only worth anything while there is strength
  // behind it, so the line is front-loaded on purpose
  createAbility(Abilities.HeavyPincer, (battle) =>
    battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
      const source = event.source;

      if (
        event.power != null &&
        isPhysicalMove(event.move) &&
        source.hasAbility(Abilities.HeavyPincer) &&
        source.health >= source.checkStat(Stats.HP, 0) * HEAVY_PINCER_THRESHOLD
      ) {
        event.power *= HEAVY_PINCER_SCALE;
      }
    }),
  ),
];

export default krabbyToPinsir;
