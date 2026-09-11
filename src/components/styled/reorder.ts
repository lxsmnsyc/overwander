import { type Accessor, createSignal, onCleanup } from 'solid-js';

/**
 * A list the player can put in another order by dragging it.
 *
 * The list itself is the caller's: this says which entry is being
 * carried and where it has been dropped, and the caller moves it in
 * whatever it is drawing from. Entries move as the pointer passes
 * them rather than on a drop, so what the player is looking at while
 * they drag is the order they are making.
 *
 * A mouse lifts an entry as soon as it moves; a finger has to hold it
 * first, since a finger drawn across a list is usually scrolling it.
 */

/** How far a pointer travels before it is a drag rather than a press */
const SLACK = 6;

/** How long a finger holds an entry before it lifts, in milliseconds */
const HOLD = 250;

export interface ReorderOptions {
  /** Whether anything may be moved at all */
  enabled: () => boolean;
  /**
   * Carry the entry at `from` to `to`. Called as the pointer crosses
   * each entry, so a drag across three of them arrives as three moves
   */
  onMove: (from: number, to: number) => void;
}

/** What an entry of the list needs on it to be draggable */
export interface ReorderItemProps {
  'data-reorder': number;
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export interface Reorder {
  /** Goes on the element the entries are drawn in */
  listProps: { ref: (element: HTMLElement) => void };
  /** Goes on each entry, which is what takes the pointer */
  itemProps: (index: number) => ReorderItemProps;
  /** Which entry is being carried, for drawing it as lifted */
  held: Accessor<number | null>;
}

/** Where the entry under this point is, or null for none of them */
function indexAt(list: HTMLElement | undefined, x: number, y: number): number | null {
  if (list == null) {
    return null;
  }

  for (const element of document.elementsFromPoint(x, y)) {
    const entry = element.closest<HTMLElement>('[data-reorder]');

    if (entry != null && list.contains(entry)) {
      return Number(entry.dataset.reorder);
    }
  }
  return null;
}

/**
 * Whether the pointer has gone past the middle of the entry it is
 * over, the way it is travelling. Without it a drag between two
 * entries of different heights swaps them back and forth
 */
function past(list: HTMLElement | undefined, index: number, y: number, down: boolean): boolean {
  const entry = list?.querySelector<HTMLElement>(`[data-reorder="${index}"]`);

  if (entry == null) {
    return true;
  }

  const box = entry.getBoundingClientRect();
  const middle = box.top + box.height / 2;

  return down ? y > middle : y < middle;
}

export default function createReorder(options: ReorderOptions): Reorder {
  let list: HTMLElement | undefined;
  let lifting: ReturnType<typeof setTimeout> | null = null;
  /** The drag in progress: which pointer, where it started, where the entry is now */
  let drag: { pointer: number; at: number; x: number; y: number; lifted: boolean } | null = null;
  const [held, setHeld] = createSignal<number | null>(null);

  /**
   * A finger that has lifted an entry is not scrolling with it. The
   * page is told through a listener rather than through `touch-action`
   * on the entry: the browser reads that when the touch starts, which
   * is before anybody knows whether this one is a drag
   */
  const block = (event: TouchEvent): void => {
    event.preventDefault();
  };

  const lift = (): void => {
    if (drag == null) {
      return;
    }
    drag.lifted = true;
    setHeld(drag.at);
    window.addEventListener('touchmove', block, { passive: false });
  };

  const drop = (): void => {
    if (lifting != null) {
      clearTimeout(lifting);
      lifting = null;
    }
    drag = null;
    setHeld(null);
    window.removeEventListener('touchmove', block);
  };

  onCleanup(drop);

  const move = (index: number, by: number): void => {
    const to = index + by;

    if (!options.enabled() || to < 0) {
      return;
    }
    options.onMove(index, to);
  };

  return {
    listProps: {
      ref: (element: HTMLElement): void => {
        list = element;
      },
    },
    held,
    itemProps: (index: number) => ({
      'data-reorder': index,
      onPointerDown: (event: PointerEvent): void => {
        // The left button only, and never while the list is being
        // read rather than arranged
        if (!options.enabled() || event.button !== 0) {
          return;
        }
        drag = {
          pointer: event.pointerId,
          at: index,
          x: event.clientX,
          y: event.clientY,
          lifted: false,
        };

        if (event.pointerType === 'touch') {
          lifting = setTimeout(lift, HOLD);
        }
      },
      onPointerMove: (event: PointerEvent): void => {
        const carrying = drag;

        if (carrying == null || carrying.pointer !== event.pointerId) {
          return;
        }

        const gone = Math.hypot(event.clientX - carrying.x, event.clientY - carrying.y);

        if (!carrying.lifted) {
          // A finger that moves before it has held is scrolling, and
          // a mouse that moves at all is dragging
          if (event.pointerType === 'touch') {
            if (gone > SLACK) {
              drop();
            }
            return;
          }
          if (gone <= SLACK) {
            return;
          }
          lift();
        }

        const over = indexAt(list, event.clientX, event.clientY);

        if (over == null || over === carrying.at) {
          return;
        }
        if (!past(list, over, event.clientY, over > carrying.at)) {
          return;
        }
        options.onMove(carrying.at, over);
        carrying.at = over;
        setHeld(over);
      },
      onPointerUp: (): void => {
        drop();
      },
      onPointerCancel: (): void => {
        drop();
      },
      onKeyDown: (event: KeyboardEvent): void => {
        // The same thing without a pointer. Held with a modifier so
        // the arrows still walk the list for a screen reader
        if (!event.altKey || event.ctrlKey || event.metaKey) {
          return;
        }
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
          event.preventDefault();
          move(index, -1);
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
          event.preventDefault();
          move(index, 1);
        }
      },
    }),
  };
}

/** The same list with one entry carried to another place in it */
export function carried<T>(entries: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= entries.length || to >= entries.length) {
    return [...entries];
  }

  const moved = [...entries];
  const [carrying] = moved.splice(from, 1);

  moved.splice(to, 0, carrying);
  return moved;
}
