import {
  type Accessor,
  For,
  type JSX,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import loadSpeciesSprite from '../../canvas/species-sprites';
import {
  SPARKLE_COLORS,
  SPARKLE_SPREAD,
  SPARKLE_STARS,
  SPARKLE_STAR_LIFE,
  SPARKLE_STAR_SIZE,
  sparkleStar,
} from '../../canvas/sparkle';
import type { Point, SpriteDirection } from '../../canvas/sprite-sheet';
import type { Species } from '../../data/ids/species';
import { SpriteAnim } from '../../data/ids/sprite-anims';

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
 * The picture is measured against the **clip's box** rather than the
 * cell it was drawn in. The cell is authored generously — a Hop is
 * given room for a jump twice the height anything reaches — and the
 * empty half of it would be padding round every card. The box is one
 * size for the whole clip, so nothing jitters as the pokemon breathes
 */
interface Drawn {
  source: string;
  sheet: { width: number; height: number };
  cell: { width: number; height: number };
  /**
   * The picture on the sheet, and whether it is this frame reflected.
   *
   * A sheet keeps one copy of every repeated drawing, so a frame drawn
   * facing left may be the right-facing picture stored once and turned
   * over — which a background has to do for itself
   */
  frame: { x: number; y: number; width: number; height: number; mirrored: boolean };
  /** Where the picture hangs inside the box, as `[x, y]` */
  trim: Point;
  /** Where the pokemon touches the ground, in box pixels */
  feet: Point | null;
  shadow: { x: number; y: number };
  /**
   * Everything the sprite paints, in box pixels: the box itself, grown
   * to hold the shadow where one is drawn. It is what the element is
   * sized to and what every share below is measured against, so a
   * shadow wider than the box is inside the element rather than
   * hanging out of it for a square to shave off
   */
  bounds: { x: number; y: number; width: number; height: number };
}

/** The box and the shadow under it as one rectangle */
function boundsOf(
  cell: { width: number; height: number },
  feet: Point | null,
  shadow: { x: number; y: number },
): { x: number; y: number; width: number; height: number } {
  if (feet == null) {
    return { x: 0, y: 0, width: cell.width, height: cell.height };
  }

  const x = feet[0] + 0.5;
  const y = feet[1] + 0.5;
  const left = Math.min(0, x - shadow.x);
  const top = Math.min(0, y - shadow.y);

  return {
    x: left,
    y: top,
    width: Math.max(cell.width, x + shadow.x) - left,
    height: Math.max(cell.height, y + shadow.y) - top,
  };
}

const share = (part: number, whole: number): string => `${whole <= 0 ? 0 : (part / whole) * 100}%`;

/**
 * The frame as a background: a window the size of the picture, sitting
 * where the clip hangs it, with the sheet scrolled to the picture
 * behind it.
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
    left: share(drawn.trim[0] - drawn.bounds.x, drawn.bounds.width),
    top: share(drawn.trim[1] - drawn.bounds.y, drawn.bounds.height),
    width: share(drawn.frame.width, drawn.bounds.width),
    height: share(drawn.frame.height, drawn.bounds.height),
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
    // Turned over where the sheet kept only the other side of the pair
    transform: drawn.frame.mirrored ? 'scaleX(-1)' : undefined,
  };
}

/**
 * The patch of ground it stands on, drawn as a flattened circle under
 * the marked point. Anchors are already in the box's coordinates
 */
function groundOf(drawn: Drawn): JSX.CSSProperties | null {
  if (drawn.feet == null) {
    return null;
  }

  const x = drawn.feet[0] + 0.5;
  const y = drawn.feet[1] + 0.5;

  return {
    position: 'absolute',
    left: share(x - drawn.shadow.x - drawn.bounds.x, drawn.bounds.width),
    top: share(y - drawn.shadow.y - drawn.bounds.y, drawn.bounds.height),
    width: share(drawn.shadow.x * 2, drawn.bounds.width),
    height: share(drawn.shadow.y * 2, drawn.bounds.height),
    'border-radius': '50%',
    background: SHADOW,
  };
}

/**
 * The four-pointed glint a sparkle is made of, as a shape rather than a
 * glyph: a diamond with its sides pulled in, which is how a star has
 * been drawn for as long as anything has been drawn sparkling
 */
const STAR = 'polygon(50% 0%, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0% 50%, 42% 42%)';

/**
 * Where each star of a sparkle sits, in shares of the cell, and when it
 * lights.
 *
 * The placement is the canvas sparkle's own — same seed, same scatter —
 * so a shiny met in the overworld and the same shiny met in a dialog
 * glint the same way. What differs is that the browser runs the star
 * rather than a draw loop: one keyframe, one delay each
 */
function starsOf(drawn: Drawn, seed: number): JSX.CSSProperties[] {
  const across = drawn.frame.width / drawn.bounds.width;
  const up = drawn.frame.height / drawn.bounds.height;
  // The middle of the box rather than of the element: the shadow may
  // have widened one side and the pokemon has not moved
  const middle = (drawn.cell.width / 2 - drawn.bounds.x) / drawn.bounds.width;
  // The stars are thrown up from the point the pokemon stands on, which
  // is not the bottom of the box on a clip that leaves the ground
  const floor =
    (drawn.feet == null ? drawn.cell.height : drawn.feet[1] + 0.5 - drawn.bounds.y) /
    drawn.bounds.height;
  const size = across * SPARKLE_STAR_SIZE * 2;

  return Array.from({ length: SPARKLE_STARS }, (_, star) => {
    const spot = sparkleStar(seed, star, SPARKLE_SPREAD);

    return {
      position: 'absolute',
      left: `${(middle + spot.x * across - size / 2) * 100}%`,
      top: `${(floor + spot.y * up - size / 2) * 100}%`,
      width: `${size * 100}%`,
      'aspect-ratio': '1',
      background: SPARKLE_COLORS.fill,
      'clip-path': STAR,
      animation: `sparkle-star ${SPARKLE_STAR_LIFE}ms ease-out ${spot.delay}ms both`,
    };
  });
}

/**
 * The stars, thrown once.
 *
 * They are placed from the first frame that is drawn and then left
 * alone: the picture changes twenty-four times a second, and a list of
 * stars rebuilt on every frame is a list of *new* elements every frame,
 * each starting its animation from the beginning. That reads as a
 * pokemon that glitters permanently rather than one that announces
 * itself — which is the thing a sparkle is not
 */
function Sparkle(props: { drawn: Accessor<Drawn | null>; seed: number }): JSX.Element {
  const thrown = createMemo((placed: JSX.CSSProperties[] | undefined) => {
    if (placed != null) {
      return placed;
    }

    const showing = props.drawn();

    return showing == null ? undefined : starsOf(showing, props.seed);
  });

  return <For each={thrown()}>{(star) => <span style={star} />}</For>;
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
   * Whether to draw the female form, for the few species with one of
   * their own. A species without it is drawn the ordinary way
   */
  female?: boolean;
  /**
   * What it should be doing. A sheet without it falls back to standing
   * still, which every sheet has
   */
  animation?: SpriteAnim;
  direction?: SpriteDirection;
  /**
   * How fast the clip runs against the wall clock, where one is the
   * speed it was drawn at. An egg shakes faster the closer it is to
   * opening, which is the only thing an egg has to say
   */
  speed?: number;
  /**
   * How long one pass of the clip should take, in milliseconds, instead
   * of the time the sheet says. The clip is stretched rather than cut, so
   * it is how a dex turns a pokemon on the spot leisurely enough to read
   */
  duration?: number;
  /**
   * Whether it holds its first frame instead of playing. A reference is
   * looked at rather than watched — thirty idling sprites in a dex say
   * nothing the first frame did not
   */
  still?: boolean;
  /**
   * How many times bigger than the sheet has it. The sprites are a few
   * dozen pixels, so anything worth looking at is drawn at two or three
   * — whole numbers, since half a pixel of pixel art is a smear
   */
  scale?: number;
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
   * Whether to throw a handful of stars over it as it appears, once.
   *
   * It is the caller's rather than something read off `shiny`, because
   * not everywhere that draws a shiny is a place worth announcing one: a
   * dex is a record being read, and something standing in front of the
   * player is a thing being met
   */
  sparkle?: boolean;
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
    const female = props.female === true;
    let live = true;

    onCleanup(() => {
      live = false;
    });

    loadSpeciesSprite(species, { shiny, female })
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

    const wanted = props.animation ?? SpriteAnim.Idle;

    drawn.play(drawn.has(wanted) ? wanted : SpriteAnim.Idle, {
      direction: props.direction ?? 'Down',
      loop: true,
      // Only where a caller asked for a pace: everything else plays at
      // the speed it was drawn at
      duration: props.duration,
    });
    setStep((count) => count + 1);
  });

  createEffect(() => {
    const drawn = sprite();

    if (drawn == null || props.still === true) {
      return;
    }

    // Read here rather than inside the tick: the clock is a plain
    // animation frame with no owner and nothing tracking, so a prop
    // first read in there builds its memo ownerless and keeps it
    // forever. Taking it in the effect re-registers when it changes
    const speed = props.speed ?? 1;

    onCleanup(
      ticking((elapsed) => {
        const showing = drawn.frame;

        drawn.update(elapsed * speed);
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

    const cell = playing.frameSize;

    if (cell.width <= 0 || cell.height <= 0) {
      return null;
    }
    const feet = playing.anchor('shadow');
    const shadow = playing.shadowRadius();

    return {
      source: playing.source,
      sheet: playing.data.sheet,
      cell,
      frame,
      trim: playing.frameInset,
      feet,
      shadow,
      bounds: boundsOf(cell, props.shadow === true ? feet : null, shadow),
    };
  });

  /**
   * The box the pokemon is drawn in, sized however the caller asked and
   * grown to hold the shadow. Sizing it to the sprite alone left the
   * shadow outside the element, where a square that clips its overflow
   * shaved it and a centred sprite sat off centre by half of it. Held
   * at a default before the sheet arrives so a row of squares does not
   * jump about as they load
   */
  const box = (): JSX.CSSProperties => {
    const bounds = drawn()?.bounds ?? { width: DEFAULT_CELL, height: DEFAULT_CELL };
    const longest = Math.max(1, bounds.width, bounds.height);

    if (props.fill === true) {
      return {
        width: share(bounds.width, longest),
        height: share(bounds.height, longest),
      };
    }

    const scale = props.scale ?? 1;

    return { width: `${bounds.width * scale}px`, height: `${bounds.height * scale}px` };
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
            {/* Keyed on which pokemon it is, so meeting a second shiny
                throws a fresh handful rather than leaving the first
                one's finished animation on screen */}
            <Show when={props.sparkle === true ? props.species : null} keyed>
              {(seed) => <Sparkle drawn={drawn} seed={seed} />}
            </Show>
          </>
        )}
      </Show>
    </span>
  );
}
