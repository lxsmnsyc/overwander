import { EventPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { MAJOR_STATUS_CONDITIONS } from '../status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Unit from '../unit';

/**
 * How many of the party pile in: everybody still standing and in good
 * health, the user included. A pokemon carrying a burn or a paralysis
 * stays out of it, which is what the mainline asks of them
 */
export function beatUpStrikes(source: Unit): number {
  let joining = 0;

  for (const unit of source.team.units) {
    if (!unit.alive) {
      continue;
    }

    let afflicted = false;

    for (const status of MAJOR_STATUS_CONDITIONS) {
      if (unit.status[status] != null) {
        afflicted = true;
      }
    }

    if (!afflicted) {
      joining += 1;
    }
  }
  return Math.max(1, joining);
}

/**
 * Beat Up strikes once per party member. The strikes themselves are
 * the shared multi-hit group's, which reads the count from here
 * https://bulbapedia.bulbagarden.net/wiki/Beat_Up_(move)
 */
export default function setupBeatUp(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMoveHits, EventPriority.Post, (event) => {
    if (event.move === Moves.BeatUp) {
      event.hits = beatUpStrikes(event.source);
    }
  });
}
