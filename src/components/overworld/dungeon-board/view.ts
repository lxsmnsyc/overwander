import type Biome from '../../../data/ids/biome';
import BiomeId from '../../../data/ids/biome';
import Decoration from '../../../data/overworld/decoration';
import DungeonKind, { FloorSight } from '../../../data/overworld/dungeon';
import HIDEOUT_TERRAIN from '../../../data/overworld/dungeon-terrain';
import Landmark from '../../../data/overworld/landmark';
import type { SpriteDirection } from '../../../canvas/sprite-sheet';
import {
  barrierMark,
  crackedMark,
  ledgeMark,
  spinnerMark,
  switchMark,
} from '../../../canvas/dungeon-marks';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import type { BoardGround } from '../../../overworld/board-ground';
import { BOARD_CELLS, BOARD_CENTER } from '../../../overworld/board';
import { Direction, type DungeonFloor } from '../../../overworld/dungeon/floor';
import { type CellGrid, ROOM_CELLS, Thing, Tile } from '../../../overworld/dungeon/grid';
import type { DungeonLayout } from '../../../overworld/dungeon/layout';
import { dungeonFoe, getDungeonLegendary } from '../../../overworld/dungeon/stage';
import { type Footing, thingAt } from '../../../overworld/dungeon/tread';
import type { SpawnCoat } from '../chunk-canvas/scenery';

/** A trainer's facing as the sprite sheets name it */
const SPRITE_FACING: Record<Direction, SpriteDirection> = {
  [Direction.North]: 'Up',
  [Direction.East]: 'Right',
  [Direction.South]: 'Down',
  [Direction.West]: 'Left',
};

/** The room a cell of the floor is inside, or -1 for a wall or a door */
export function roomOf(grid: CellGrid, size: number, cell: number): number {
  const pitch = ROOM_CELLS + 1;
  const x = cell % grid.width;
  const y = Math.floor(cell / grid.width);

  if (x % pitch === 0 || y % pitch === 0) {
    return -1;
  }
  return Math.floor(y / pitch) * size + Math.floor(x / pitch);
}

/** Everything the board canvas is handed for one floor, as it stands */
export interface FloorView {
  origin: [number, number];
  ground: BoardGround;
  landmarks: Map<number, Landmark>;
  pictures: Map<number, string>;
  coats: Map<number, string>;
  facings: Map<number, SpriteDirection>;
  spawns: Map<number, SpawnCoat>;
  decorations: Map<number, Decoration>;
  marks: Map<number, HTMLCanvasElement>;
  lit: boolean;
}

/**
 * The floor under the board's window, centred on the player. A dungeon
 * floor is drawn the way a cave is: rock a level up with its face
 * showing, floor under it. A Dungeon wears its country's own cave; a
 * hideout wears its slate
 */
