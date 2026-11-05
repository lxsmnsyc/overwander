import { weatherWindowOf } from '../../overworld/chunk-snapshot';
import type World from '../../overworld/world';
import type Weather from '../../data/overworld/weather';

/**
 * What the weather map reads off the world, kept apart from the
 * component so a test can hold it against the board and the snapshot
 * without a renderer
 */

/** One chunk of the map: its sky and the two readings it was classified from */
export interface MapSky {
  weather: Weather;
  front: number;
  character: number;
}

/** The hour of sky the map opens on, counted off the player's own clock */
export function readMapWindow(local: number): number {
  return weatherWindowOf(local);
}

/** The sky over one chunk of the map in a window */
export function readMapSky(world: World, chunkX: number, chunkY: number, window: number): MapSky {
  const { front, character } = world.getWeatherReading(chunkX, chunkY, window);

  return { weather: world.getWeather(chunkX, chunkY, window), front, character };
}
