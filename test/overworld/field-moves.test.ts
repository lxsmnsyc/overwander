import { beforeAll, describe, expect, it } from 'vitest';
import { Moves } from '../../src/data/ids/moves';
import { Species } from '../../src/data/ids/species';
import registerGameData from '../../src/data/index';
import {
  type CellFacts,
  canEnter,
  canLand,
  canUseFieldMove,
} from '../../src/overworld/field-moves';
import { nearestTown } from '../../src/overworld/town';
import World from '../../src/overworld/world';

beforeAll(() => {
  registerGameData();
});

const GROUND: CellFacts = {
  fixture: false,
  scenery: false,
  solid: false,
  water: false,
  lava: false,
};
const WATER: CellFacts = { ...GROUND, water: true };
const TREE: CellFacts = { ...GROUND, scenery: true };
const CLIFF: CellFacts = { ...GROUND, solid: true };
const LAVA: CellFacts = { ...GROUND, solid: true, lava: true };
const LANDMARK: CellFacts = { ...GROUND, fixture: true };

describe('field moves', () => {
  it('opens a move to a buddy that can learn it, known or not', () => {
    expect(canUseFieldMove(Species.Squirtle, Moves.Surf)).toBe(true);
    expect(canUseFieldMove(Species.Pidgey, Moves.Fly)).toBe(true);
    expect(canUseFieldMove(Species.Pidgey, Moves.Surf)).toBe(false);
    expect(canUseFieldMove(null, Moves.Dig)).toBe(false);
  });

  it('keeps a walk off water it is not already in', () => {
    expect(canEnter('walk', GROUND, WATER)).toBe(false);
    expect(canEnter('walk', WATER, WATER)).toBe(true);
    expect(canEnter('surf', GROUND, WATER)).toBe(true);
    expect(canEnter('surf', WATER, TREE)).toBe(false);
  });

  it('flies over everything but lava and landmarks', () => {
    for (const cell of [WATER, TREE, CLIFF]) {
      expect(canEnter('fly', GROUND, cell)).toBe(true);
    }
    expect(canEnter('fly', GROUND, LAVA)).toBe(false);
    expect(canEnter('fly', GROUND, LANDMARK)).toBe(false);
  });

  it('only lands where a walk could stand', () => {
    expect(canLand(GROUND)).toBe(true);
    for (const cell of [WATER, TREE, CLIFF, LANDMARK]) {
      expect(canLand(cell)).toBe(false);
    }
  });

  it('finds the closest town, and it is the same one from beside it', () => {
    const world = new World('overworld');
    const town = nearestTown(world, 0, 0);

    expect(town).not.toBeNull();
    if (town == null) {
      return;
    }

    const again = nearestTown(world, town.x + 1, town.y);

    expect(again?.regionX).toBe(town.regionX);
    expect(again?.regionY).toBe(town.regionY);
  });
});
