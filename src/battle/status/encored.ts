import { AttackPriority, EventPriority } from '../../core/event-emitter';
import type { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import type Unit from '../unit';
import createTimedStatus from './__create';

const DURATION = turns(3);

const setupTimer = createTimedStatus(Statuses.Encored, DURATION);

/**
 * What each encored unit is stuck repeating. The move is set by the
 * Encore move itself, so the status stays a plain lock
 */
const locked = new Map<Unit, Moves>();

export function setEncoredMove(unit: Unit, move: Moves): void {
  locked.set(unit, move);
}

export function getEncoredMove(unit: Unit): Moves | undefined {
  return unit.status[Statuses.Encored] == null ? undefined : locked.get(unit);
}

/**
 * Encored: the unit can pick nothing but the move it last used
 * https://bulbapedia.bulbagarden.net/wiki/Encore_(move)
 */
export default function setupEncoredStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
    const move = getEncoredMove(event.source);

    if (event.usable && move != null && event.move !== move) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Encored) {
      locked.delete(event.source);
    }
  });
}