export function floorView(options: {
  snapshot: ChunkSnapshot;
  cell: number;
  layout: DungeonLayout;
  floor: number;
  footing: Footing;
  beaten: ReadonlySet<number>;
  seen: ReadonlySet<number>;
}): FloorView {
  const { snapshot, cell, layout, footing } = options;
  const plan: DungeonFloor = layout.floors[options.floor];
  const grid = plan.grid;
  const originX = (footing.at % grid.width) - BOARD_CENTER;
  const originY = Math.floor(footing.at / grid.width) - BOARD_CENTER;
  // A hideout is filed under a terrain number no country uses
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const hideout = HIDEOUT_TERRAIN as Biome;
  const country: Biome = layout.kind === DungeonKind.Hideout ? hideout : snapshot.biomeAt(cell);
  const at = (x: number, y: number): number => {
    const fx = x + originX;
    const fy = y + originY;

    return fx < 0 || fy < 0 || fx >= grid.width || fy >= grid.height ? -1 : fy * grid.width + fx;
  };
  const tileAt = (x: number, y: number): Tile => {
    const found = at(x, y);

    return found < 0 ? Tile.Wall : grid.tiles[found];
  };
  const ground: BoardGround = {
    margin: 0,
    role: (x, y) => {
      const tile = tileAt(x, y);

      if (tile === Tile.Wall) {
        return 'wall';
      }
      return tile === Tile.Water || tile === Tile.Ice ? 'water' : 'ground';
    },
    // Ice is drawn as the glacier's frozen water
    biome: (x, y) => (tileAt(x, y) === Tile.Ice ? BiomeId.Glacier : country),
    shelf: () => false,
    road: () => false,
    route: () => false,
    town: () => false,
    level: (x, y) => (tileAt(x, y) === Tile.Wall ? 1 : 0),
    seam: (x, y) => tileAt(x, y) !== Tile.Wall,
    bare: (x, y) => tileAt(x, y) === Tile.Wall,
  };

  const landmarks = new Map<number, Landmark>();
  const pictures = new Map<number, string>();
  const coats = new Map<number, string>();
  const facings = new Map<number, SpriteDirection>();
  const spawns = new Map<number, SpawnCoat>();
  const decorations = new Map<number, Decoration>();
  const marks = new Map<number, HTMLCanvasElement>();
  const unmarked = plan.sight === FloorSight.Unmarked;

  for (let y = 0; y < BOARD_CELLS; y++) {
    for (let x = 0; x < BOARD_CELLS; x++) {
      const floorCell = at(x, y);

      if (floorCell < 0) {
        continue;
      }

      const index = y * BOARD_CELLS + x;
      const tile = grid.tiles[floorCell];
      // An unmarked floor keeps what a room holds to itself until it is entered
      const hidden = unmarked && !options.seen.has(roomOf(grid, plan.size, floorCell));

      switch (tile) {
        case Tile.Spinner:
          marks.set(index, spinnerMark(grid.arrows.get(floorCell) ?? Direction.North));
          break;
        case Tile.Ledge:
          marks.set(index, ledgeMark(grid.arrows.get(floorCell) ?? Direction.South));
          break;
        case Tile.Cracked:
          marks.set(
            index,
            crackedMark(
              footing.crumbled.includes(floorCell) && !footing.filled.includes(floorCell),
            ),
          );
          break;
        case Tile.Barrier:
          marks.set(index, barrierMark((grid.barriers.get(floorCell) === 1) === footing.flipped));
          break;
        case Tile.Locked:
          landmarks.set(index, Landmark.Portal);
          pictures.set(index, footing.opened.includes(floorCell) ? 'door-open' : 'door-locked');
          break;
        case Tile.Pad:
          landmarks.set(index, Landmark.Portal);
          pictures.set(index, 'portal');
          break;
        case Tile.Stairs:
          landmarks.set(index, Landmark.Dungeon);
          pictures.set(index, 'cave');
          break;
        case Tile.Arrival:
          landmarks.set(index, Landmark.CaveMouth);
          pictures.set(index, 'cave-exit');
          break;
        default:
          break;
      }

      const thing = thingAt(grid, footing, floorCell);

      if (thing == null || hidden) {
        continue;
      }
      switch (thing) {
        case Thing.Boulder:
          decorations.set(index, Decoration.Boulder);
          break;
        case Thing.Rock:
          decorations.set(index, Decoration.Rock);
          break;
        case Thing.Tree:
          decorations.set(index, Decoration.Shrub);
          break;
        case Thing.Stash:
        case Thing.Key:
        case Thing.Pass:
          landmarks.set(index, Landmark.ItemCache);
          break;
        case Thing.Switch:
          marks.set(index, switchMark(footing.flipped));
          break;
        case Thing.Trainer:
        case Thing.Horde:
        case Thing.Boss:
          standOn(options, grid, floorCell, index, { landmarks, coats, facings, spawns });
          break;
        default:
          break;
      }
    }
  }

  return {
    origin: [originX, originY],
    ground,
    landmarks,
    pictures,
    coats,
    facings,
    spawns,
    decorations,
    marks,
    lit: plan.sight !== FloorSight.Dark,
  };
}

/** Whoever fights on a cell: a trainer in their coat, or a pokemon */
function standOn(
  options: {
    snapshot: ChunkSnapshot;
    cell: number;
    layout: DungeonLayout;
    floor: number;
    beaten: ReadonlySet<number>;
  },
  grid: CellGrid,
  floorCell: number,
  index: number,
  into: {
    landmarks: Map<number, Landmark>;
    coats: Map<number, string>;
    facings: Map<number, SpriteDirection>;
    spawns: Map<number, SpawnCoat>;
  },
): void {
  const room = grid.rooms.get(floorCell);

  if (room == null) {
    return;
  }

  const { snapshot, cell, layout, floor } = options;
  const last = floor === layout.floors.length - 1;

  // The legendary at the bottom of a Dungeon is a pokemon standing there
  if (layout.kind === DungeonKind.Dungeon && last && floorCell === grid.exit) {
    const legendary = getDungeonLegendary(snapshot, cell);

    if (legendary != null) {
      into.spawns.set(index, {
        id: `dungeon-legendary-${cell}`,
        species: legendary.species,
        shiny: false,
        featured: false,
        rank: 'legendary',
      });
    }
    return;
  }

  const foe = dungeonFoe(snapshot, cell, floor, room);

  if (foe == null) {
    return;
  }
  if (foe.name === '') {
    // A wild horde, shown as the first of it
    if (foe.party.length > 0 && !options.beaten.has(room)) {
      into.spawns.set(index, {
        id: `dungeon-horde-${floor}-${room}`,
        species: foe.party[0][0],
        shiny: false,
        featured: false,
        rank: null,
      });
    }
    return;
  }
  into.landmarks.set(index, Landmark.Trainer);
  into.coats.set(index, foe.sprite);

  const watch = grid.watches.get(floorCell);

  if (watch != null) {
    into.facings.set(index, SPRITE_FACING[watch.facing]);
  }
}
