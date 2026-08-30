import { For, type JSX, Show, createSignal, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { CellSpot } from './chunk-canvas';
import { usePortalHost } from '../styled/portal-host';

/**
 * What a cell just paid out, said over the cell itself.
 *
 * A toast reports something that happened somewhere; this reports
 * something that happened **there**. A player who digs up a cache is
 * looking at the square they pressed, so what came out of it is drawn
 * over that square and rises off it, rather than in a corner they
 * would have to look away to read.
 *
 * The board is a canvas and this is not: interface art is drawn in the
 * page here. What the canvas lends is the one thing the page cannot
 * work out, where a cell is on the screen.
 */

/** How long one hangs over its cell, and how long it takes to arrive and go */
const LIFETIME = 2000;
const ARRIVING = 260;
const LEAVING = 400;

/** How far above the ground the first note sits, and how far apart they stack */
const LIFT = 12;
const APART = 30;

export type CellNoteTone = 'neutral' | 'leaf' | 'ember';

const TONES: Record<CellNoteTone, string> = {
  neutral: 'border-tide bg-paper text-ink',
  leaf: 'border-leaf bg-leaf-soft text-leaf-dark',
  ember: 'border-ember bg-ember-soft text-ember-dark',
};

export interface CellNoteRequest {
  /** What it says, in as few words as the picture leaves it */
  message?: string;
  /**
   * The thing itself, beside the words. A function, and it has to be:
   * a note is asked for from a handler or a promise, where there is no
   * owner to build markup under
   */
  art?: () => JSX.Element;
  tone?: CellNoteTone;
}

interface CellNote extends CellNoteRequest {
  id: number;
  cell: number;
  /** On its way out, and drawn for `LEAVING` longer because of it */
  leaving: boolean;
}

export interface CellNotes {
  /**
   * Hang one over a cell. Answers false where the board cannot say
   * where that cell is — a list rather than a canvas, a board not yet
   * drawn — so the caller can say it some other way
   */
  say: (cell: number, note: CellNoteRequest) => boolean;
  /** The notes themselves, drawn over the page */
  view: () => JSX.Element;
}

/**
 * Notes over cells, for as long as each lasts.
 *
 * `spotOf` is the canvas' own, handed up when it mounts: it is read
 * every frame rather than once, since the camera turns and the window
 * resizes under a note that is already up
 */
export function createCellNotes(
  spotOf: () => ((cell: number) => CellSpot | null) | null,
): CellNotes {
  const host = usePortalHost();
  const [notes, setNotes] = createSignal<CellNote[]>([]);
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  /** Which element each note is drawn in, so a frame can move it */
  const drawn = new Map<number, HTMLElement>();
  let next = 0;
  let frame: number | undefined;

  const forget = (id: number): void => {
    const timer = timers.get(id);

    if (timer != null) {
      clearTimeout(timer);
      timers.delete(id);
    }
    drawn.delete(id);
    setNotes((shown) => shown.filter((note) => note.id !== id));
  };

  const leave = (id: number): void => {
    setNotes((shown) => shown.map((note) => (note.id === id ? { ...note, leaving: true } : note)));
    timers.set(
      id,
      setTimeout(() => {
        forget(id);
      }, LEAVING),
    );
  };

  /**
   * Put every note where its cell is now. Written straight onto the
   * elements rather than through signals: this runs every frame, and a
   * signal per note per frame is a rebuild of the page's worth of them
   */
  const place = (): void => {
    const found = spotOf();
    const stacked = new Map<number, number>();

    for (const note of notes()) {
      const element = drawn.get(note.id);
      const spot = found?.(note.cell) ?? null;

      if (element == null) {
        continue;
      }
      if (spot == null) {
        element.style.visibility = 'hidden';
        continue;
      }
      const above = stacked.get(note.cell) ?? 0;

      stacked.set(note.cell, above + 1);
      element.style.visibility = 'visible';
      element.style.left = `${spot.x}px`;
      element.style.top = `${spot.y - LIFT - above * APART}px`;
    }
  };

  /** A frame loop that runs only while there is something to place */
  const follow = (): void => {
    place();
    frame = notes().length === 0 ? undefined : requestAnimationFrame(follow);
  };

  onCleanup(() => {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
    if (frame != null) {
      cancelAnimationFrame(frame);
    }
  });

  const say = (cell: number, note: CellNoteRequest): boolean => {
    if (spotOf()?.(cell) == null) {
      return false;
    }
    next += 1;

    const id = next;

    setNotes((shown) => [...shown, { ...note, id, cell, leaving: false }]);
    timers.set(
      id,
      setTimeout(() => {
        leave(id);
      }, LIFETIME),
    );
    frame ??= requestAnimationFrame(follow);
    return true;
  };

  const view = (): JSX.Element => (
    <Portal mount={host()}>
      <For each={notes()}>
        {(note) => (
          // Two elements, because the outer one is moved every frame
          // and the inner one is mid-animation: one element could not
          // be both without the animation fighting the placing
          <div
            ref={(element: HTMLElement) => {
              drawn.set(note.id, element);
              // Placed before its first frame, or it is drawn in the
              // corner for as long as it takes one to run
              queueMicrotask(place);
            }}
            class="pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-full"
          >
            <div
              // Announced rather than read out on arrival, the same as
              // a toast: it reports something that has already happened
              role="status"
              class={`flex max-w-40 items-center gap-1.5 rounded-panel border-2 px-2 py-1 text-xs
                font-bold shadow-pop ${TONES[note.tone ?? 'leaf']}`}
              style={{
                animation: note.leaving
                  ? `cell-note-out ${LEAVING}ms ease-in both`
                  : `cell-note-in ${ARRIVING}ms ease-out both`,
              }}
            >
              <Show when={note.art != null}>
                <span class="flex shrink-0 items-center">{note.art?.()}</span>
              </Show>
              <Show when={note.message}>{(said) => <span class="truncate">{said()}</span>}</Show>
            </div>
          </div>
        )}
      </For>
    </Portal>
  );

  return { say, view };
}
