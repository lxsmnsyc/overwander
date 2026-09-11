import type { BaseEvent } from '../../core/event-emitter';
import type { Weathers } from '../../data/ids/status';
import type { UnitEvent } from './unit';

/** The clock, and the sky everybody fights under */
export interface TickEvent extends BaseEvent {
  duration: number;
}

export interface WeatherEvent extends BaseEvent {
  weather: Weathers;
  /**
   * How long it stays out, in milliseconds. Zero is weather with no
   * clock on it at all — what a battle opens under, and what clearing
   * the sky sets
   */
  duration: number;
}

/**
 * A weather change originating from a unit. `global` decides whether
 * it lands on the whole battle or just the unit's own team — the
 * default follows the battle mode, and listeners (e.g. Boss) may
 * widen it
 */
export interface UnitSetWeatherEvent extends UnitEvent {
  weather: Weathers;
  global: boolean;
  duration: number;
}

/**
 * How long the weather a unit is calling up stays out; the rocks
 * lengthen it here
 */
export interface CheckUnitWeatherDurationEvent extends UnitWeatherEvent {
  duration: number;
}

export interface UnitWeatherEvent extends UnitEvent {
  weather: Weathers;
}
