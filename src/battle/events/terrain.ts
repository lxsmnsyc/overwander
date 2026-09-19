import type { BaseEvent } from '../../core/event-emitter';
import type { Terrains } from '../../data/ids/status';
import type { TeamEvent } from './team';
import type { UnitEvent } from './unit';

/** The field laid with a terrain, for as long as `duration` says */
export interface TerrainEvent extends BaseEvent {
  terrain: Terrains;
  /** In milliseconds. Zero is a terrain with no clock on it */
  duration: number;
}

export interface TeamTerrainEvent extends TeamEvent {
  terrain: Terrains;
  duration: number;
}

/**
 * A unit laying a terrain. Where it reaches is the terrain mechanics'
 * business, the way it is for weather: the whole field in a fight
 * between players, the unit's own team in a raid
 */
export interface UnitSetTerrainEvent extends UnitEvent {
  terrain: Terrains;
  global: boolean;
  duration: number;
}

/** The terrain under a unit, which is None for anything off the ground */
export interface UnitTerrainEvent extends UnitEvent {
  terrain: Terrains;
}

/** How long the terrain a unit lays holds */
export interface CheckUnitTerrainDurationEvent extends UnitTerrainEvent {
  duration: number;
}
