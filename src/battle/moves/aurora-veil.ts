import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { TeamStatuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import { isWeatherHail } from '../utils';

/**
 * Aurora Veil only goes up in hail or snow. The screen itself is a team
 * status beside Reflect and Light Screen
 * https://bulbapedia.bulbagarden.net/wiki/Aurora_Veil_(move)
 */
export default function setupAuroraVeil(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && event.move === Moves.AuroraVeil && !isWeatherHail(event.source)) {
      event.success = false;
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (event.usable && event.move === Moves.AuroraVeil) {
      event.usable =
        isWeatherHail(event.source) && event.source.team.status[TeamStatuses.AuroraVeil] == null;
    }
  });
}
