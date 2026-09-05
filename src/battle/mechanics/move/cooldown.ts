import { EventPriority } from '../../../core/event-emitter';
import { Stats } from '../../../data/constants/stats';
import { PP_COOLDOWN_BASIS, getSpeedCooldownFactor } from '../../../data/moves';
import type Battle from '../../core';
import type { MoveState } from '../../events';
import { BattleEvents } from '../../events';

/** What a spent move waits out before it can be thrown again */
export default function setupCooldownMechanics(battle: Battle): void {
  const queue = new Set<MoveState>();

  const timer = battle.on(BattleEvents.Tick, EventPriority.Exact, (event) => {
    for (const state of queue) {
      // advance timer
      if (state.cooldown) {
        state.source.updateCooldown(state.move, {
          progress: state.cooldown.progress + event.duration,
        });
      } else {
        state.source.finishCooldown(state.move);
      }
    }
  });

  timer.stop();

  // The wait a move's own PP asks for, before anybody argues with it
  battle.on(BattleEvents.CheckUnitMoveCooldown, EventPriority.Exact, (event) => {
    event.duration =
      (PP_COOLDOWN_BASIS / event.source.checkMovePP(event.move, event.target)) * 1000;
  });

  /**
   * What Speed takes off it. This is the whole of Speed's job in a
   * real-time fight: there is no turn order to win, so a fast pokemon
   * gets its moves back sooner instead. Read with stages in, so an
   * Agility is worth something
   */
  battle.on(BattleEvents.CheckUnitMoveCooldown, EventPriority.Post, (event) => {
    event.duration *= getSpeedCooldownFactor(event.source.resolveStat(Stats.Speed, 0));
  });

  battle.on(BattleEvents.UnitStartCooldown, EventPriority.Exact, (event) => {
    const data = event.source.moves[event.move];
    if (data) {
      data.cooldown = {
        progress: 0,
        duration: event.source.checkMoveCooldown(event.move, event.target),
      };

      queue.add(data);

      if (queue.size === 1) {
        timer.start();
      }
    }
  });

  battle.on(BattleEvents.UnitFinishCooldown, EventPriority.Exact, (event) => {
    const data = event.source.moves[event.move];
    if (data) {
      data.cooldown = undefined;
      queue.delete(data);
      if (queue.size === 0) {
        timer.stop();
      }
    }
  });

  battle.on(BattleEvents.UnitUpdateCooldown, EventPriority.Exact, (event) => {
    const state = event.source.moves[event.move];
    if (state?.cooldown) {
      state.cooldown = {
        ...state.cooldown,
        ...event.data,
      };
      if (state.cooldown.progress >= state.cooldown.duration) {
        event.source.finishCooldown(event.move);
      }
    }
  });
}
