import { type JSX, createEffect, createSignal, onCleanup } from 'solid-js';
import type SpeciesSpriteAnimation from '../canvas/species-sprite-animation';
import type { SpriteDirection } from '../canvas/species-sprite-animation';
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

export interface SpriteDisplayProps {
  species: Species;
  shiny?: boolean;
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
      direction: props.direction ?? 'down',
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

    const paint = (now: number): void => {
      frame = requestAnimationFrame(paint);

      const { width, height } = drawn.frameSize;
      const room = { width: width * scale, height: height * scale };

      // The canvas is sized from the animation rather than by the
      // caller: a frame is as big as it is, and a box guessed at
      // would either crop the pokemon or leave a hole
      if (element.width !== room.width * ratio || element.height !== room.height * ratio) {
        element.width = room.width * ratio;
        element.height = room.height * ratio;
        element.style.width = `${room.width}px`;
        element.style.height = `${room.height}px`;
      }

      drawn.update(last === 0 ? 0 : now - last);
      last = now;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, room.width, room.height);
      drawn.draw(context, room.width / 2, room.height, { scale, anchor: 'bottom' });
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
