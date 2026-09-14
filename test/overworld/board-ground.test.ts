import { describe, expect, it } from 'vitest';
import { BOARD_CELLS, BOARD_MARGIN } from '../../src/components/overworld/overworld-tab/metrics';
import { buildBoardView } from '../../src/components/overworld/overworld-tab/board-view';
import { type BoardGround, readBoardGround } from '../../src/overworld/board-ground';
import { Depth } from '../../src/overworld/depth';
import World from '../../src/overworld/world';

/** A walk of single steps with one short jump in it, from wherever it starts */
const STEPS: [number, number][] = [
  [1, 0],
  [1, 0],
  [0, 1],
  [0, 1],
  [-1, 0],
  [0, -1],
  [7, 3],
  [1, 0],
];

/** Every cell where two reads of one window disagree, with the field that differs */
function differences(one: BoardGround, other: BoardGround): string[] {
  const found: string[] = [];

  for (let y = -BOARD_MARGIN; y < BOARD_CELLS + BOARD_MARGIN; y++) {
    for (let x = -BOARD_MARGIN; x < BOARD_CELLS + BOARD_MARGIN; x++) {
      const fields: [string, unknown, unknown][] = [
        ['role', one.role(x, y), other.role(x, y)],
        ['biome', one.biome(x, y), other.biome(x, y)],
        ['shelf', one.shelf(x, y), other.shelf(x, y)],
        ['road', one.road(x, y), other.road(x, y)],
        ['route', one.route(x, y), other.route(x, y)],
        ['town', one.town(x, y), other.town(x, y)],
        ['level', one.level(x, y), other.level(x, y)],
        ['seam', one.seam(x, y), other.seam(x, y)],
        ['bare', one.bare?.(x, y), other.bare?.(x, y)],
      ];

      for (const [name, carried, read] of fields) {
        if (carried !== read) {
          found.push(`${name} at ${x},${y}`);
        }
      }
    }
  }
  return found;
}

describe('the ground a sliding board reads', () => {
  for (const depth of [Depth.Surface, Depth.Cave]) {
    it(`carries a stepped window over exactly as a fresh read, ${depth === Depth.Cave ? 'underground' : 'on the surface'}`, () => {
      const walked = new World('overworld').at(depth);
      let x = 180;
      let y = -120;

      readBoardGround(walked, x, y, BOARD_MARGIN, BOARD_CELLS);
      for (const [dx, dy] of STEPS) {
        x += dx;
        y += dy;

        const slid = readBoardGround(walked, x, y, BOARD_MARGIN, BOARD_CELLS);
        // A world of its own, so nothing is carried into the read it is checked against.
        // Read after the walked one, since reading another world breaks the walk's carry
        const fresh = readBoardGround(
          new World('overworld').at(depth),
          x,
          y,
          BOARD_MARGIN,
          BOARD_CELLS,
        );

        expect(differences(slid, fresh)).toEqual([]);
        // Put the walk back as the last read, so the next step carries from it
        readBoardGround(walked, x, y, BOARD_MARGIN, BOARD_CELLS);
      }
    });
  }

  it('carries a stepped board its walls exactly as a fresh board works them out', () => {
    const at: [number, number] = [240, 60];

    buildBoardView(at[0], at[1], new Map(), 0, null, null, new Set());
    const slid = buildBoardView(at[0] + 1, at[1], new Map(), 0, null, null, new Set()).walls;

    // Far enough that nothing carries, then back to the same window worked out whole
    buildBoardView(at[0] + 500, at[1] + 500, new Map(), 0, null, null, new Set());
    const whole = buildBoardView(at[0] + 1, at[1], new Map(), 0, null, null, new Set()).walls;

    expect([...slid].sort((one, other) => one - other)).toEqual(
      [...whole].sort((one, other) => one - other),
    );
    expect(whole.size).toBeGreaterThan(0);
  });
});
