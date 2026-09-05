import { EventPriority } from '../../../core/event-emitter';
import type Battle from '../../core';
import { BattleEvents, MoveTargetType } from '../../events';
import type Unit from '../../unit';
import { getCastTime } from './timing';

/** Holding a move down, step by step, until it is let go or broken */
function isChannelingTargetUnit(caster: Unit, target: Unit): boolean {
  return (
    !!caster.channeling &&
    caster.channeling.target.type === MoveTargetType.Unit &&
    caster.channeling.target.unit === target
  );
}

export default function setupChannelingMechanics(battle: Battle): void {
  const queue = new Set<Unit>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, (event) => {
    for (const unit of queue) {
      // advance timer
      if (unit.channeling) {
        unit.updateChannel({
          time: {
            duration: unit.channeling.time.duration,
            progress: unit.channeling.time.progress + event.duration,
          },
        });
      } else {
        unit.stopChannel();
      }
    }
  });

  timer.stop();

  battle.on(BattleEvents.CheckUnitCanChannel, EventPriority.Exact, (event) => {
    if (event.success) {
      event.success =
        // Caster must be alive
        event.source.alive &&
        // The wind-up it continues is already over: a channel is
        // started from finishCast or finishChannel, both of which
        // clear the phase they end before opening the next one
        !(event.source.casting ?? event.source.channeling) &&
        // Move must not be disabled. Cooldown is deliberately not
        // consulted: the cooldown of this very move started when the
        // cast finished, and the channel is the rest of that same use
        !event.source.moves[event.move]?.disabled;

      // If the move target is a unit, make sure it is still alive
      if (event.target.type === MoveTargetType.Unit) {
        event.success = event.success && event.target.unit.alive;
      }
    }
  });

  /**
   * A channelled step runs as long as the wind-up that opened it. It
   * is the engine's stand-in for a turn, so a two-step move spends one
   * hidden underground or gathering light, and a rampage swings again
   * at the pace it swung the first time. Moves that want longer say so
   * on top of it — Bide doubles it
   */
  battle.on(BattleEvents.CheckUnitMoveChannelTime, EventPriority.Exact, (event) => {
    event.duration = getCastTime(event.source.checkMovePriority(event.move, event.target));
  });

  battle.on(BattleEvents.UnitChannel, EventPriority.Exact, (event) => {
    const castTime = event.source.checkMoveChannelTime(event.move, event.target);

    event.source.channeling = {
      target: event.target,
      time: {
        progress: 0,
        duration: castTime,
      },
      move: event.move,
      steps: event.steps,
    };

    // Add new entry for the tick updates
    queue.add(event.source);

    if (queue.size === 1) {
      timer.start();
    }
  });

  battle.on(BattleEvents.UnitUpdateChannel, EventPriority.Exact, (event) => {
    if (event.source.channeling) {
      event.source.channeling = {
        ...event.source.channeling,
        ...event.data,
      };

      if (event.source.channeling.time.progress >= event.source.channeling.time.duration) {
        event.source.finishChannel();
      }
    }
  });

  battle.on(BattleEvents.UnitStopChannel, EventPriority.Exact, (event) => {
    event.source.channeling = undefined;
    queue.delete(event.source);

    if (queue.size === 0) {
      timer.stop();
    }
  });

  battle.on(BattleEvents.UnitFinishChannel, EventPriority.Exact, (event) => {
    const channeling = event.source.channeling;
    if (channeling) {
      // Stop channeling
      event.source.stopChannel();

      // Trigger move
      event.source.triggerMove(channeling.move, channeling.target, channeling.steps);

      // Recast move if step is more than 1
      if (channeling.steps > 0) {
        event.source.channel(channeling.move, channeling.target, channeling.steps - 1);
      }
    }
  });

  battle.on(BattleEvents.UnitSwitch, EventPriority.Exact, (event) => {
    if (event.source === event.target) {
      // Look up all casting units and stop those whose current target
      // is the switching unit
      for (const unit of queue) {
        if (
          isChannelingTargetUnit(unit, event.source) ||
          isChannelingTargetUnit(unit, event.target)
        ) {
          unit.stopChannel();
        }
      }
    } else {
      // Otherwise, update the channeling target
      for (const unit of queue) {
        if (isChannelingTargetUnit(unit, event.source)) {
          unit.updateChannel({
            target: {
              type: MoveTargetType.Unit,
              unit: event.target,
            },
          });
          // TODO should this swap targets?
        } else if (isChannelingTargetUnit(unit, event.target)) {
          unit.updateChannel({
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
    // look up all channeling units whose current target is this unit.
    for (const unit of queue) {
      if (isChannelingTargetUnit(unit, event.source)) {
        unit.stopChannel();
      }
    }
  });

  battle.on(BattleEvents.UnitInterrupt, EventPriority.Exact, (event) => {
    if (event.source.channeling) {
      event.source.stopChannel();
    }
  });
}
