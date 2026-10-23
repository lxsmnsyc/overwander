import { type JSX, createEffect, on, onCleanup, onMount } from 'solid-js';
import { BOARD_CENTER } from '../../overworld/board';
import { boardIndexOf } from '../../canvas/overworld/board';
import createChunkView, {
  type ChunkCanvasProps,
  type ChunkView,
} from '../../canvas/overworld/chunk-view';
import settings from '../app/settings';

export type {
  CellSpot,
  RiddenCoat,
  SpawnCoat,
  ChunkCanvasProps,
} from '../../canvas/overworld/chunk-view';

/**
 * The chunk the player is standing in: the three canvases it is drawn
 * on, with `src/canvas/overworld/chunk-view` drawing it for as long as
 * they are mounted
 */
export default function ChunkCanvas(props: ChunkCanvasProps): JSX.Element {
  let layer: HTMLCanvasElement | undefined;
  let stage: HTMLCanvasElement | undefined;
  let canvas: HTMLCanvasElement | undefined;
  let view: ChunkView | null = null;

  onMount(() => {
    if (layer == null || stage == null || canvas == null) {
      return;
    }
    // The props themselves, so the board reads them as they change
    const made = createChunkView({ layer, stage, canvas }, props, settings);

    view = made;
    onCleanup(() => {
      view = null;
      made.dispose();
    });
  });

  // Whatever the board is drawn from changing is a picture worth drawing again
  createEffect(
    on([(): unknown[] => Object.values(props), settings], () => {
      view?.invalidate();
    }),
  );

  /** What the player is facing, said for a screen reader since the board is paint */
  const ahead = (): string => {
    const index = boardIndexOf({
      x: BOARD_CENTER + props.facing[0],
      y: BOARD_CENTER + props.facing[1],
    });

    return index == null ? '' : props.label(index);
  };

  return (
    <>
      {/* The picture: the country, the ground, the world standing on
          it, the hour's light, the sky and the compass, all written in
          one pass. It answers no pointer, since the canvas over it
          does */}
      <canvas
        ref={layer}
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 block h-full w-full"
      />
      {/* The scene: the ground, the cliffs and everything standing on
          them, drawn with a depth buffer so a step up hides what is
          behind it however the camera is walked round. The view swaps
          it for a fresh element when the scene is rebuilt */}
      <canvas
        ref={stage}
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 block h-full w-full"
      />
      <canvas
        ref={canvas}
        // Focusable, so the chunk is still reachable by keyboard now
        // that its cells are paint rather than 256 buttons
        tabindex={0}
        // The walking keys are read at the window, and this is what
        // says they still count while the board itself has the
        // keyboard rather than only while nothing does
        data-game-keys=""
        role="application"
        // The caption is painted, so it is said here as well: it is the
        // only place the chunk names itself now
        aria-label={`Chunk map. ${props.caption}. ${ahead() || 'Empty ground'} ahead of you.`}
        // The board takes the gestures rather than the page: a two
        // finger twist here would otherwise be the browser's own pinch,
        // and a drag would scroll whatever is behind it
        style={{ 'touch-action': 'none' }}
        // A line round the picture while the keyboard is in here: the
        // camera keys only work while this has focus
        class="absolute inset-0 block h-full w-full focus:outline-2 focus:-outline-offset-2
          focus:outline-tide"
      />
    </>
  );
}
