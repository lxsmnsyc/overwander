import type { CaughtPokemon } from '../../../auth/caught-record';
import type { DungeonRun } from '../../../auth/dungeon-record';
import Abilities from '../../../data/ids/abilities';
import { Items } from '../../../data/ids/items';
import { Moves } from '../../../data/ids/moves';
import DungeonKind, {
  FLOOR_GATE_NAMES,
  FLOOR_GIMMICK_NAMES,
  FLOOR_SIGHT_NAMES,
  FloorGate,
  FloorSight,
  LIT_REACH,
} from '../../../data/overworld/dungeon';
import { FRONTIER_BRAIN_NAMES } from '../../../data/overworld/experts';
import { SYNDICATE_NAMES } from '../../../data/overworld/syndicate';
import type ChunkSnapshot from '../../../overworld/chunk-snapshot';
import {
  DIRECTIONS,
  type DungeonFloor,
  RoomKind,
  doorBetween,
  neighbour,
} from '../../../overworld/dungeon/floor';
import type { DungeonLayout } from '../../../overworld/dungeon/layout';
import { hasFoe } from '../../../overworld/dungeon/stage';
import type { FloorState } from '../../../overworld/dungeon/walk';

/** What the dialog is titled, by who keeps the place */
export function dungeonTitle(layout: DungeonLayout, snapshot: ChunkSnapshot, cell: number): string {
  if (layout.kind === DungeonKind.Hideout) {
    return `${SYNDICATE_NAMES[snapshot.getSyndicate()]} Hideout`;
  }
  if (layout.kind === DungeonKind.Frontier) {
    const brain = snapshot.getFrontierBrain(cell);

    return brain == null ? 'Battle Frontier' : `${FRONTIER_BRAIN_NAMES[brain]}'s Tower`;
  }
  return 'Dungeon';
}

/** A floor's number as a player reads it: basements going down, storeys going up */
export function floorName(kind: DungeonKind, floor: number): string {
  return kind === DungeonKind.Hideout ? `B${floor + 1}F` : `${floor + 1}F`;
}

/** The floor's rules in one line: its layout, its light and its stairs */
export function floorRules(floor: DungeonFloor): string {
  const parts: string[] = [];

  if (floor.gimmick != null) {
    parts.push(FLOOR_GIMMICK_NAMES[floor.gimmick]);
  }
  if (floor.sight != null) {
    parts.push(FLOOR_SIGHT_NAMES[floor.sight]);
  }
  parts.push(FLOOR_GATE_NAMES[floor.gate]);
  return parts.join(' · ');
}

/**
 * Whether the party carries a light: Illuminate, a known Flash, or an
 * Explorer Kit in hand
 */
export function partyIsLit(party: CaughtPokemon[]): boolean {
  for (const one of party) {
    if (
      one.abilities.includes(Abilities.Illuminate) ||
      one.moves.includes(Moves.Flash) ||
      one.items.includes(Items.ExplorerKit)
    ) {
      return true;
    }
  }
  return false;
}

/** How a room is shown: not at all, as a blank room, or with what is in it */
export const enum RoomView {
  Hidden = 0,
  Blank = 1,
  Known = 2,
}

/** Rooms within `reach` doors of any room in `from` */
function within(floor: DungeonFloor, from: number[], reach: number): Set<number> {
  const found = new Set(from);
  let edge = from;

  for (let step = 0; step < reach; step++) {
    const next: number[] = [];

    for (const room of edge) {
      for (const direction of DIRECTIONS) {
        const other = neighbour(floor.size, room, direction);

        if (other >= 0 && !found.has(other) && doorBetween(floor, room, other) >= 0) {
          found.add(other);
          next.push(other);
        }
      }
    }
    edge = next;
  }
  return found;
}

/** How every room on the floor is shown to the player */
export function roomViews(floor: DungeonFloor, state: FloorState, lit: boolean): RoomView[] {
  const views: RoomView[] = [];
  const seen = new Set(state.seen);
  const beside = floor.sight === FloorSight.Dark ? within(floor, state.seen, 1) : null;
  const lamp = floor.sight === FloorSight.Dark && lit ? within(floor, [state.at], LIT_REACH) : null;

  for (let room = 0; room < floor.rooms.length; room++) {
    if (seen.has(room) || lamp?.has(room) === true) {
      views.push(RoomView.Known);
    } else if (floor.sight === FloorSight.Dark) {
      views.push(beside?.has(room) === true ? RoomView.Blank : RoomView.Hidden);
    } else if (floor.sight === FloorSight.Unmarked) {
      views.push(RoomView.Blank);
    } else {
      views.push(RoomView.Known);
    }
  }
  return views;
}

/** The mark a known room is drawn with */
export function roomMark(
  layout: DungeonLayout,
  run: DungeonRun,
  floor: DungeonFloor,
  room: number,
): string {
  const at = floor.rooms[room];
  const state = run.state;
  const taken = state?.taken.includes(room) === true;

  if (at.kind === RoomKind.Boss) {
    return '★';
  }
  if (at.kind === RoomKind.Stairs) {
    return layout.kind === DungeonKind.Hideout ? '▼' : '▲';
  }
  if (hasFoe(layout, run.floor, room) && !run.beaten.includes(room)) {
    return '!';
  }
  if (at.kind === RoomKind.Stash && !run.looted.includes(`${run.floor}:${room}`)) {
    return '◆';
  }
  if (at.key === true && !taken) {
    return 'K';
  }
  if (at.pass === true && !taken) {
    return 'P';
  }
  if (at.switch === true) {
    return 'S';
  }
  if (at.warp != null) {
    return '◎';
  }
  if (at.arrow != null) {
    return ['↑', '→', '↓', '←'][at.arrow];
  }
  return '';
}

/** What the stairs still ask for, or null when they are open */
export function stairsWant(run: DungeonRun, floor: DungeonFloor): string | null {
  if (floor.gate === FloorGate.Guard && !run.beaten.includes(floor.exit)) {
    return 'The guard on the stairs is still standing.';
  }
  if (floor.gate === FloorGate.Pass && run.state?.pass !== true) {
    return 'The stairs want this floor’s pass.';
  }
  return null;
}
