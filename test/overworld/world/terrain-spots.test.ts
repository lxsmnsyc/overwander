import { registerMoves } from '../../../src/data/moves';
import { describe, expect, it } from 'vitest';
import registerAbilities from '../../../src/data/abilities';
import registerBiomeSpawns from '../../../src/data/biome';
import Biome, { isOpenSea, isWaterBiome } from '../../../src/data/ids/biome';
import registerItems from '../../../src/data/items';
import { registerSpecies } from '../../../src/data/species';
import { CHUNK_CELLS, worldCell } from '../../../src/overworld/chunk';
import { isRoadAt } from '../../../src/overworld/town';
import ChunkSnapshot, { PHENOMENON_INTERVAL } from '../../../src/overworld/chunk-snapshot';
import Landmark from '../../../src/data/overworld/landmark';
import Phenomenon from '../../../src/data/overworld/phenomenon';
import { roleAt } from '../../../src/overworld/ground';
import { isIslandAt } from '../../../src/overworld/fields';
import { Depth } from '../../../src/overworld/depth';
import { blocksWalk, isFace, isPassAt, isSeam } from '../../../src/overworld/cliff';
import { isRouteAt } from '../../../src/overworld/route';
import { ORTHOGONAL, SQUARES, SURROUNDING } from '../../../src/overworld/grid';
import { levelAt } from '../../../src/overworld/terrace';
import World from '../../../src/overworld/world';
import findChunk from './helpers';

// Spawn rolls read the species registry and the biome spawn pools;
// the berry patch reads the item registry to name what it grew, and
// the machines that registry generates read the move data
registerMoves();
registerSpecies();
registerItems();
registerAbilities();
registerBiomeSpawns();

