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

/**
 * How much room a sparkle needs **above** the pokemon, as a share of
 * the picture's width.
 *
 * The stars are thrown up the body and drift further up as they fade,
 * so the topmost of them sits above the frame the sprite is cut to —
 * and a canvas cut to the sprite clips it off in a straight line,
 * which reads as the sparkle hitting a ceiling. The frame is grown
 * upwards by this and the pokemon put back on its own floor, so it
 * stands exactly where it stood
 */
const SPARKLE_HEADROOM = 0.45;

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
   * Whether the canvas takes the whole width it is given rather than
   * being cut to the picture.
   *
   * The pokemon is drawn the same size either way and stays in the
   * middle; what changes is how much room there is **around** it. A
   * sparkle is thrown wider than the sprite it belongs to, so a box
   * cut to the sprite clips the outermost stars — and anything showing
   * one pokemon on its own has a whole dialog's width going spare
   */
  stretch?: boolean;
  /**
   * What it should be doing. A sheet that has not got it falls back to
   * standing still, which every sheet has
   */
  animation?: string;
  /**
   * How long one pass of it should take, in milliseconds, instead of
   * the speed the sheet was drawn at.
   *
   * The clip is stretched rather than cut — every frame is held
   * proportionally longer — so it is a way of saying how leisurely a
   * loop should be. A turn on the spot is the case that wants it: the
   * sheets spin fast enough to read as a fidget, and a dex entry is
   * something looked at rather than glanced at
   */
  duration?: number;
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
      // Only where a caller asked for a pace: everything else plays at
      // the speed it was drawn at, which is the speed the rest of the
      // game shows it at
      duration: props.duration,
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
      // Room over its head for the stars, where there are stars to
      // make room for. It is added to the frame rather than taken out
      // of the picture: the pokemon keeps its size and its floor, and
      // the canvas is simply taller
      const headroom = props.sparkle === true ? Math.round(width * scale * SPARKLE_HEADROOM) : 0;
      const floor = (feet == null ? height * scale : (feet[1] + 0.5) * scale) + headroom;
      // Room for the picture and for the shadow under it, whichever
      // reaches lower. On a trimmed sheet they are not the same: a
      // frame is cropped to what is drawn, so the ground a flying
      // pokemon casts its shadow on is below the bottom of its frame
      const room = {
        // As wide as the picture, or as wide as whatever it was given
        // — the element's own laid-out width, which is what `stretch`
        // asks the stylesheet for
        width:
          props.stretch === true
            ? Math.max(1, Math.round(element.clientWidth))
            : Math.round(width * scale),
        height: Math.max(
          height * scale + headroom,
          Math.round(floor + drawn.shadowRadius(scale).y + 1),
        ),
      };

      // The canvas is sized from the animation rather than by the
      // caller: a frame is as big as it is, and a box guessed at
      // would either crop the pokemon or leave a hole. The height is
      // the sprite's own even when the width is the room's, so a
      // stretched picture is a wider frame rather than a bigger
      // pokemon
      if (element.width !== room.width * ratio || element.height !== room.height * ratio) {
        element.width = room.width * ratio;
        element.height = room.height * ratio;
        // Left to the stylesheet where the caller asked for the whole
        // width: setting it in pixels here would pin the canvas to
        // whatever the room happened to be on the frame it was read
        element.style.width = props.stretch === true ? '100%' : `${room.width}px`;
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
          // Held in where the box is cut to the sprite, and thrown as
          // wide as the overworld throws them where there is room
          spread: props.stretch === true ? undefined : SPARKLE_SPREAD,
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
      class={`block [image-rendering:pixelated] ${props.stretch === true ? 'w-full' : ''} ${
        props.class ?? ''
      }`}
    />
  );
}
