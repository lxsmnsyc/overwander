import { AttackPriority, EventPriority } from '../../core/event-emitter';
import type { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType } from '../events';
import turns from '../turn';
import type Unit from '../unit';
import createTimedStatus from './__create';

const DURATION = turns(5);

const setupTimer = createTimedStatus(Statuses.Imprisoned, DURATION);

/** What each imprisoned unit is shut out of */
const sealed = new Map<Unit, Set<Moves>>();

export function setImprisonedMoves(unit: Unit, moves: Iterable<Moves>): void {
  sealed.set(unit, new Set(moves));
}

function isSealed(unit: Unit, move: Moves): boolean {
  return unit.status[Statuses.Imprisoned] != null && sealed.get(unit)?.has(move) === true;
}

/**
 * Imprisoned: the moves the imprisoner knows are the moves this unit
 * cannot reach. What it shares is decided when the seal lands, so a
 * move learned afterwards is still its own
 * https://bulbapedia.bulbagarden.net/wiki/Imprison_(move)
 */
export default function setupImprisonedStatus(battle: Battle): void {
  setupTimer(battle);

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Post, (event) => {
    if (event.success && isSealed(event.source, event.move)) {
      event.success = false;

      event.source.triggerStatus(Statuses.Imprisoned, { type: EffectType.None });
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Post, (event) => {
    if (event.usable && isSealed(event.source, event.move)) {
      event.usable = false;
    }
  });

  battle.on(BattleEvents.UnitRemoveStatus, EventPriority.Post, (event) => {
    if (event.status === Statuses.Imprisoned) {
      sealed.delete(event.source);
    }
  });
}
