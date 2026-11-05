import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readMapSky, readMapWindow } from '../../../src/components/demo/weather-map-sky';
import ChunkSnapshot from '../../../src/overworld/chunk-snapshot';
import getWorld from '../../../src/overworld/current';
import { toLocalTime } from '../../../src/model/local-time';
import { readFuzzParameters } from '../arbitraries';
import { cellArbitrary, clockArbitrary } from './arbitraries';

/**
 * The weather map is a second reader of the sky. It drifted from the
 * board three times in two days (7dc348490, f004bdbc7, 3d2298355),
 * each time by counting the hour its own way. These hold it to the
 * snapshot, which is what the spawn pools, the sparkle and the server
 * read, for any chunk, depth, instant and zone
 */
const parameters = readFuzzParameters();

describe('the weather map', () => {
  it('opens on the hour the snapshot is standing in', () => {
    fc.assert(
      fc.property(cellArbitrary, clockArbitrary, (place, clock) => {
        const local = toLocalTime(clock.now, clock.zone);
        const snapshot = new ChunkSnapshot(
          getWorld(place.depth).getChunk(place.chunkX, place.chunkY),
          local,
          clock.zone,
        );

        expect(readMapWindow(local)).toBe(snapshot.weatherWindow);
      }),
      parameters,
    );
  });

  it('shows the sky the snapshot and the board stand under', () => {
    fc.assert(
      fc.property(cellArbitrary, clockArbitrary, (place, clock) => {
        const world = getWorld(place.depth);
        const local = toLocalTime(clock.now, clock.zone);
        const snapshot = new ChunkSnapshot(
          world.getChunk(place.chunkX, place.chunkY),
          local,
          clock.zone,
        );
        const shown = readMapSky(world, place.chunkX, place.chunkY, readMapWindow(local));
        // The board reads the sky of the layer it is drawing, at the
        // snapshot's window (`board-view.ts`)
        const board = world.getWeather(place.chunkX, place.chunkY, snapshot.weatherWindow);

        expect(shown.weather).toBe(snapshot.weather);
        expect(board).toBe(snapshot.weather);
      }),
      parameters,
    );
  });
});
