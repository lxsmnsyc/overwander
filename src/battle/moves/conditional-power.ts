import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Statuses, Weathers } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';
import { hasAnyStatus } from '../utils';

/**
 * The moves whose power is decided by the state of the fight rather
 * than by the move: what the user is carrying, what the target is
 * carrying, how much is left of the user, and what the sky is doing.
 *
 * Each is a multiplier over the registered power rather than a figure
 * of its own, so they ride at `Post` where everything else that
 * multiplies power rides
 */

/** What Facade reads: an ailment the user is fighting through */
const FACADE_STATUSES = new Set<Statuses>([
  Statuses.Burned,
  Statuses.Poisoned,
  Statuses.BadlyPoisoned,
  Statuses.Paralyzed,
]);

/** What a Weather Ball becomes, and what it is worth, under each sky */
const WEATHER_BALL_TYPES = new Map<Weathers, Types>([
  [Weathers.Sunny, Types.Fire],
  [Weathers.ExtremeSunny, Types.Fire],
  [Weathers.Rain, Types.Water],
  [Weathers.HeavyRain, Types.Water],
  [Weathers.Sandstorm, Types.Rock],
  [Weathers.Hail, Types.Ice],
  [Weathers.Snow, Types.Ice],
]);

/**
 * Eruption and Water Spout, read off what is left of the user: full
 * power at full health, and next to nothing on its last legs
 */
const HEALTH_SCALED = new Set<Moves>([Moves.Eruption, Moves.WaterSpout]);

function healthShare(unit: Unit): number {
  const whole = unit.checkStat(Stats.HP, 0);

  return whole <= 0 ? 0 : Math.max(0, Math.min(1, unit.health / whole));
}

export default function setupConditionalPowerMoves(battle: Battle): void {
  battle.on(BattleEvents.CheckUnitMovePower, EventPriority.Post, (event) => {
    if (event.power == null) {
      return;
    }

    if (event.move === Moves.Facade && hasAnyStatus(event.source, FACADE_STATUSES)) {
      event.power *= 2;
    }
    if (HEALTH_SCALED.has(event.move)) {
      // A minimum of 1, so a move that is still cast still lands
      event.power = Math.max(1, Math.floor(event.power * healthShare(event.source)));
    }
    if (event.move === Moves.WeatherBall && WEATHER_BALL_TYPES.has(event.source.checkWeather())) {
      event.power *= 2;
    }
    if (
      event.move === Moves.SmellingSalts &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.status[Statuses.Paralyzed] != null
    ) {
      event.power *= 2;
    }
  });

  // The ball is made of whatever is falling: it keeps its own type
  // under a clear sky
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move !== Moves.WeatherBall) {
      return;
    }

    const type = WEATHER_BALL_TYPES.get(event.source.checkWeather());

    if (type != null) {
      event.type = type;
    }
  });
}
