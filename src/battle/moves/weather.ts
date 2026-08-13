import { AttackPriority, EventPriority } from '../../core/event-emitter';
import { Weathers } from '../../data/ids/status';
import { MOVE_WEATHERS } from '../../data/moves/weather';
import type Battle from '../core';
import { BattleEvents } from '../events';
import type Team from '../team';
import { isPrimalWeather } from '../utils';

/**
 * The weather moves: a move whose whole effect is what the sky does
 * afterwards.
 *
 * The change goes through the caster rather than through the battle,
 * because how far it reaches is the caster's business — see
 * `UnitSetWeather`, which sends a raid's weather to the caster's own
 * team and a PvP fight's to the whole field.
 *
 * **The clock lives here rather than with the weather mechanics**, and
 * that is the point of the distinction: weather is indefinite unless
 * somebody called it up. What the overworld hands a battle stays for
 * the whole battle, a primal sky cannot be waited out, and only a sky
 * a move put there runs out again. A Drizzle and a Drought reach the
 * same clock, because they cast these moves rather than setting the
 * weather themselves.
 */

/**
 * How long a called-up sky stays out.
 *
 * The mainline gives it five turns, which is what it gives a screen,
 * so it is the screen's ten seconds here as well. A weather rock
 * lengthens it — see the gear — and the resolution happens on the
 * caster, since the rock is held by whoever is calling the weather up
 */
export const WEATHER_DURATION = 10_000;

export default function setupWeatherMoves(battle: Battle): void {
  battle.on(BattleEvents.UnitTriggerMoveEffect, EventPriority.Exact, (event) => {
    const weather = MOVE_WEATHERS.get(event.move);

    // Explicit null check: the first Weathers enum member is 0
    if (weather == null || isPrimalWeather(event.source.checkWeather())) {
      return;
    }

    event.source.setWeather(
      weather,
      // Resolved on the caster, because what lengthens the weather —
      // a Damp Rock, a Heat Rock — is held by the one calling it up
      event.source.checkWeatherDuration(weather, WEATHER_DURATION),
    );
  });

  /**
   * How long each sky has left. Weather set with no duration — what
   * the overworld handed the battle, a primal one, and the clearing
   * that follows one running out — is simply absent from here, so it
   * stays out until something else changes it
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
      // Clearing carries no duration of its own: an empty sky has
      // nothing left to run out
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

  // Whatever weather lands, wherever it landed: a sky handed a
  // duration is one on a clock, and a sky handed none is not
  battle.on(BattleEvents.SetWeather, EventPriority.Post, (event) => {
    hold(battle, event.weather, event.duration);
  });

  battle.on(BattleEvents.TeamSetWeather, EventPriority.Post, (event) => {
    hold(event.team, event.weather, event.duration);
  });

  /**
   * Calling up weather that is already out changes nothing, so the AI
   * is told before it spends a cast on it rather than after
   */
  battle.on(BattleEvents.CheckUnitAIMoveUsable, AttackPriority.Exact, (event) => {
    const weather = MOVE_WEATHERS.get(event.move);

    if (event.usable && weather != null && event.source.checkWeather() === weather) {
      event.usable = false;
    }
  });
}
