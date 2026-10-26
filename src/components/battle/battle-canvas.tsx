import { type JSX, onCleanup, onMount } from 'solid-js';
import createBattleField, { type BattleFieldOptions } from '../../canvas/battle/field';
import { COLORS } from '../../canvas/battle/field/metrics';

export type { UnitSpot } from '../../canvas/battle/field';

/**
 * The battle as a picture: the two canvases the field is drawn on, and
 * `src/canvas/battle/field` drawing it for as long as they are mounted
 */
export default function BattleCanvas(props: BattleFieldOptions): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  let floorCanvas: HTMLCanvasElement | undefined;

  onMount(() => {
    if (canvas != null) {
      // The props themselves, so the field reads them as they change
      onCleanup(createBattleField(canvas, floorCanvas, props));
    }
  });

  return (
    // Sized to the room it is given rather than to its own drawing
    // coordinates. The field is the screen the way the chunk is: a
    // battle is the only thing happening while it is happening, and a
    // picture of it letterboxed in the middle of a page of nothing
    // wastes most of the screen it is the point of
    //
    // Two canvases rather than one, stacked: a 2D context and a GL
    // context cannot be had from the same element, and the ground is
    // written by one while everything standing on it is painted by
    // the other. Copying between them would cost a full-screen blit a
    // frame, which is more than the ground costs to paint at all
    <div class="relative block h-full w-full">
      {/* Under everything, and the field's own colour with it: the
          ground is drawn first, and nothing on this layer is ever
          drawn over what is above it */}
      <canvas
        ref={floorCanvas}
        class="absolute inset-0 block h-full w-full"
        style={{ 'background-color': COLORS.field, 'pointer-events': 'none' }}
      />
      <canvas
        ref={canvas}
        // The field is the page: it takes every pixel it is given, and
        // the fight is drawn in the middle of it
        class="absolute inset-0 block h-full w-full"
        // A drag turns the field rather than scrolling the page behind
        // it, which a touch would otherwise do before the handler ever
        // saw it
        style={{ 'touch-action': 'none' }}
      />
    </div>
  );
}
