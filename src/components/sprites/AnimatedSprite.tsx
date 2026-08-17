import { type JSX, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import loadSpeciesSprite from '../../canvas/species-sprites';
import type { Point, SpriteDirection } from '../../canvas/sprite-sheet';
import type { Species } from '../../data/ids/species';

/**
 * A pokemon animating in the document rather than on a canvas.
 *
 * It is [`AtlasSprite`](./AtlasSprite.tsx) with a playhead: the sheet is
 * a background image, the frame showing is where that background is
 * scrolled to, and the box is the cell the artist drew in. What a canvas
 * buys — one surface for many sprites, a drawing order, effects over the
 * top — is worth paying for on a field or in a fight. It is not worth
 * paying for a row of squares that each hold one pokemon standing still,
 * where every square then wants a border, a badge and something anchored
 * to it.
 *
 * Every sprite on the page shares one clock, so a box of thirty is one
 * callback a frame rather than thirty.
 */

/**
 * What a cell is assumed to be until the sheet says otherwise, so a box
 * of squares holds its shape while the sheets are being fetched
 */
const DEFAULT_CELL = 32;

/**
 * The ground under a pokemon, in the same ink the canvases use
 */
const SHADOW = 'rgba(0, 0, 0, 0.28)';

/**
 * Everything that has to be read off the playhead to draw one frame.
 *
 * The picture is measured against the **cell**, not the frame: two
 * animations off one sheet trim differently, and a box that changed size
 * as a pokemon breathed would jitter
 */
interface Drawn {
  source: string;
  sheet: { width: number; height: number };
  cell: { width: number; height: number };
  frame: { x: number; y: number; width: number; height: number };
  trim: Point;
  /** Where the pokemon touches the ground, in cell pixels */
  feet: Point | null;
  shadow: { x: number; y: number };
}

const share = (part: number, whole: number): string => `${whole <= 0 ? 0 : (part / whole) * 100}%`;

/**
 * The frame as a background: a window the size of the trimmed picture,
 * sitting where the trimming left it, with the sheet scrolled to the
 * frame behind it.
 *
 * Every number is a share of the cell so the picture follows a square
 * that is eighty pixels across on a desktop and forty on a phone. The
 * odd one is `background-position`, where a percentage means *line this
 * share of the image up with the same share of the window* — so it is
 * measured against the sheet minus one frame
 */
function pictureOf(drawn: Drawn): JSX.CSSProperties {
  return {
    position: 'absolute',
    left: share(drawn.trim[0], drawn.cell.width),
    top: share(drawn.trim[1], drawn.cell.height),
    width: share(drawn.frame.width, drawn.cell.width),
    height: share(drawn.frame.height, drawn.cell.height),
    'background-image': `url(${drawn.source})`,
    'background-position': `${share(drawn.frame.x, drawn.sheet.width - drawn.frame.width)} ${share(
      drawn.frame.y,
      drawn.sheet.height - drawn.frame.height,
    )}`,
    'background-size': `${share(drawn.sheet.width, drawn.frame.width)} ${share(
      drawn.sheet.height,
      drawn.frame.height,
    )}`,
    'background-repeat': 'no-repeat',
    'image-rendering': 'pixelated',
  };
}

/**
 * The patch of ground it stands on, drawn as a flattened circle under
 * the marked point. Anchors are in the trimmed frame's coordinates, so
 * the trim puts them back in the cell
 */
function groundOf(drawn: Drawn): JSX.CSSProperties | null {
  if (drawn.feet == null) {
    return null;
  }

  const x = drawn.feet[0] + 0.5 + drawn.trim[0];
  const y = drawn.feet[1] + 0.5 + drawn.trim[1];

  return {
    position: 'absolute',
    left: share(x - drawn.shadow.x, drawn.cell.width),
    top: share(y - drawn.shadow.y, drawn.cell.height),
    width: share(drawn.shadow.x * 2, drawn.cell.width),
    height: share(drawn.shadow.y * 2, drawn.cell.height),
    'border-radius': '50%',
    background: SHADOW,
  };
}

/**
 * Every sprite on the page, ticked together. One clock rather than one
 * each: thirty squares of a box would otherwise be thirty animation
 * frames the browser has to schedule and thirty places for them to
 * drift apart
 */
const TICKING = new Set<(elapsed: number) => void>();

let pulse = 0;
let last = 0;

function beat(now: number): void {
  const elapsed = last === 0 ? 0 : now - last;

  last = now;
  // Over a copy: a sprite that unmounts mid-tick leaves the set while
  // it is being walked
  for (const step of [...TICKING]) {
    step(elapsed);
  }

  if (TICKING.size === 0) {
    pulse = 0;
    last = 0;
    return;
  }
  pulse = requestAnimationFrame(beat);
}

function ticking(step: (elapsed: number) => void): () => void {
  TICKING.add(step);
  if (pulse === 0) {
    pulse = requestAnimationFrame(beat);
  }
  return () => {
    TICKING.delete(step);
  };
}

export interface AnimatedSpriteProps {
  species: Species;
  shiny?: boolean;
  /**
   * What it should be doing. A sheet without it falls back to standing
   * still, which every sheet has
   */
  animation?: string;
  direction?: SpriteDirection;
  /**
   * How fast the clip runs against the wall clock, where one is the
   * speed it was drawn at. An egg shakes faster the closer it is to
   * opening, which is the only thing an egg has to say
   */
  speed?: number;
  /**
   * The longest side of the cell, in pixels. Left out, the cell is
   * drawn at the size it was cut
   */
  size?: number;
  /**
   * Whether the cell is fitted to the box it is put in rather than
   * taking a number of pixels. **The box has to be square**: the cell
   * is laid out as a share of it either way round, which is what fits a
   * tall pokemon by its height and a wide one by its width
   */
  fill?: boolean;
  /** Whether to draw the ground under it */
  shadow?: boolean;
  /**
   * What a screen reader is told. An empty string is for a caller that
   * has already named the pokemon beside the picture
   */
  label?: string;
  class?: string;
}

export default function AnimatedSprite(props: AnimatedSpriteProps): JSX.Element {
  const [sprite, setSprite] = createSignal<SpeciesSpriteAnimation | null>(null);
  /**
   * Bumped when a different frame comes up. The playhead moves sixty
   * times a second and the picture changes twenty-four times at most,
   * so the styles are recomputed on the frame rather than on the tick
   */
  const [step, setStep] = createSignal(0);

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
        // A sheet that will not load leaves the box empty; whatever it
        // was illustrating is named beside it in words
      });
  });

  createEffect(() => {
    const drawn = sprite();

    if (drawn == null) {
      return;
    }

    const wanted = props.animation ?? 'Idle';

    drawn.play(drawn.has(wanted) ? wanted : 'Idle', {
      direction: props.direction ?? 'Down',
      loop: true,
    });
    setStep((count) => count + 1);
  });

  createEffect(() => {
    const drawn = sprite();

    if (drawn == null) {
      return;
    }
    onCleanup(
      ticking((elapsed) => {
        const showing = drawn.frame;

        drawn.update(elapsed * (props.speed ?? 1));
        if (drawn.frame !== showing) {
          setStep((count) => count + 1);
        }
      }),
    );
  });

  const drawn = createMemo((): Drawn | null => {
    // The playhead is not reactive, so the frame count is what says a
    // new picture is due
    step();

    const playing = sprite();
    const frame = playing?.frameBox ?? null;

    if (playing == null || frame == null) {
      return null;
    }

    const cell = playing.sourceFrameSize;

    if (cell.width <= 0 || cell.height <= 0) {
      return null;
    }
    return {
      source: playing.source,
      sheet: playing.data.sheet,
      cell,
      frame,
      trim: playing.frameTrim,
      feet: playing.anchor('shadow'),
      shadow: playing.shadowRadius(),
    };
  });

  /**
   * The box the pokemon is drawn in: the cell, sized however the caller
   * asked. It is held before the sheet arrives so a row of squares does
   * not jump about as they load
   */
  const box = (): JSX.CSSProperties => {
    const cell = drawn()?.cell ?? { width: DEFAULT_CELL, height: DEFAULT_CELL };
    const longest = Math.max(1, cell.width, cell.height);

    if (props.fill === true) {
      return {
        width: share(cell.width, longest),
        height: share(cell.height, longest),
      };
    }

    const scale = props.size == null ? 1 : props.size / longest;

    return { width: `${cell.width * scale}px`, height: `${cell.height * scale}px` };
  };

  return (
    <span
      role="img"
      aria-label={props.label ?? ''}
      aria-hidden={props.label == null || props.label === '' ? true : undefined}
      style={box()}
      class={`relative block shrink-0 ${props.class ?? ''}`}
    >
      <Show when={drawn()}>
        {(showing) => (
          <>
            <Show when={props.shadow === true ? groundOf(showing()) : null}>
              {(ground) => <span style={ground()} />}
            </Show>
            <span style={pictureOf(showing())} />
          </>
        )}
      </Show>
    </span>
  );
}
