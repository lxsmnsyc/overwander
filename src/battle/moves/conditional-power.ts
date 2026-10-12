import { EventPriority } from '../../core/event-emitter';
import { Stats } from '../../data/constants/stats';
import { Types } from '../../data/constants/types';
import { Moves } from '../../data/ids/moves';
import { Statuses, Terrains, Weathers } from '../../data/ids/status';
import type Battle from '../core';
import { BattleEvents, MoveTargetType } from '../events';
import type Unit from '../unit';
import { ASLEEP_STATUSES, MAJOR_STATUS_CONDITIONS } from '../status';
import { countHeldItems, hasAnyStatus } from '../utils';

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
export const WEATHER_BALL_TYPES = new Map<Weathers, Types>([
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
const HEALTH_SCALED = new Set<Moves>([Moves.Eruption, Moves.WaterSpout, Moves.DragonEnergy]);

/** What a Terrain Pulse becomes on each terrain the user stands on */
export const TERRAIN_PULSE_TYPES = new Map<Terrains, Types>([
  [Terrains.Electric, Types.Electric],
  [Terrains.Grassy, Types.Grass],
  [Terrains.Misty, Types.Fairy],
  [Terrains.Psychic, Types.Psychic],
]);

/**
 * The moves a terrain the user stands on makes 1.5x: Expanding Force
 * on its own Psychic Terrain, and Misty Explosion going off in the mist
 */
const TERRAIN_SWELLS = new Map<Moves, Terrains>([
  [Moves.ExpandingForce, Terrains.Psychic],
  [Moves.MistyExplosion, Terrains.Misty],
]);

const TERRAIN_SWELL = 1.5;

/** What Venoshock reads on the target */
const POISONS = new Set<Statuses>([Statuses.Poisoned, Statuses.BadlyPoisoned]);

/** The moves that hit a poisoned target twice as hard */
const POISON_READERS = new Set<Moves>([Moves.Venoshock, Moves.BarbBarrage]);

/** And the ones that hit anything with a status condition twice as hard */
const STATUS_READERS = new Set<Moves>([Moves.Hex, Moves.InfernalParade]);

/** What Hex reads: any status condition, and the endless sleep of Comatose */
const HEXED = new Set<Statuses>([...MAJOR_STATUS_CONDITIONS, Statuses.Comatose]);

/** How little is left of a target before the salt gets into the wound */
const BRINE_SHARE = 0.5;

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
    // The Sinnoh pair that read the target rather than the user: one
    // catches it sleeping, the other catches it already hurt
    if (
      event.move === Moves.WakeUpSlap &&
      event.target.type === MoveTargetType.Unit &&
      hasAnyStatus(event.target.unit, ASLEEP_STATUSES)
    ) {
      event.power *= 2;
    }
    if (
      event.move === Moves.Brine &&
      event.target.type === MoveTargetType.Unit &&
      healthShare(event.target.unit) < BRINE_SHARE
    ) {
      event.power *= 2;
    }
    if (event.move === Moves.Acrobatics && countHeldItems(event.source) === 0) {
      event.power *= 2;
    }
    if (event.move === Moves.TerrainPulse && TERRAIN_PULSE_TYPES.has(event.source.checkTerrain())) {
      event.power *= 2;
    }
    const swell = TERRAIN_SWELLS.get(event.move);

    if (swell != null && event.source.checkTerrain() === swell) {
      event.power *= TERRAIN_SWELL;
    }
    // Rising Voltage reads the terrain under the target, which is None
    // for anything off the ground
    if (
      event.move === Moves.RisingVoltage &&
      event.target.type === MoveTargetType.Unit &&
      event.target.unit.checkTerrain() === Terrains.Electric
    ) {
      event.power *= 2;
    }
    if (event.target.type === MoveTargetType.Unit) {
      const target = event.target.unit;

      if (
        (POISON_READERS.has(event.move) && hasAnyStatus(target, POISONS)) ||
        (STATUS_READERS.has(event.move) && hasAnyStatus(target, HEXED))
      ) {
        event.power *= 2;
      }
    }
  });

  // The ball is made of whatever is falling: it keeps its own type
  // under a clear sky
  battle.on(BattleEvents.CheckUnitMoveType, EventPriority.Post, (event) => {
    if (event.move === Moves.TerrainPulse) {
      const pulsed = TERRAIN_PULSE_TYPES.get(event.source.checkTerrain());

      if (pulsed != null) {
        event.type = pulsed;
      }
      return;
    }
    if (event.move !== Moves.WeatherBall) {
      return;
    }

    const type = WEATHER_BALL_TYPES.get(event.source.checkWeather());

    if (type != null) {
      event.type = type;
    }
  });
}