describe('terrain spots', () => {
  it('lays no water narrower than two cells', () => {
    const world = new World('overworld');
    const wet = (x: number, y: number): boolean => roleAt(world, x, y) === 'water';

    // One wide window rather than a handful of spots: a hairline or a
    // lone cell at a lip is rare enough that a small square of country
    // can miss every one of them
    for (let y = -200; y <= 200; y += 1) {
      for (let x = -200; x <= 200; x += 1) {
        if (!wet(x, y)) {
          continue;
        }
        // The shore is a ring of edges and corners, so a channel one
        // cell across has no corner to draw: every wet cell belongs
        // to a 2x2 block of wet ones
        const broad = SQUARES.some(([ox, oy]) =>
          [0, 1].every((dy) => [0, 1].every((dx) => wet(x + ox + dx, y + oy + dy))),
        );

        expect(broad, `${x},${y}`).toBe(true);
      }
    }
  });

  it('leaves no water hanging over a dry drop', () => {
    const world = new World('overworld');
    const wet = (x: number, y: number): boolean => roleAt(world, x, y) === 'water';

    for (let y = -200; y <= 200; y += 1) {
      for (let x = -200; x <= 200; x += 1) {
        if (!wet(x, y)) {
          continue;
        }
        const here = levelAt(world, x, y);

        for (const [dx, dy] of SURROUNDING) {
          // A pool's surface is level, so water at the lip of a step
          // has to have water below it: the board seams the two into
          // one fall, and dry ground there would leave the water
          // drawn ending in mid-air
          if (levelAt(world, x + dx, y + dy) < here) {
            expect(wet(x + dx, y + dy), `${x + dx},${y + dy}`).toBe(true);
          }
        }
      }
    }
  });

  it("keeps a volcano's lava out of the water next door", () => {
    const world = new World('overworld');
    let lava = 0;

    for (let y = -1500; y <= 1500; y += 7) {
      for (let x = -1500; x <= 1500; x += 7) {
        if (world.getCellBiome(x, y) !== Biome.Volcano || roleAt(world, x, y) !== 'water') {
          continue;
        }
        lava += 1;
        // A volcano's water is lava, so it may not run into a pool of
        // the ordinary kind: the border dries off on the crater's side
        for (const [dx, dy] of SURROUNDING) {
          const wet = roleAt(world, x + dx, y + dy) === 'water';

          expect(
            wet && world.getCellBiome(x + dx, y + dy) !== Biome.Volcano,
            `${x + dx},${y + dy}`,
          ).toBe(false);
        }
      }
    }
    // A volcano with no lava in it would pass this without saying
    // anything
    expect(lava).toBeGreaterThan(0);
  });

  it('lets a walk cross every fall', () => {
    const world = new World('overworld');
    let falls = 0;

    for (let y = -200; y <= 200; y += 1) {
      for (let x = -200; x <= 200; x += 1) {
        if (roleAt(world, x, y) !== 'water' || !isFace(world, x, y)) {
          continue;
        }
        // Water on a step always pours into more water, so it is a seam
        // whatever shape the step takes
        falls += 1;
        expect(blocksWalk(world, x, y), `${x},${y}`).toBe(false);
      }
    }
    expect(falls).toBeGreaterThan(0);
  });

  it('walls a walk off the inside corner of a cliff', () => {
    const world = new World('overworld');
    let corners = 0;

    for (let y = -200; y <= 200; y += 1) {
      for (let x = -200; x <= 200; x += 1) {
        const here = levelAt(world, x, y);
        const lower = ([dx, dy]: [number, number]): boolean =>
          levelAt(world, x + dx, y + dy) < here;

        if (
          roleAt(world, x, y) === 'water' ||
          isRoadAt(world, x, y) ||
          isRouteAt(world, x, y) ||
          ORTHOGONAL.some(lower) ||
          !SURROUNDING.some(lower)
        ) {
          continue;
        }
        // Lower ground only across a diagonal is where the ring's inside
        // corner is drawn, and that tile is as much the cliff as a side.
        // No pass opens it, since a walk never steps across a diagonal
        corners += 1;
        expect(isSeam(world, x, y), `${x},${y}`).toBe(false);
        expect(blocksWalk(world, x, y), `${x},${y}`).toBe(true);
      }
    }
    expect(corners).toBeGreaterThan(0);
  });

  it('opens a corner of a pass only where every face beside it opens too', () => {
    const world = new World('overworld');
    const descends = (x: number, y: number): boolean =>
      ORTHOGONAL.some(([dx, dy]) => levelAt(world, x + dx, y + dy) < levelAt(world, x, y));
    const street = (x: number, y: number): boolean =>
      isRoadAt(world, x, y) || isRouteAt(world, x, y);
    let corners = 0;

    for (let y = -200; y <= 200; y += 1) {
      for (let x = -200; x <= 200; x += 1) {
        if (roleAt(world, x, y) === 'water' || street(x, y) || !descends(x, y)) {
          continue;
        }
        const faces = ORTHOGONAL.filter(([dx, dy]) => isFace(world, x + dx, y + dy));

        if (!faces.some(([ax, ay]) => faces.some(([bx, by]) => ax * bx + ay * by === 0))) {
          continue;
        }
        // Where the faces turn, a pass reaches the high ground only by way
        // of the faces beside it, so every one of them has to open
        corners += 1;
        const joined = faces.every(
          ([dx, dy]) =>
            roleAt(world, x + dx, y + dy) === 'water' ||
            street(x + dx, y + dy) ||
            (isPassAt(world, x + dx, y + dy) && descends(x + dx, y + dy)),
        );

        expect(isSeam(world, x, y), `${x},${y}`).toBe(isPassAt(world, x, y) && joined);
      }
    }
    expect(corners).toBeGreaterThan(0);
  });

  it('never cuts a road or a route with a cliff', () => {
    const world = new World('overworld');
    let graded = 0;

    for (let y = -200; y <= 200; y += 1) {
      for (let x = -200; x <= 200; x += 1) {
        if (!isFace(world, x, y) || (!isRoadAt(world, x, y) && !isRouteAt(world, x, y))) {
          continue;
        }
        // Corners and diagonal-only faces too: a street is graded through any step
        graded += 1;
        expect(blocksWalk(world, x, y), `${x},${y}`).toBe(false);
      }
    }
    expect(graded).toBeGreaterThan(0);
  });

  it('rolls no landmark onto a route', () => {
    const world = new World('overworld');
    let routed = 0;

    for (let cx = -16; cx < 16; cx++) {
      for (let cy = -16; cy < 16; cy++) {
        const chunk = world.getChunk(cx, cy);
        const at = (cell: number): [number, number] => [
          worldCell(cx, cell % CHUNK_CELLS),
          worldCell(cy, Math.floor(cell / CHUNK_CELLS)),
        ];

        for (const [cell, landmark] of chunk.getLandmarkCells()) {
          // The portal and a cave mouth are laid where the world puts
          // them, and a town lays its own lots
          if (
            landmark === Landmark.Portal ||
            landmark === Landmark.CaveMouth ||
            chunk.isTownCell(cell)
          ) {
            continue;
          }
          const [x, y] = at(cell);

          expect(isRouteAt(world, x, y), `${landmark} at ${x},${y}`).toBe(false);
        }
        if (
          Array.from({ length: CHUNK_CELLS * CHUNK_CELLS }, (_, cell) => at(cell)).some(([x, y]) =>
            isRouteAt(world, x, y),
          )
        ) {
          routed += 1;
        }
      }
    }
    // A sweep that crossed no route would pass without saying anything
    expect(routed).toBeGreaterThan(0);
  });

  it('keeps scenery off the edge of a cliff', () => {
    const world = new World('overworld');
    let faces = 0;

    for (let cx = -12; cx < 12; cx++) {
      for (let cy = -12; cy < 12; cy++) {
        const chunk = world.getChunk(cx, cy);

        faces += chunk.getFaceCells().size;
        for (const cell of chunk.getDecorationCells().keys()) {
          const x = worldCell(cx, cell % CHUNK_CELLS);
          const y = worldCell(cy, Math.floor(cell / CHUNK_CELLS));

          expect(isFace(world, x, y), `${x},${y}`).toBe(false);
        }
      }
    }
    expect(faces).toBeGreaterThan(0);
  });

  it('keeps scenery off the approach to a way up a cliff', () => {
    const world = new World('overworld');
    let placed = 0;

    for (let cx = -12; cx < 12; cx++) {
      for (let cy = -12; cy < 12; cy++) {
        for (const cell of world.getChunk(cx, cy).getDecorationCells().keys()) {
          const x = worldCell(cx, cell % CHUNK_CELLS);
          const y = worldCell(cy, Math.floor(cell / CHUNK_CELLS));

          placed += 1;
          // A route is walked like a street, so nothing grows on one
          expect(isRouteAt(world, x, y), `${x},${y}`).toBe(false);
          // A tree beside a seam would stand in the way up it
          for (const [dx, dy] of SURROUNDING) {
            const seam = isFace(world, x + dx, y + dy) && isSeam(world, x + dx, y + dy);

            expect(seam, `${x},${y} beside ${x + dx},${y + dy}`).toBe(false);
          }
        }
      }
    }
    expect(placed).toBeGreaterThan(0);
  });

  it('reads the water out of the world rather than growing it in the chunk', () => {
    const world = new World('overworld');

    // A chunk that is sea in every cell is water throughout, but for its
    // islands. Asked of every cell rather than of the chunk's own biome,
    // which is only the country in its middle: a chunk on a coast is
    // named for the sea and still holds a beach
    const sea = findChunk(world, (candidate) =>
      [...candidate.getCellBiomes()].every((biome) => isOpenSea(biome)),
    );

    if (sea != null) {
      for (const cell of sea.getSpotCells()) {
        expect(
          isIslandAt(
            world,
            worldCell(sea.x, cell % CHUNK_CELLS),
            worldCell(sea.y, Math.floor(cell / CHUNK_CELLS)),
          ),
        ).toBe(true);
      }
    }

    let spotted = 0;
    let crossed = 0;

    for (let x = -20; x < 20; x++) {
      for (let y = -20; y < 20; y++) {
        const chunk = world.getChunk(x, y);

        if (isWaterBiome(chunk.biome)) {
          continue;
        }

        const spots = chunk.getSpotCells();

        if (spots.size > 0) {
          spotted += 1;
        }
        // A lake that reaches the last column runs on into the first
        // column of the chunk beside it: neither of them decided where
        // it began, so neither can end it at the boundary
        const east = world.getChunk(x + 1, y);

        for (let row = 0; row < CHUNK_CELLS; row++) {
          if (
            spots.has(row * CHUNK_CELLS + CHUNK_CELLS - 1) &&
            east.getCellRole(row * CHUNK_CELLS) === 'water'
          ) {
            crossed += 1;
          }
        }
      }
    }
    // Water on land at all, and water that carries over a boundary:
    // the old chunk-grown pools were confined to the placement area
    // and could not touch a rim, let alone cross one
    expect(spotted).toBeGreaterThan(0);
    expect(crossed).toBeGreaterThan(0);

    // Fixed forever: a fresh resolution of the chunk agrees
    const land = findChunk(world, (candidate) => !isWaterBiome(candidate.biome));

    expect(land).not.toBeNull();
    if (land != null) {
      expect([...world.getChunk(land.x, land.y).getSpotCells()]).toEqual([...land.getSpotCells()]);
    }
  });

  it('keeps scenery and the grounded landmarks out of the water', () => {
    const world = new World('overworld');
    let seen = 0;

    for (let x = 0; x < 60 && seen < 12; x++) {
      const chunk = world.getChunk(x, 0);

      if (isWaterBiome(chunk.biome)) {
        continue;
      }
      seen += 1;

      const water = chunk.getSpotCells();

      for (const cell of chunk.getDecorationCells().keys()) {
        expect(water.has(cell)).toBe(false);
      }
      // No landmark stands in a pool now that the phenomenon is not
      // one: something happening is rolled over the chunk instead,
      // and the water is the one thing that can be going on there
      for (const cell of chunk.getLandmarkCells().keys()) {
        expect(water.has(cell)).toBe(false);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('keeps a happening out of the water where there is ground for it', () => {
    const world = new World('overworld');
    let checked = 0;

    // A pool is not where the interesting four are: a chunk with dry
    // ground puts what is going on onto it, so the pond stays a pond
    for (let x = 0; x < 25 && checked < 8; x++) {
      for (let y = 0; y < 8 && checked < 8; y++) {
        const chunk = world.getChunk(x, y);

        if (isWaterBiome(chunk.biome)) {
          continue;
        }

        const water = chunk.getSpotCells();

        for (let window = 0; window < 6; window++) {
          for (const cell of new ChunkSnapshot(chunk, window * PHENOMENON_INTERVAL)
            .getPhenomena()
            .keys()) {
            expect(water.has(cell)).toBe(false);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('ripples on the open sea, where there is no ground at all', () => {
    const world = new World('overworld');
    let checked = 0;

    // Nothing out there is standing on anything, so the only thing
    // that can be going on is the water
    for (let x = -100; x < 100 && checked < 8; x += 2) {
      for (let y = -100; y < 100 && checked < 8; y += 25) {
        const chunk = world.getChunk(x, y);

        if (!isOpenSea(chunk.biome)) {
          continue;
        }

        for (let window = 0; window < 6; window++) {
          const snapshot = new ChunkSnapshot(chunk, window * PHENOMENON_INTERVAL);

          for (const [cell, phenomenon] of snapshot.getPhenomena()) {
            // Only the cells actually at sea: a border may leave a
            // sea chunk a corner of the coast, and that corner is dry
            if (!isOpenSea(snapshot.biomeAt(cell))) {
              continue;
            }
            expect(phenomenon).toBe(Phenomenon.RipplingWater);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('walls nothing off above ground', () => {
    const world = new World('overworld');
    const cave = world.at(Depth.Cave);
    let underground = 0;

    for (let y = -120; y <= 120; y += 3) {
      for (let x = -120; x <= 120; x += 3) {
        // The stone field still runs where it ran: what changed is
        // that a cell it comes through is walked over rather than
        // walled off, so only a cave has rock in the way
        expect(roleAt(world, x, y), `${x},${y}`).not.toBe('wall');
        if (roleAt(cave, x, y) === 'wall') {
          underground += 1;
        }
      }
    }
    expect(underground).toBeGreaterThan(0);
  });
});
