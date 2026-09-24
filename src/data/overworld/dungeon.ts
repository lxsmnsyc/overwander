import { Moves } from '../ids/moves';

/**
 * A landmark with floors under or above it, cleared once per window.
 * Failing a run sends the player back to the first floor, not out of
 * the window
 */
const enum DungeonKind {
  /** A syndicate's base, going down. Its boss waits on the last floor */
  Hideout = 0,
  /** Ruins or a cavern, ending in a legendary that cannot flee */
  Dungeon = 1,
  /** A tower of plain fights, one a floor, with a Frontier Brain on top */
  Frontier = 2,
}

export default DungeonKind;

export const DUNGEON_NAMES: Record<DungeonKind, string> = {
  [DungeonKind.Hideout]: 'Hideout',
  [DungeonKind.Dungeon]: 'Dungeon',
  [DungeonKind.Frontier]: 'Frontier',
};

/** How many floors each kind has, fewest to most */
export const DUNGEON_FLOORS: Record<DungeonKind, [min: number, max: number]> = {
  [DungeonKind.Hideout]: [3, 5],
  [DungeonKind.Dungeon]: [3, 7],
  // The Battle Tower's seven, the last of them the Brain
  [DungeonKind.Frontier]: [7, 7],
};

/**
 * How a Hideout or Dungeon floor's rooms behave. Every mapped floor
 * rolls one of these; a Frontier floor has no map and so none
 */
export const enum FloorGimmick {
  /** Some rooms carry an arrow that slides the player on to the next room */
  Spinner = 0,
  /** Paired pads join islands of rooms that no door joins */
  Warp = 1,
  /** A move slides on until a wall or a rough room stops it */
  Ice = 2,
  /** Each room can be entered once: it crumbles behind the player */
  Cracked = 3,
  /** Boulders, rocks, trees and water that only a known move clears */
  FieldMoves = 4,
  /** Doors opened by the floor's own key, found on the same floor */
  LockedDoors = 5,
  /** Two sets of barriers, one open at a time, flipped by a switch */
  Barriers = 6,
  /** Doors crossed in one direction only */
  Ledges = 7,
}

export const FLOOR_GIMMICKS = [
  FloorGimmick.Spinner,
  FloorGimmick.Warp,
  FloorGimmick.Ice,
  FloorGimmick.Cracked,
  FloorGimmick.FieldMoves,
  FloorGimmick.LockedDoors,
  FloorGimmick.Barriers,
  FloorGimmick.Ledges,
];

export const FLOOR_GIMMICK_NAMES: Record<FloorGimmick, string> = {
  [FloorGimmick.Spinner]: 'Spinner Tiles',
  [FloorGimmick.Warp]: 'Warp Pads',
  [FloorGimmick.Ice]: 'Ice Floor',
  [FloorGimmick.Cracked]: 'Cracked Floor',
  [FloorGimmick.FieldMoves]: 'Obstacles',
  [FloorGimmick.LockedDoors]: 'Locked Doors',
  [FloorGimmick.Barriers]: 'Barriers',
  [FloorGimmick.Ledges]: 'Ledges',
};

/** How much of a mapped floor the player can see */
export const enum FloorSight {
  /** Every room and what is in it */
  Plain = 0,
  /** Only rooms beside one already entered, and not what is in them */
  Dark = 1,
  /** Every room, but none says what it holds until entered */
  Unmarked = 2,
}

export const FLOOR_SIGHTS = [FloorSight.Plain, FloorSight.Dark, FloorSight.Unmarked];

export const FLOOR_SIGHT_NAMES: Record<FloorSight, string> = {
  [FloorSight.Plain]: 'Lit',
  [FloorSight.Dark]: 'Dark',
  [FloorSight.Unmarked]: 'Unmarked',
};

/**
 * How often each kind rolls each gimmick. Every approved gimmick can
 * turn up in both; the heavier weights are the ones that suit the place
 */
export const FLOOR_GIMMICK_WEIGHTS: Record<
  DungeonKind.Hideout | DungeonKind.Dungeon,
  Record<FloorGimmick, number>
> = {
  [DungeonKind.Hideout]: {
    [FloorGimmick.Spinner]: 3,
    [FloorGimmick.Warp]: 3,
    [FloorGimmick.Ice]: 1,
    [FloorGimmick.Cracked]: 1,
    [FloorGimmick.FieldMoves]: 1,
    [FloorGimmick.LockedDoors]: 3,
    [FloorGimmick.Barriers]: 3,
    [FloorGimmick.Ledges]: 1,
  },
  [DungeonKind.Dungeon]: {
    [FloorGimmick.Spinner]: 1,
    [FloorGimmick.Warp]: 1,
    [FloorGimmick.Ice]: 3,
    [FloorGimmick.Cracked]: 3,
    [FloorGimmick.FieldMoves]: 3,
    [FloorGimmick.LockedDoors]: 1,
    [FloorGimmick.Barriers]: 1,
    [FloorGimmick.Ledges]: 3,
  },
};

export const FLOOR_SIGHT_WEIGHTS: Record<
  DungeonKind.Hideout | DungeonKind.Dungeon,
  Record<FloorSight, number>
> = {
  [DungeonKind.Hideout]: {
    [FloorSight.Plain]: 2,
    [FloorSight.Dark]: 1,
    [FloorSight.Unmarked]: 2,
  },
  [DungeonKind.Dungeon]: {
    [FloorSight.Plain]: 1,
    [FloorSight.Dark]: 2,
    [FloorSight.Unmarked]: 1,
  },
};

/** What a player must have done before the stairs take them up or down */
export const enum FloorGate {
  /** Beaten the trainer standing on the stairs */
  Guard = 0,
  /** Picked up the floor's pass, which lies somewhere on it */
  Pass = 1,
  /** The last floor: the boss is the way out */
  Boss = 2,
}

export const FLOOR_GATE_NAMES: Record<FloorGate, string> = {
  [FloorGate.Guard]: 'Guarded stairs',
  [FloorGate.Pass]: 'Floor pass',
  [FloorGate.Boss]: 'Boss',
};

/** The moves that clear an obstacle, each with what it clears */
export const OBSTACLE_MOVES = [Moves.Strength, Moves.RockSmash, Moves.Cut, Moves.Surf] as const;

export type ObstacleMove = (typeof OBSTACLE_MOVES)[number];

export const OBSTACLE_NAMES: Record<ObstacleMove, string> = {
  [Moves.Strength]: 'Boulder',
  [Moves.RockSmash]: 'Cracked rock',
  [Moves.Cut]: 'Thin tree',
  [Moves.Surf]: 'Water',
};

/** Rooms a light reaches on a dark floor, counted in doors */
export const LIT_REACH = 2;

/** Grid width and height by floor, growing with depth */
export function floorSize(depth: number): number {
  return Math.min(5, 3 + Math.floor(depth / 2));
}
