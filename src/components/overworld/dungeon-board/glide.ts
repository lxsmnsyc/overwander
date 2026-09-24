import { type Accessor, createSignal, onCleanup } from 'solid-js';

/** How long a slide, a spinner or a hop takes over each cell it carries the player */
const GLIDE_PACE = 110;

export interface Glide {
  /** The cell the player is drawn on while carried, or null once they stand */
  at: Accessor<number | null>;
  /** Carry the player over a step's cells, one at a time */
  play: (path: number[]) => void;
}

/**
 * A step that carries the player several cells is played a cell at a
 * time, since the board snaps anything further than a walk
 */
export default function createGlide(): Glide {
  const [at, setAt] = createSignal<number | null>(null);
  let pacing: ReturnType<typeof setInterval> | undefined;

  onCleanup(() => {
    clearInterval(pacing);
  });

  return {
    at,
    play: (path) => {
      clearInterval(pacing);
      if (path.length <= 1) {
        setAt(null);
        return;
      }

      let next = 0;

      setAt(path[next]);
      pacing = setInterval(() => {
        next += 1;
        if (next >= path.length) {
          clearInterval(pacing);
          setAt(null);
          return;
        }
        setAt(path[next]);
      }, GLIDE_PACE);
    },
  };
}
