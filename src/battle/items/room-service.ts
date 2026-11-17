import { EventPriority } from '../../core/event-emitter';
import { Stages } from '../../data/constants/stats';
import { Items } from '../../data/ids/items';
import { BattleEvents } from '../events';
import { createHeldItem, spendItem } from './__create';

/**
 * What a Room Service takes off its holder's Speed. One stage, the
 * mainline's number, and the same drop a Speed-lowering move makes
 */
export const ROOM_SERVICE_STAGES = 1;

/**
 * Room Service: held against a Trick Room going up, and gone once it
 * has. The room makes the slow side quick, so the holder gives up its
 * own Speed to make the most of it. It answers on whoever carries one,
 * on either side, since the room covers the whole field
 */
export default createHeldItem(Items.RoomService, (battle) =>
  battle.on(BattleEvents.StartTrickRoom, EventPriority.Post, () => {
    for (const unit of battle.units()) {
      if (!unit.alive) {
        continue;
      }

      // Spent first, so a drop that loops back cannot spend it twice
      const cause = spendItem(unit, Items.RoomService);

      if (cause) {
        unit.addStage(Stages.Speed, -ROOM_SERVICE_STAGES, cause);
      }
    }
  }),
);
