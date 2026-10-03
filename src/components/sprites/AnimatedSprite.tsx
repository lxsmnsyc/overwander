import {
  type Accessor,
  type JSX,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from 'solid-js';
import { type AuraKind, paintPurifiedAura, paintShadowAura } from '../../canvas/auras';
import settings from '../app/settings';
import type SpeciesSpriteAnimation from '../../canvas/species-sprite-animation';
import speciesSize from '../../canvas/species-size';
import loadSpeciesSprite from '../../canvas/species-sprites';
import drawSparkle, {
  SPARKLE_FRAME,
  SPARKLE_LIFE,
  SPARKLE_SPREAD,
  SPARKLE_STAR_SIZE,
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

/** The same bounds widened evenly either side of the feet, where there are any */
function centredOn(
  bounds: { x: number; y: number; width: number; height: number },
  feet: Point | null,
): { x: number; y: number; width: number; height: number } {
  if (feet == null) {
    return bounds;
  }
  const middle = feet[0] + 0.5;
  const half = Math.max(middle - bounds.x, bounds.x + bounds.width - middle);

  return { x: middle - half, y: bounds.y, width: half * 2, height: bounds.height };
}

/**
 * How many sheet pixels a sized box stands for. Below the tallest idle
 * pose, so most species read at a useful size and only the giants are
 * shrunk to fit
 */
const SIZED_SPAN = 64;

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
 * How much sharper the aura canvas is than the box it covers: the
 * wisps are soft shapes, and a one-to-one buffer under a sprite drawn
 * at four times its sheet reads as mush
 */
const AURA_RESOLUTION = 3;

/** How far an aura reaches past its ground shadow, in the shadow's radii: across, up and down */
const AURA_ACROSS = 2.4;
const AURA_UP = 3.5;
const AURA_DOWN = 2.2;

/**
 * An aura painted behind the picture — a shadow's haze, or the light
 * of one put right.
 *
 * A small canvas rather than a sheet: the painters in
 * [`auras`](../../canvas/auras.ts) are the ones the battle canvas
 * runs, sized off the pokemon's ground shadow and centred on the same
 * point. It rides the shared clock the sprites tick on, and it is the
 * one canvas the interface allows itself — the effect is procedural,
 * so there is no sheet to hang as a background
 */
function AuraCanvas(props: {
  drawn: Accessor<Drawn | null>;
  paint: typeof paintShadowAura;
}): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  let played = 0;

  /**
   * The box the aura is painted in, in box pixels: the sprite's own
   * bounds grown to the aura's reach, since flames and a ring spill past
   * the ground shadow the bounds were sized for
   */
  const reach = createMemo(() => {
    const drawn = props.drawn();

    if (drawn == null) {
      return null;
    }
    const box = drawn.bounds;
    const feet = drawn.feet ?? [drawn.cell.width / 2, drawn.cell.height - 1];
    const x = feet[0] + 0.5;
    const y = feet[1] + 0.5;
    const left = Math.min(box.x, x - drawn.shadow.x * AURA_ACROSS);
    const top = Math.min(box.y, y - drawn.shadow.x * AURA_UP);
    const right = Math.max(box.x + box.width, x + drawn.shadow.x * AURA_ACROSS);
    const bottom = Math.max(box.y + box.height, y + drawn.shadow.y * AURA_DOWN);

    return { x: left, y: top, width: right - left, height: bottom - top, feet: [x, y] };
  });

  onCleanup(
    ticking((elapsed) => {
      played += elapsed;

      const drawn = props.drawn();
      const area = reach();
      const context = canvas?.getContext('2d');

      if (canvas == null || context == null || drawn == null || area == null) {
        return;
      }

      const width = Math.max(1, Math.round(area.width * AURA_RESOLUTION));
      const height = Math.max(1, Math.round(area.height * AURA_RESOLUTION));

      if (canvas.width !== width) {
        canvas.width = width;
      }
      if (canvas.height !== height) {
        canvas.height = height;
      }
      context.clearRect(0, 0, width, height);
      props.paint(
        context,
        (area.feet[0] - area.x) * AURA_RESOLUTION,
        (area.feet[1] - area.y) * AURA_RESOLUTION,
        drawn.shadow.x * AURA_RESOLUTION,
        drawn.shadow.y * AURA_RESOLUTION,
        played,
      );
    }),
  );

  /** Where the grown box sits, as shares of the element it hangs out of */
  const placed = (): JSX.CSSProperties => {
    const drawn = props.drawn();
    const area = reach();

    if (drawn == null || area == null) {
      return {};
    }
    const box = drawn.bounds;

    return {
      left: share(area.x - box.x, box.width),
      top: share(area.y - box.y, box.height),
      width: share(area.width, box.width),
      height: share(area.height, box.height),
    };
  };

  return (
    <canvas ref={canvas} aria-hidden="true" class="pointer-events-none absolute" style={placed()} />
  );
}

/**
 * How far past the pokemon a sparkle reaches, in `SPARKLE_FRAME`s: the
 * glints are thrown a quarter of the spread to each side, and the
 * widest adds its own size
 */
const SPARKLE_SIDE = SPARKLE_SPREAD / 4 + SPARKLE_STAR_SIZE;

/** How far above the feet it reaches, and below them, in `SPARKLE_FRAME`s */
const SPARKLE_UP = 1.3;
const SPARKLE_DOWN = 0.3;

/**
 * A shiny's sparkle, thrown once.
 *
 * Painted by the overworld's and the battle's own painter on a canvas
 * over the picture, so a shiny met in a dialog sparkles exactly as it
 * does on the board: the same burst, the same glints in the same
 * places, and the same size whatever the pokemon, since the painter
 * sizes it off `SPARKLE_FRAME` rather than off the sprite
 */
function SparkleCanvas(props: { drawn: Accessor<Drawn | null>; seed: number }): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  let age = 0;

  /** The box it is painted in, in box pixels, standing on the pokemon's feet */
  const reach = createMemo(() => {
    const drawn = props.drawn();

    if (drawn == null) {
      return null;
    }
    const feet = drawn.feet ?? [drawn.cell.width / 2, drawn.cell.height - 1];
    const x = feet[0] + 0.5;
    const y = feet[1] + 0.5;
    const side = SPARKLE_FRAME * (0.5 + SPARKLE_SIDE);

    return {
      x: x - side,
      y: y - SPARKLE_FRAME * SPARKLE_UP,
      width: side * 2,
      height: SPARKLE_FRAME * (SPARKLE_UP + SPARKLE_DOWN),
      feet: [x, y],
    };
  });

  const stop = ticking((elapsed) => {
    age += elapsed;

    const area = reach();
    const context = canvas?.getContext('2d');

    if (canvas == null || context == null || area == null) {
      return;
    }

    const width = Math.max(1, Math.round(area.width * AURA_RESOLUTION));
    const height = Math.max(1, Math.round(area.height * AURA_RESOLUTION));

    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
    context.clearRect(0, 0, width, height);
    if (age > SPARKLE_LIFE) {
      stop();
      return;
    }
    drawSparkle(
      context,
      props.seed,
      age,
      (area.feet[0] - area.x) * AURA_RESOLUTION,
      (area.feet[1] - area.y) * AURA_RESOLUTION,
      AURA_RESOLUTION,
    );
  });

  onCleanup(stop);

  /** Where the box sits, as shares of the element it hangs out of */
  const placed = (): JSX.CSSProperties => {
    const drawn = props.drawn();
    const area = reach();

    if (drawn == null || area == null) {
      return {};
    }
    const box = drawn.bounds;

    return {
      left: share(area.x - box.x, box.width),
      top: share(area.y - box.y, box.height),
      width: share(area.width, box.width),
      height: share(area.height, box.height),
    };
  };

  return (
    <canvas ref={canvas} aria-hidden="true" class="pointer-events-none absolute" style={placed()} />
  );
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
  /**
   * With `fill`, whether the species is drawn at its real height rather
   * than stretched to the box, standing on the box's floor. The box then
   * stands for `SIZED_SPAN` sheet pixels, and anything taller is shrunk
   * to fit
   */
  sized?: boolean;
  /** Whether to draw the ground under it */
  shadow?: boolean;
  /**
   * Whether the box is widened to stand the pokemon's feet in its middle.
   * A clip's box covers every frame and facing, so one facing can sit
   * well to one side of it; a small icon beside a name wants the body
   * in the centre instead
   */
  centred?: boolean;
  /**
   * The aura it stands in, which **replaces** the ground shadow: a
   * shadow pokemon's dark haze, or the light of one put right. Left
   * out, the pokemon casts its plain shadow like anything else
   */
  aura?: AuraKind;
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
  /**
   * What is drawn and how it plays, read through memos so the effects
   * below wake on the **value** changing rather than on the prop being
   * re-read.
   *
   * A caller that rebuilds its list rebuilds every prop with it: a box
   * of thirty squares hands out thirty fresh entries the moment one is
   * picked, and every square's species reads the same as it did. An
   * effect tracks its sources rather than its answers, so without this
   * each of those squares refetched its sheet, was handed a new
   * playhead, and started its idle again from the first frame. What
   * the player saw was the whole box flinch every time they took one
   */
  const drawing = createMemo(() => props.species);
  const sparkling = createMemo(() => props.shiny === true);
  const feminine = createMemo(() => props.female === true);
  const clip = createMemo(() => props.animation ?? SpriteAnim.Idle);
  const facing = createMemo(() => props.direction ?? 'Down');
  const stretched = createMemo(() => props.duration);
  const pace = createMemo(() => props.speed ?? 1);
  const held = createMemo(() => props.still === true);

  const [sprite, setSprite] = createSignal<SpeciesSpriteAnimation | null>(null);
  /**
   * Bumped when a different frame comes up. The playhead moves sixty
   * times a second and the picture changes twenty-four times at most,
   * so the styles are recomputed on the frame rather than on the tick
   */
  const [step, setStep] = createSignal(0);

  createEffect(() => {
    const species = drawing();
    const shiny = sparkling();
    const female = feminine();
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

    const wanted = clip();

    drawn.play(drawn.has(wanted) ? wanted : SpriteAnim.Idle, {
      direction: facing(),
      loop: true,
      // Only where a caller asked for a pace: everything else plays at
      // the speed it was drawn at
      duration: stretched(),
    });
    setStep((count) => count + 1);
  });

  createEffect(() => {
    const drawn = sprite();

    if (drawn == null || held()) {
      return;
    }

    // Read here rather than inside the tick: the clock is a plain
    // animation frame with no owner and nothing tracking, so a prop
    // first read in there builds its memo ownerless and keeps it
    // forever. Taking it in the effect re-registers when it changes.
    //
    // Nought is a pokemon holding its first frame, which is what a
    // player asking for less motion is asking for: the picture is
    // still there and still the right one, it simply does not breathe
    const speed = settings().reduceMotion ? 0 : pace();

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
    // The first frame's mark, not the frame showing: the anchors
    // travel with the body, so per-frame feet resized the box and
    // walked the shadow on every frame, and the dialog around the
    // sprite resized with it
    const feet = playing.resting('shadow');
    const shadow = playing.shadowRadius();

    return {
      source: playing.source,
      sheet: playing.data.sheet,
      cell,
      frame,
      trim: playing.frameInset,
      feet,
      shadow,
      // Grown for the aura the way it is for the shadow: the pool is
      // painted from the same measurements and needs the same room
      bounds: centredOn(
        boundsOf(cell, props.shadow === true || props.aura != null ? feet : null, shadow),
        props.centred === true ? feet : null,
      ),
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

    const playing = sprite();

    if (props.fill === true && props.sized === true && playing != null && drawn() != null) {
      const size = speciesSize(props.species, playing);
      const span = Math.max(SIZED_SPAN, bounds.width * size, bounds.height * size);

      return {
        position: 'absolute',
        bottom: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: share(bounds.width * size, span),
        height: share(bounds.height * size, span),
      };
    }

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
            {/* The plain shadow, or the aura standing in for it —
                never both: a haze rooted in the ground is the shadow
                of the thing standing in it */}
            <Show when={props.shadow === true && props.aura == null ? groundOf(showing()) : null}>
              {(ground) => <span style={ground()} />}
            </Show>
            {/* Behind the picture: the pokemon stands in its aura
                rather than under it. Keyed, so a record purified while
                its sheet is open swaps cleanly */}
            <Show when={props.aura} keyed>
              {(aura) => (
                <AuraCanvas
                  drawn={drawn}
                  paint={aura === 'shadow' ? paintShadowAura : paintPurifiedAura}
                />
              )}
            </Show>
            <span style={pictureOf(showing())} />
            {/* Keyed on which pokemon it is, so meeting a second shiny
                throws a fresh handful rather than leaving the first
                one's finished animation on screen */}
            <Show when={props.sparkle === true ? props.species : null} keyed>
              {(seed) => <SparkleCanvas drawn={drawn} seed={seed} />}
            </Show>
          </>
        )}
      </Show>
    </span>
  );
}
