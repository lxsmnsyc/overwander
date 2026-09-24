import { describe, expect, it } from 'vitest';
import registerGameData from '../../../src/data';
import DungeonKind, { FloorGate } from '../../../src/data/overworld/dungeon';
import {
  FRONTIER_BRAIN_RULES,
  FRONTIER_TEAM_SIZE,
  FrontierRule,
} from '../../../src/data/overworld/experts';
import Landmark from '../../../src/data/overworld/landmark';
import { getBiomeLairs, getLairResidents } from '../../../src/data/overworld/lair';
import ChunkSnapshot, { RocketRank } from '../../../src/overworld/chunk-snapshot';
import { RoomKind } from '../../../src/overworld/dungeon/floor';
import {
  HIDEOUT_GRUNT_SIZE,
  HORDE_MAX,
  dungeonFoe,
  dungeonKindOf,
  getDungeonLayout,
  getDungeonLegendary,
} from '../../../src/overworld/dungeon/stage';
import World from '../../../src/overworld/world';

registerGameData();

/** Every dungeon landmark over a stretch of the world, with a snapshot of its window */
function findDungeons(): { snapshot: ChunkSnapshot; cell: number; landmark: Landmark }[] {
  const world = new World('overworld');
  const found: { snapshot: ChunkSnapshot; cell: number; landmark: Landmark }[] = [];

  for (let x = 0; x < 64; x++) {
    for (let y = 0; y < 12; y++) {
      const chunk = world.getChunk(x, y);

      for (const [cell, landmark] of chunk.getLandmarkCells()) {
        if (dungeonKindOf(landmark) != null) {
          found.push({ snapshot: new ChunkSnapshot(chunk, 0), cell, landmark });
        }
      }
    }
  }
  return found;
}

const FOUND = findDungeons();

describe('what stands in a dungeon', () => {
  it('finds all three kinds out in the world, none of them in a town', () => {
    const kinds = new Set<Landmark>();

    for (const { snapshot, cell, landmark } of FOUND) {
      kinds.add(landmark);
      expect(snapshot.chunk.isTownCell(cell)).toBe(false);
    }
    expect(kinds).toEqual(new Set([Landmark.Hideout, Landmark.Dungeon, Landmark.FrontierBrain]));
  });

  it('only puts a Dungeon where the biome hosts a lair', () => {
    for (const { snapshot, landmark } of FOUND) {
      if (landmark === Landmark.Dungeon) {
        expect(getBiomeLairs(snapshot.chunk.biome).length).toBeGreaterThan(0);
      }
    }
  });

  it('puts grunts in a hideout, an executive on the stairs and the boss last', () => {
    let checked = 0;

    for (const { snapshot, cell, landmark } of FOUND) {
      const layout = landmark === Landmark.Hideout ? getDungeonLayout(snapshot, cell) : null;

      if (layout == null) {
        continue;
      }
      for (const [depth, floor] of layout.floors.entries()) {
        for (const [room, at] of floor.rooms.entries()) {
          const foe = dungeonFoe(snapshot, cell, depth, room);

          if (at.kind === RoomKind.Trainer) {
            expect(foe?.rank).toBe(RocketRank.Grunt);
            expect(foe?.party).toHaveLength(HIDEOUT_GRUNT_SIZE);
            expect(foe?.shadow).toBe(true);
          } else if (at.kind === RoomKind.Stairs && floor.gate === FloorGate.Guard) {
            expect(foe?.rank).toBe(RocketRank.Executive);
          } else if (at.kind === RoomKind.Boss) {
            expect(foe?.rank).toBe(RocketRank.Boss);
          } else {
            expect(foe).toBeNull();
          }
        }
      }
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('fills a Dungeon with wild hordes that grow stronger, and ends in a local legendary', () => {
    let checked = 0;

    for (const { snapshot, cell, landmark } of FOUND) {
      const layout = landmark === Landmark.Dungeon ? getDungeonLayout(snapshot, cell) : null;

      if (layout == null) {
        continue;
      }

      let floor = 0;

      for (const [depth, at] of layout.floors.entries()) {
        for (const [room] of at.rooms.entries()) {
          const foe = dungeonFoe(snapshot, cell, depth, room);

          if (foe == null) {
            continue;
          }
          expect(foe.party.length).toBeGreaterThanOrEqual(1);
          expect(foe.party.length).toBeLessThanOrEqual(HORDE_MAX);
          expect(foe.shadow).toBe(false);
          expect(foe.name).toBe('');
          // Each floor's hordes stand higher than the last's
          expect(foe.levels[0]).toBeGreaterThanOrEqual(floor);
          floor = foe.levels[0];
        }
        // The last room is a legendary to meet, never a fight
        expect(dungeonFoe(snapshot, cell, depth, at.exit) == null).toBe(
          depth === layout.floors.length - 1 || at.gate === FloorGate.Pass,
        );
      }

      const legendary = getDungeonLegendary(snapshot, cell);
      const endemic = new Set(
        getBiomeLairs(snapshot.chunk.biome).flatMap((lair) => getLairResidents(lair)),
      );

      expect(legendary).not.toBeNull();
      expect(legendary != null && endemic.has(legendary.species)).toBe(true);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('climbs a Frontier tower past six crate trainers to the Brain, all under the house rule', () => {
    let checked = 0;

    for (const { snapshot, cell, landmark } of FOUND) {
      const layout = landmark === Landmark.FrontierBrain ? getDungeonLayout(snapshot, cell) : null;
      const brain = snapshot.getFrontierBrain(cell);

      if (layout == null || brain == null) {
        continue;
      }
      expect(layout.kind).toBe(DungeonKind.Frontier);

      const rule = FRONTIER_BRAIN_RULES[brain];

      for (const [depth] of layout.floors.entries()) {
        const foe = dungeonFoe(snapshot, cell, depth, 0);
        const answers = rule === FrontierRule.Countered || rule === FrontierRule.Singled;

        expect(foe?.rules).toBe(rule);
        if (depth < layout.floors.length - 1 && !answers) {
          expect(foe?.party).toHaveLength(FRONTIER_TEAM_SIZE);
        }
      }
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
