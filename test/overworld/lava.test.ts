import { describe, expect, it } from 'vitest';
import registerGameData from '../../src/data/index';
import Biome from '../../src/data/ids/biome';
import { readGround } from '../../src/overworld/ground';
import { SURROUNDING } from '../../src/overworld/grid';
import World, { Depth } from '../../src/overworld/world';

/**
 * A stretch of world with craters in it, on both layers. Small enough
 * to read cell by cell, wide enough to hold a few hundred cells of lava
 */
const FROM = -600;
const TO = -300;

describe('lava', () => {
  it('never touches water, on either layer', () => {
    registerGameData();

    for (const depth of [Depth.Surface, Depth.Cave]) {
      const world = new World('overworld', depth);
      let lava = 0;

      for (let y = FROM; y < TO; y++) {
        for (let x = FROM; x < TO; x++) {
          const here = readGround(world, x, y);

          if (here.role !== 'water' || here.biome !== Biome.Volcano) {
            continue;
          }
          lava += 1;
          // A volcano's water is lava, and the two liquids meeting
          // would read as one pool. The rule is the border: lava dries
          // wherever the crater ends within a cell
          for (const [dx, dy] of SURROUNDING) {
            const near = readGround(world, x + dx, y + dy);

            expect(
              near.role === 'water' && near.biome !== Biome.Volcano,
              `${x}, ${y} beside ${x + dx}, ${y + dy}`,
            ).toBe(false);
          }
        }
      }
      // A run that found no lava would pass without testing anything
      expect(lava).toBeGreaterThan(100);
    }
  }, 60000);
});
