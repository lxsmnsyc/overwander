import { AttackPriority } from '../../core/event-emitter';
import { Moves } from '../../data/ids/moves';
import { Statuses } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, EffectType, MoveTargetType } from '../events';
import type Unit from '../unit';

/**
 * The moves that change when somebody else's move goes off.
 *
 * After You and Quash read turn order in the mainline, and a wind-up
 * is the nearest thing here: After You lets a teammate's finish now,
 * Quash sends a target's back to the start. Ally Switch trades places,
 * and whatever was aimed at either of the pair follows the swap
 * https://bulbapedia.bulbagarden.net/wiki/Quash_(move)
 */

/** Whether an enemy is winding up a move at this unit */
function aimedAt(battle: Battle, unit: Unit): boolean {
  for (const other of battle.units()) {
    const casting = other.casting;

    if (
      other.team.alliance !== unit.team.alliance &&
      casting?.target.type === MoveTargetType.Unit &&
      casting.target.unit === unit
    ) {
      return true;
    }
  }
  return false;
}

function canSwap(source: Unit, target: Unit): boolean {
  return (
    target !== source &&
    target.alive &&
    source.status[Statuses.Switching] == null &&
    target.status[Statuses.Switching] == null
  );
}

export default function setupPacingMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    if (event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;
    const fail = (): void => {
      event.source.triggerMoveEffectFailed(event.move, event.target, event.steps);
    };

    if (event.move === Moves.AfterYou || event.move === Moves.Quash) {
      const casting = target.casting;

      if (casting == null || target === event.source) {
        fail();
        return;
      }

      target.updateCast({
        time: {
          ...casting.time,
          progress: event.move === Moves.AfterYou ? casting.time.duration : 0,
        },
      });
      return;
    }

    if (event.move === Moves.AllySwitch) {
      if (!canSwap(event.source, target)) {
        fail();
        return;
      }

      event.source.forceSwitch(target, {
        type: EffectType.Move,
        move: event.move,
        unit: event.source,
      });
    }
  });

  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    if (!event.usable || event.target.type !== MoveTargetType.Unit) {
      return;
    }

    const target = event.target.unit;

    if (event.move === Moves.AfterYou || event.move === Moves.Quash) {
      event.usable = target !== event.source && target.casting != null;
    } else if (event.move === Moves.AllySwitch) {
      // Only worth a cast while something is coming at the user
      event.usable = canSwap(event.source, target) && aimedAt(battle, event.source);
    }
  });
}
