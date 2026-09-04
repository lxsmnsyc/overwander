import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Weathers } from '../../data/ids/status';
import { MOVE_WEATHERS } from '../../data/moves/weather';
import type Battle from '../core';
import { BattleEvents } from '../events';
import turns from '../turn';
import type Team from '../team';
import { isPrimalWeather } from '../utils';

/**
 * The weather moves: a move whose whole effect is what the sky does
 * afterwards. The change goes through the caster, since how far it
 * reaches is the caster's business — see `UnitSetWeather`.
 *
 * The clock lives here rather than with the weather mechanics, because
 * weather is indefinite unless somebody called it up: only a sky a
 * move put there runs out again. A Drizzle reaches the same clock by
 * casting the move rather than setting the weather itself.
 */

/**
 * How long a called-up sky stays out: a screen's ten seconds, since
 * the mainline gives both five turns. A weather rock lengthens it
 */
export const WEATHER_DURATION = turns(5);

export default function setupWeatherMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, AttackPriority.Exact, (event) => {
    const weather = MOVE_WEATHERS.get(event.move);

    // Explicit null check: the first Weathers enum member is 0
    if (weather == null || isPrimalWeather(event.source.checkWeather())) {
      return;
    }

    // Resolved on the caster, who is the one holding any rock
    event.source.setWeather(weather, event.source.checkWeatherDuration(weather, WEATHER_DURATION));
  });

  /**
   * How long each sky has left. Weather set with no duration is absent
   * from here and stays out until something else changes it
   */
  const expiring = new Map<Team | Battle, number>();

  const clock = battle.on(BattleEvents.Tick, EventPriority.Post, (event) => {
    for (const [holder, remaining] of [...expiring]) {
      const left = remaining - event.duration;

      if (left > 0) {
        expiring.set(holder, left);
        continue;
      }

      expiring.delete(holder);
      // No duration: an empty sky has nothing left to run out
      holder.setWeather(Weathers.None);
    }

    if (expiring.size === 0) {
      clock.stop();
    }
  });

  clock.stop();

  function hold(holder: Team | Battle, weather: Weathers, duration: number): void {
    if (weather === Weathers.None || duration <= 0) {
      expiring.delete(holder);
      return;
    }

    expiring.set(holder, duration);
    clock.start();
  }

  // A sky handed a duration is on a clock; one handed none is not
  battle.on(BattleEvents.SetWeather, EventPriority.Post, (event) => {
    hold(battle, event.weather, event.duration);
  });

  battle.on(BattleEvents.TeamSetWeather, EventPriority.Post, (event) => {
    hold(event.team, event.weather, event.duration);
  });

  // The same two refusals the effect above makes: a sky already out
  // is unchanged by being called up, and a primal one answers to
  // nobody. Told to the AI before it spends the cast rather than after
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const weather = MOVE_WEATHERS.get(event.move);

    if (!event.usable || weather == null) {
      return;
    }

    const sky = event.source.checkWeather();

    if (sky === weather || isPrimalWeather(sky)) {
      event.usable = false;
    }
  });
}
