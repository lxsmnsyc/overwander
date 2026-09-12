import { describe, expect, it } from 'vitest';
import Landmark from '../../src/data/overworld/landmark';
import { isOpenSea } from '../../src/data/ids/biome';
import caveMouth, { caveMouthCellIn, nearestMouth, throughMouth } from '../../src/overworld/cave';
import { MOUTH_SEARCH } from '../../src/data/overworld/cave';
import { CHUNK_CELLS, worldCell } from '../../src/overworld/grid';
import { roleAt } from '../../src/overworld/ground';
import World, { Depth } from '../../src/overworld/world';
import registerGameData from '../../src/data';

registerGameData();

/** The chunks a sweep covers, which is enough country to find rock in */
const SPAN = 16;

describe('the caves', () => {
  it('is the same world one layer down', () => {
    const world = new World('overworld');
    const cave = world.at(Depth.Cave);

    // One pair rather than two worlds, however either is asked
    expect(cave.depth).toBe(Depth.Cave);
    expect(cave.at(Depth.Surface)).toBe(world);
    expect(world.at(Depth.Cave)).toBe(cave);
    expect(world.at(Depth.Surface)).toBe(world);

    // The country overhead is what decides what lives below, so the
    // biome is the surface's at every cell
    for (let at = 0; at < 40; at++) {
      expect(cave.getCellBiome(at * 7, at * 13)).toBe(world.getCellBiome(at * 7, at * 13));
    }

    // ...but the chunk is its own, so it rolls its own landmarks and
    // publishes its own window rows
    expect(cave.getChunk(3, 4).seed).not.toBe(world.getChunk(3, 4).seed);
    expect(cave.getChunk(3, 4).seed).toContain('cave');
  });

  it('is stone and the space in it, and nothing else', () => {
    const cave = new World('overworld').at(Depth.Cave);
    const roles = new Set<string>();

    for (let y = -40; y < 40; y++) {
      for (let x = -40; x < 40; x++) {
        roles.add(roleAt(cave, x, y));
      }
    }
    // No water underground, and no third thing either
    expect([...roles].sort()).toEqual(['ground', 'wall']);
  });

  it('is tighter than the country over it', () => {
    const world = new World('overworld');
    const cave = world.at(Depth.Cave);
    let open = 0;
    let above = 0;

    for (let y = -60; y < 60; y++) {
      for (let x = -60; x < 60; x++) {
        if (roleAt(cave, x, y) === 'ground') {
          open++;
        }
        if (roleAt(world, x, y) === 'ground') {
          above++;
        }
      }
    }
    // The whole point of the veins is that there is something to walk
    // along at all, and the whole point of their width is that it is
    // not a second overworld
    expect(open).toBeGreaterThan(0);
    expect(open).toBeLessThan(above / 2);
  });

  it('squares off a passage that steps diagonally', () => {
    const cave = new World('overworld').at(Depth.Cave);
    const open = (x: number, y: number): boolean => roleAt(cave, x, y) === 'ground';
    let floor = 0;
    let broken = 0;

    // Nothing in this game moves diagonally, so two cells touching
    // only at their corners are two dead ends rather than a passage
    for (let y = -3100; y < -2950; y++) {
      for (let x = 3500; x < 3650; x++) {
        if (!open(x, y)) {
          continue;
        }
        floor++;
        for (const [dx, dy] of [
          [1, 1],
          [1, -1],
        ]) {
          if (open(x + dx, y + dy) && !open(x + dx, y) && !open(x, y + dy)) {
            broken++;
          }
        }
      }
    }
    expect(floor).toBeGreaterThan(1000);
    // Not none: an elbow can meet another elbow, and squaring those
    // off in turn would widen the passages more than it is worth. What
    // matters is that they are the exception rather than the shape
    expect(broken / floor).toBeLessThan(0.01);
  });

  it('is walkable in long runs, stepping only north, south, east and west', () => {
    const cave = new World('overworld').at(Depth.Cave);
    const open = (x: number, y: number): boolean => roleAt(cave, x, y) === 'ground';
    const seen = new Set<number>();
    // The same square the vein width was tuned against. Smaller than
    // this and the window clips the network rather than measuring it
    const span = 300;
    const x0 = -3000;
    const y0 = 3600;
    let biggest = 0;

    for (let y = y0; y < y0 + span; y++) {
      for (let x = x0; x < x0 + span; x++) {
        const at = (y - y0) * span + (x - x0);

        if (!open(x, y) || seen.has(at)) {
          continue;
        }

        let size = 0;
        const stack: [number, number][] = [[x, y]];

        seen.add(at);
        while (stack.length > 0) {
          const step = stack.pop();

          if (step == null) {
            break;
          }
          size++;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const nx = step[0] + dx;
            const ny = step[1] + dy;
            const next = (ny - y0) * span + (nx - x0);

            if (nx < x0 || ny < y0 || nx >= x0 + span || ny >= y0 + span || seen.has(next)) {
              continue;
            }
            if (open(nx, ny)) {
              seen.add(next);
              stack.push([nx, ny]);
            }
          }
        }
        biggest = Math.max(biggest, size);
      }
    }
    // A network worth walking rather than a field of pockets. The
    // chambers on their own reach 195 cells and go nowhere; the veins
    // take the biggest to about 1,500 here
    expect(biggest).toBeGreaterThan(800);
  });

  it('never runs a passage under the shore', () => {
    const cave = new World('overworld').at(Depth.Cave);

    for (let y = -60; y < 60; y++) {
      for (let x = -60; x < 60; x++) {
        if (roleAt(cave, x, y) !== 'ground') {
          continue;
        }

        // A cave under the sea is its own network. Every cell where the
        // surface crosses between sea and land is solid, so no tunnel
        // joins the two
        const sea = isOpenSea(cave.getCellBiome(x, y));

        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          expect(isOpenSea(cave.getCellBiome(x + dx, y + dy)), `${x}, ${y}`).toBe(sea);
        }
      }
    }
  });

  it('cuts every mouth into a hillside, with both ends walkable', () => {
    const world = new World('overworld');
    const cave = world.at(Depth.Cave);
    let found = 0;

    for (let y = -SPAN; y < SPAN; y++) {
      for (let x = -SPAN; x < SPAN; x++) {
        const mouth = caveMouth(world, x, y);

        if (mouth == null) {
          continue;
        }
        found++;

        const surfaceX = worldCell(x, mouth.surface % CHUNK_CELLS);
        const surfaceY = worldCell(y, Math.floor(mouth.surface / CHUNK_CELLS));
        const caveX = worldCell(x, mouth.cave % CHUNK_CELLS);
        const caveY = worldCell(y, Math.floor(mouth.cave / CHUNK_CELLS));

        // Somewhere to walk up to, cut into rock, and floor behind it
        expect(roleAt(world, surfaceX, surfaceY), `${x}, ${y}`).toBe('ground');
        expect(roleAt(world, caveX, caveY), `${x}, ${y}`).toBe('wall');
        expect(roleAt(cave, caveX, caveY), `${x}, ${y}`).toBe('ground');
        // The two touch, so going under is a step rather than a jump
        expect(Math.abs(surfaceX - caveX) + Math.abs(surfaceY - caveY)).toBe(1);
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('stages every mouth on both layers, so nothing is a way in only', () => {
    const world = new World('overworld');
    const cave = world.at(Depth.Cave);
    let staged = 0;

    for (let y = -SPAN; y < SPAN; y++) {
      for (let x = -SPAN; x < SPAN; x++) {
        const mouth = caveMouth(world, x, y);

        if (mouth == null) {
          // Neither layer stages one where the ground gives none
          expect(caveMouthCellIn(world, x, y)).toBeNull();
          expect(caveMouthCellIn(cave, x, y)).toBeNull();
          continue;
        }
        staged++;

        // A player who walks down must be able to walk back up, so a
        // mouth the surface had no room for is on neither layer
        expect(world.getChunk(x, y).getLandmarkCells().get(mouth.surface), `${x}, ${y}`).toBe(
          Landmark.CaveMouth,
        );
        expect(cave.getChunk(x, y).getLandmarkCells().get(mouth.cave), `${x}, ${y}`).toBe(
          Landmark.CaveMouth,
        );
        // And each layer sends a player to the other's cell
        expect(throughMouth(world, x, y)).toBe(mouth.cave);
        expect(throughMouth(cave, x, y)).toBe(mouth.surface);
      }
    }
    expect(staged).toBeGreaterThan(0);
  });

  it('holds nothing underground that wants a sky over it', () => {
    const cave = new World('overworld').at(Depth.Cave);
    const kinds = new Set<Landmark>();

    for (let y = -SPAN; y < SPAN; y++) {
      for (let x = -SPAN; x < SPAN; x++) {
        for (const landmark of cave.getChunk(x, y).getLandmarkCells().values()) {
          kinds.add(landmark);
        }
      }
    }
    expect(kinds.size).toBeGreaterThan(1);
    for (const kind of kinds) {
      // No bushes, no trees, no stalls, no seats of the league, and no
      // portal: the way out of a cave is the way back into it
      expect(
        [
          Landmark.CaveMouth,
          Landmark.ItemCache,
          Landmark.Nest,
          Landmark.TeamRocket,
          Landmark.Trainer,
          Landmark.LegendaryLair,
          Landmark.ShadowLair,
        ],
        String(kind),
      ).toContain(kind);
    }
  });

  it('builds no towns underground', () => {
    const cave = new World('overworld').at(Depth.Cave);

    for (let y = -SPAN; y < SPAN; y++) {
      for (let x = -SPAN; x < SPAN; x++) {
        for (const landmark of cave.getChunk(x, y).getLandmarkCells().values()) {
          expect(landmark).not.toBe(Landmark.Market);
          expect(landmark).not.toBe(Landmark.PokemonCenter);
          expect(landmark).not.toBe(Landmark.Portal);
        }
      }
    }
  });
});

describe('the way out of a cave', () => {
  const world = new World('overworld').at(Depth.Cave);

  it('answers the chunk a player is standing in, where it has a mouth', () => {
    let checked = 0;

    for (let x = 0; x < SPAN && checked < 8; x++) {
      for (let y = 0; y < SPAN && checked < 8; y++) {
        const mouth = caveMouth(world, x, y);

        if (mouth == null) {
          continue;
        }
        checked++;

        const found = nearestMouth(world, x, y);

        expect(found).not.toBeNull();
        expect(found?.chunkX).toBe(x);
        expect(found?.chunkY).toBe(y);
        expect(found?.mouth).toEqual(mouth);
      }
    }
    expect(checked).toBe(8);
  });

  it('reaches into the country around a chunk with no way up of its own', () => {
    let checked = 0;

    for (let x = 0; x < SPAN; x++) {
      for (let y = 0; y < SPAN; y++) {
        if (caveMouth(world, x, y) != null) {
          continue;
        }

        const found = nearestMouth(world, x, y);

        if (found == null) {
          continue;
        }
        checked++;
        // Whatever it named is a real mouth, and inside the search
        expect(caveMouth(world, found.chunkX, found.chunkY)).toEqual(found.mouth);
        expect(Math.abs(found.chunkX - x)).toBeLessThanOrEqual(MOUTH_SEARCH);
        expect(Math.abs(found.chunkY - y)).toBeLessThanOrEqual(MOUTH_SEARCH);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('comes up on ground a player can stand on', () => {
    let checked = 0;

    for (let x = 0; x < SPAN && checked < 12; x++) {
      for (let y = 0; y < SPAN && checked < 12; y++) {
        const found = nearestMouth(world, x, y);

        if (found == null) {
          continue;
        }
        checked++;

        const cell = found.mouth.surface;
        const above = world.at(Depth.Surface);

        expect(
          roleAt(
            above,
            worldCell(found.chunkX, cell % CHUNK_CELLS),
            worldCell(found.chunkY, Math.floor(cell / CHUNK_CELLS)),
          ),
        ).toBe('ground');
      }
    }
    expect(checked).toBe(12);
  });
});
