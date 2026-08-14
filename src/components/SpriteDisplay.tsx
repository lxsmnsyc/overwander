import { type JSX, createEffect, createSignal, onCleanup } from 'solid-js';
import type SpeciesSpriteAnimation from '../canvas/species-sprite-animation';
import type { SpriteDirection } from '../canvas/sprite-sheet';
import drawSparkle from '../canvas/sparkle';
import loadSpeciesSprite from '../canvas/species-sprites';
import type { Species } from '../data/ids/species';

/**
 * One pokemon, animating, wherever a dialog wants to show what it is
 * talking about.
 *
 * The canvases draw their own sprites as part of a bigger picture —
 * a field of spawns, two sides of a fight — and drive them off their
 * own clocks. This is for the rest of the game: a lair saying what is
 * waiting in it, an encounter showing what is standing in front of
 * the player, a catch sheet showing what the record is about. It
 * carries its own clock because nothing else here has one.
 */

/**
 * How many pixels a frame is blown up by. The sheets are small — a
 * frame is a few dozen pixels — and the scale is the caller's, since
 * a preview beside a paragraph and one at the top of a sheet are not
 * the same size
 */
const DEFAULT_SCALE = 3;

/**
 * How far to either side of the picture the sparkle's stars may fall.
 *
 * Narrower than the board's, because this canvas is cut to the sprite
 * rather than being a whole field: a star thrown as wide as the
 * overworld throws them would be clipped off at the edge of the box
 */
const SPARKLE_SPREAD = 0.9;

export interface SpriteDisplayProps {
  species: Species;
  shiny?: boolean;
  /**
   * Whether to throw a handful of stars over it as it appears, once.
   *
   * It is the caller's rather than something read off `shiny`, because
   * not everywhere that draws a shiny is a place worth announcing one:
   * a catch sheet is a record being read, and something standing in
   * front of the player is a thing being met
   */
  sparkle?: boolean;
  /**
   * What it should be doing. A sheet that has not got it falls back to
   * standing still, which every sheet has
   */
  animation?: string;
  direction?: SpriteDirection;
  scale?: number;
  class?: string;
  /**
   * What a screen reader is told. It is a picture of a pokemon, so
   * the caller says which one — the sprite itself knows only a number
   */
  label: string;
}

export default function SpriteDisplay(props: SpriteDisplayProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  const [sprite, setSprite] = createSignal<SpeciesSpriteAnimation | null>(null);

  // One sheet per pokemon shown, cloned off whatever is already
  // loaded. A dialog that opens on the same species twice pays for it
  // once
  createEffect(() => {
    const species = props.species;
    const shiny = props.shiny === true;
    let live = true;

    onCleanup(() => {
      live = false;
    });

    loadSpeciesSprite(species, { shiny })
      .then((loaded) => {
        if (live) {
          setSprite(loaded);
        }
      })
      .catch(() => {
        // A sprite that will not load is a picture the game does
        // without; everything it illustrates is written beside it
      });
  });

  createEffect(() => {
    const drawn = sprite();
    const element = canvas;

    if (drawn == null || element == null) {
      return;
    }

    const wanted = props.animation ?? 'Idle';

    drawn.play(drawn.has(wanted) ? wanted : 'Idle', {
      direction: props.direction ?? 'Down',
      loop: true,
    });

    const scale = props.scale ?? DEFAULT_SCALE;
    const context = element.getContext('2d');

    if (context == null) {
      return;
    }

    const ratio = globalThis.devicePixelRatio > 0 ? globalThis.devicePixelRatio : 1;
    let last = 0;
    let frame = 0;
    // How long this sprite has been on screen. The sparkle is measured
    // against the frames that actually ran rather than against the
    // wall, so a dialog opened behind another tab still gets its
    // announcement when it is looked at
    let shown = 0;

    const paint = (now: number): void => {
      frame = requestAnimationFrame(paint);

      const { width, height } = drawn.frameSize;
      // The box is the picture rather than the cell it was drawn in.
      // The frames on a compact sheet are already cropped to what is
      // lit, and the sheet marks the point that stands on the ground,
      // so nothing here has to guess at how much empty ground to trim
      // off the bottom — which is what it used to do, badly, on the
      // sheets drawn tall enough for a wingspan
      const feet = drawn.anchor('shadow');
      const floor = feet == null ? height * scale : (feet[1] + 0.5) * scale;
      // Room for the picture and for the shadow under it, whichever
      // reaches lower. On a trimmed sheet they are not the same: a
      // frame is cropped to what is drawn, so the ground a flying
      // pokemon casts its shadow on is below the bottom of its frame
      const room = {
        width: width * scale,
        height: Math.max(height * scale, Math.round(floor + drawn.shadowRadius(scale).y + 1)),
      };

      // The canvas is sized from the animation rather than by the
      // caller: a frame is as big as it is, and a box guessed at
      // would either crop the pokemon or leave a hole
      if (element.width !== room.width * ratio || element.height !== room.height * ratio) {
        element.width = room.width * ratio;
        element.height = room.height * ratio;
        element.style.width = `${room.width}px`;
        element.style.height = `${room.height}px`;
      }

      const elapsed = last === 0 ? 0 : now - last;

      drawn.update(elapsed);
      last = now;
      shown += elapsed;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, room.width, room.height);

      // Standing on the floor of its own box, with the shadow it casts
      // drawn on it: a picture of a pokemon with nothing under it
      // reads as a pokemon hanging in the air, and the sheets have
      // always carried the size of one
      const placement = { scale, anchor: 'shadow' } as const;

      drawn.drawShadow(context, room.width / 2, floor, placement);
      drawn.draw(context, room.width / 2, floor, placement);

      if (props.sparkle === true) {
        // Seeded by the species, since there is only one pokemon here
        // to tell apart from another: two of the same shown side by
        // side glint the same way, which is what a still picture of
        // one pokemon wants
        drawSparkle(context, props.species, shown, room.width / 2, floor, drawn.frameSize, scale, {
          spread: SPARKLE_SPREAD,
        });
      }
    };

    frame = requestAnimationFrame(paint);
    onCleanup(() => {
      cancelAnimationFrame(frame);
    });
  });

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={props.label}
      class={`block [image-rendering:pixelated] ${props.class ?? ''}`}
    />
  );
}
