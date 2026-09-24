import { For, type JSX } from 'solid-js';
import type { DungeonRun } from '../../../auth/dungeon-record';
import { OBSTACLE_NAMES } from '../../../data/overworld/dungeon';
import {
  DIRECTIONS,
  type Direction,
  DoorKind,
  type DungeonFloor,
  doorBetween,
  neighbour,
} from '../../../overworld/dungeon/floor';
import type { DungeonLayout } from '../../../overworld/dungeon/layout';
import { RoomView, roomMark, roomViews } from './describe';

const SIDES = ['border-top', 'border-right', 'border-bottom', 'border-left'] as const;

/** How one side of a room is drawn: a wall, an open way, or a door that asks something */
function sideStyle(
  floor: DungeonFloor,
  run: DungeonRun,
  room: number,
  direction: Direction,
): [css: string, title: string | null] {
  const other = neighbour(floor.size, room, direction);
  const index = other < 0 ? -1 : doorBetween(floor, room, other);

  if (index < 0) {
    return ['3px solid var(--color-ink)', null];
  }

  const door = floor.doors[index];

  switch (door.kind) {
    case DoorKind.Ledge:
      return door.to === room
        ? ['3px dotted var(--color-tide)', 'A ledge you can only drop down']
        : ['3px dotted transparent', null];
    case DoorKind.Locked:
      return run.state?.opened.includes(index) === true
        ? ['3px solid transparent', null]
        : ['3px dashed var(--color-gold)', 'Locked: the floor’s key opens it'];
    case DoorKind.Obstacle:
      return [
        '3px dashed var(--color-leaf)',
        door.move == null ? null : `${OBSTACLE_NAMES[door.move]} in the way`,
      ];
    case DoorKind.Barrier: {
      const open = (door.set === 1) === run.state?.flipped;

      return open
        ? ['3px solid transparent', null]
        : ['3px dashed var(--color-ember)', 'A barrier, flipped by a switch'];
    }
    default:
      return ['3px solid transparent', null];
  }
}

/**
 * A mapped floor as a grid of rooms. Walls are solid, doors that ask
 * for something are dashed, and the room the player stands in is lit
 */
export default function FloorMap(props: {
  layout: DungeonLayout;
  run: DungeonRun;
  floor: DungeonFloor;
  lit: boolean;
}): JSX.Element {
  const views = (): RoomView[] =>
    props.run.state == null ? [] : roomViews(props.floor, props.run.state, props.lit);
  const rooms = (): number[] => [...props.floor.rooms.keys()];

  return (
    <div
      class="mx-auto grid aspect-square w-full max-w-72 gap-0"
      style={{ 'grid-template-columns': `repeat(${props.floor.size}, minmax(0, 1fr))` }}
      role="img"
      aria-label="Floor map"
    >
      <For each={rooms()}>
        {(room) => {
          const view = (): RoomView => views()[room] ?? RoomView.Hidden;
          const here = (): boolean => props.run.state?.at === room;
          const style = (): JSX.CSSProperties => {
            const css: JSX.CSSProperties = {};

            if (view() === RoomView.Hidden) {
              return css;
            }
            for (const direction of DIRECTIONS) {
              css[SIDES[direction]] = sideStyle(props.floor, props.run, room, direction)[0];
            }
            return css;
          };
          const title = (): string | undefined => {
            if (view() === RoomView.Hidden) {
              return undefined;
            }

            const notes: string[] = [];

            for (const direction of DIRECTIONS) {
              const said = sideStyle(props.floor, props.run, room, direction)[1];

              if (said != null) {
                notes.push(said);
              }
            }
            return notes.length > 0 ? notes.join('. ') : undefined;
          };

          const mark = (): string => {
            if (here()) {
              return '●';
            }
            return view() === RoomView.Known
              ? roomMark(props.layout, props.run, props.floor, room)
              : '';
          };

          return (
            <div
              class="flex aspect-square items-center justify-center text-sm font-bold"
              classList={{
                'bg-shade': view() === RoomView.Hidden,
                'bg-paper': view() !== RoomView.Hidden && !here(),
                'bg-tide-soft': here(),
                'bg-gold-soft':
                  props.floor.rooms[room].rough === true && view() === RoomView.Known && !here(),
                'opacity-40': props.run.state?.crumbled.includes(room) === true,
              }}
              style={style()}
              title={title()}
            >
              {mark()}
            </div>
          );
        }}
      </For>
    </div>
  );
}
