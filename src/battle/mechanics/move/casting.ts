import { EventPriority } from '../../../core/event-emitter';
import { Moves } from '../../../data/ids/moves';
import type Battle from '../../core';
import { BattleEvents, MoveTargetType } from '../../events';
import type Unit from '../../unit';
import { getCastTime } from './timing';

/** Winding a move up, and everything that can stop it */
function isCastingTargetUnit(caster: Unit, target: Unit): boolean {
  return (
    !!caster.casting &&
    caster.casting.target.type === MoveTargetType.Unit &&
    caster.casting.target.unit === target
  );
}

function canUnitCastMove(caster: Unit, move: Moves): boolean {
  // Struggle is nobody's move. It is what is thrown when everything
  // that *is* somebody's move has been shut off, so it cannot be asked
  // for from the move set the way the rest are — it would be refused
  // for not being in there, which is the only condition it is ever
  // used under.
  //
  // Attack is **not** exempt, though it is nobody's move either: every
  // unit is fielded carrying it, so it is in the set like any other
  // and it cools like any other. Waving it through here would be a
  // pokemon swinging with no cooldown at all
  if (move === Moves.Struggle) {
    return true;
  }

  const data = caster.moves[move];
  if (data) {
    return !(data.disabled || data.cooldown);
  }
  return false;
}

export default function setupCastingMechanics(battle: Battle): void {
  const queue = new Set<Unit>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, (event) => {
    for (const unit of queue) {
      // advance timer
      if (unit.casting) {
        unit.updateCast({
          time: {
            duration: unit.casting.time.duration,
            progress: unit.casting.time.progress + event.duration,
          },
        });
      } else {
        unit.stopCast();
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitCanCast, EventPriority.Exact, (event) => {
    if (event.success) {
      event.success =
        // Caster must be alive
        event.source.alive &&
        // Caster must not be casting/channeling
        !(event.source.casting ?? event.source.channeling) &&
        // Move must not be disabled or in cooldown
        canUnitCastMove(event.source, event.move);

      // If the move target is a unit, make sure it is still alive
      if (event.target.type === MoveTargetType.Unit) {
        event.success = event.success && event.target.unit.alive;
      }
    }
  });

  battle.on(BattleEvents.CheckUnitMoveCastTime, EventPriority.Exact, (event) => {
    event.duration = getCastTime(event.source.checkMovePriority(event.move, event.target));
  });

  battle.on(BattleEvents.UnitCast, EventPriority.Exact, (event) => {
    const castTime = event.source.checkMoveCastTime(event.move, event.target);

    event.source.casting = {
      target: event.target,
      time: {
        progress: 0,
        duration: castTime,
      },
      move: event.move,
    };

    // Add new entry for the tick updates
    queue.add(event.source);

    if (queue.size === 1) {
      timer.start();
    }
  });

  battle.on(BattleEvents.UnitUpdateCast, EventPriority.Exact, (event) => {
    if (event.source.casting) {
      event.source.casting = {
        ...event.source.casting,
        ...event.data,
      };

      if (event.source.casting.time.progress >= event.source.casting.time.duration) {
        event.source.finishCast();
      }
    }
  });

  battle.on(BattleEvents.UnitStopCast, EventPriority.Exact, (event) => {
    event.source.casting = undefined;
    queue.delete(event.source);

    if (queue.size === 0) {
      timer.stop();
    }
  });

  battle.on(BattleEvents.UnitFinishCast, EventPriority.Exact, (event) => {
    const casting = event.source.casting;
    if (casting) {
      event.source.stopCast();

      event.source.startCooldown(casting.move, casting.target);

      const steps = event.source.checkMoveSteps(casting.move, casting.target);

      // Trigger first step
      event.source.triggerMove(casting.move, casting.target, steps);

      if (steps > 0) {
        // Channel next effect
        event.source.channel(casting.move, casting.target, steps - 1);
      }
    }
  });

  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, (event) => {
    if (event.source === event.target) {
      // Look up all casting units and stop those whose current target
      // is the switching unit
      for (const unit of queue) {
        if (isCastingTargetUnit(unit, event.source) || isCastingTargetUnit(unit, event.target)) {
          unit.stopCast();
        }
      }
    } else {
      // Otherwise, update the casting target
      for (const unit of queue) {
        if (isCastingTargetUnit(unit, event.source)) {
          unit.updateCast({
            target: {
              type: MoveTargetType.Unit,
              unit: event.target,
            },
          });
          // TODO should this swap targets?
        } else if (isCastingTargetUnit(unit, event.target)) {
          unit.updateCast({
            target: {
              type: MoveTargetType.Unit,
              unit: event.source,
            },
          });
        }
      }
    }
  });

  battle.on(BattleEvents.UnitFaints, EventPriority.Exact, (event) => {
    // look up all casting units whose current target is this unit.
    for (const unit of queue) {
      if (isCastingTargetUnit(unit, event.source)) {
        unit.stopCast();
      }
    }
  });

  battle.on(BattleEvents.UnitInterrupt, EventPriority.Exact, (event) => {
    if (event.source.casting) {
      event.source.stopCast();
    }
  });
}
