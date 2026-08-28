import { type JSX, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import type BasicSprite from '../../canvas/basic-sprite';
import type { BasicSpriteImage } from '../../canvas/basic-sprite';
import loadBasicSprite from '../../canvas/basic-sprites';

/**
 * One picture out of a still sheet, drawn by the browser rather than
 * by us.
 *
 * A canvas is what you reach for when something moves: a playhead, a
 * frame to advance, a loop to run. An item icon does none of that, so
 * a canvas per icon is a rendering context, a draw call and a repaint
 * bought for a picture that never changes. This is the same picture as
 * a **background**: the sheet is the background image, the entry's
 * `x`/`y` is where it is scrolled to, and the cell is the box.
 *
 * What that buys is the browser doing the work — one decoded image
 * shared by every icon on the page, no context, no draw, and no
 * redraw when a row rebuilds around it.
 */

/**
 * What a cell is assumed to be until the sheet says otherwise. The
 * interface sheets are cut at thirty-two, and a box that started at
 * nothing would collapse a tray of icons for as long as the fetch took
 */
const DEFAULT_CELL = 32;

/**
 * How a sheet's picture is placed, in the numbers CSS wants.
 *
 * `background-size` is the **whole sheet** at the scale being drawn,
 * so the background can be scrolled to the entry's own corner; the box
 * is the cell, and the picture sits inside it wherever the trimming
 * left it
 */
function backgroundOf(
  sprite: BasicSprite,
  frame: BasicSpriteImage,
  scale: number,
  rendering: NonNullable<JSX.CSSProperties['image-rendering']>,
): JSX.CSSProperties {
  return {
    position: 'absolute',
    left: `${frame.trim[0] * scale}px`,
    top: `${frame.trim[1] * scale}px`,
    width: `${frame.width * scale}px`,
    height: `${frame.height * scale}px`,
    'background-image': `url(${sprite.source})`,
    'background-position': `${-frame.x * scale}px ${-frame.y * scale}px`,
    'background-size': `${sprite.data.width * scale}px ${sprite.data.height * scale}px`,
    'background-repeat': 'no-repeat',
    'image-rendering': rendering,
  };
}

/**
 * The same placement in **percentages**, for a picture that fills
 * whatever box it is put in rather than a number of pixels.
 *
 * Everything is a share of the cell, so the picture follows a square
 * that is 78 pixels across on a desktop and 45 on a phone. The odd one
 * is `background-position`: a percentage there is read as *align this
 * share of the image with the same share of the box*, so the sums are
 * against what is left over — the sheet minus one frame — rather than
 * against the sheet
 */
function fillingOf(
  sprite: BasicSprite,
  frame: BasicSpriteImage,
  rendering: NonNullable<JSX.CSSProperties['image-rendering']>,
): JSX.CSSProperties {
  const share = (part: number, whole: number): string =>
    `${whole <= 0 ? 0 : (part / whole) * 100}%`;

  return {
    position: 'absolute',
    left: share(frame.trim[0], frame.sourceWidth),
    top: share(frame.trim[1], frame.sourceHeight),
    width: share(frame.width, frame.sourceWidth),
    height: share(frame.height, frame.sourceHeight),
    'background-image': `url(${sprite.source})`,
    'background-position': `${share(frame.x, sprite.data.width - frame.width)} ${share(
      frame.y,
      sprite.data.height - frame.height,
    )}`,
    'background-size': `${share(sprite.data.width, frame.width)} ${share(
      sprite.data.height,
      frame.height,
    )}`,
    'background-repeat': 'no-repeat',
    'image-rendering': rendering,
  };
}

export interface AtlasSpriteProps {
  /**
   * Where the sheet lives, as a path under `public` — the same string
   * `loadBasicSprite` takes, so a sheet already fetched for one icon
   * is drawn from at once for the next
   */
  sheet: string;
  /** Which picture on it, by the bare name */
  name: string;
  /**
   * The longest side of the box, in pixels. The other side follows the
   * cell's own shape, so a badge cut at 32x14 stays that shape. It
   * defaults to the cell, which is the size the picture was drawn at
   */
  size?: number;
  /**
   * Whether the picture fills the box it is put in rather than taking
   * a number of pixels. It is for a grid whose squares are a share of
   * whatever width the screen gave them
   */
  fill?: boolean;
  /**
   * Whether the picture is resampled rather than blocked up when it is
   * drawn at another size. It is for a sheet that was not drawn as
   * pixel art, where nearest-neighbour turns a curve into a stair
   */
  smooth?: boolean;
  /**
   * What a screen reader is told. An empty string is for a caller that
   * has already written the name beside the picture, so the row is not
   * read out twice
   */
  label?: string;
  /** What a pointer resting on it is told, where the name is not written beside it */
  title?: string;
  class?: string;
}

export default function AtlasSprite(props: AtlasSpriteProps): JSX.Element {
  const [sheet, setSheet] = createSignal<BasicSprite | null>(null);

  createEffect(() => {
    const path = props.sheet;
    let live = true;

    onCleanup(() => {
      live = false;
    });

    loadBasicSprite(path)
      .then((loaded) => {
        if (live) {
          setSheet(loaded);
        }
      })
      .catch(() => {
        // A sheet that will not load leaves the box empty; whatever it
        // was illustrating is named beside it in words
      });
  });

  const frame = (): BasicSpriteImage | null => sheet()?.frameOf(props.name) ?? null;

  /**
   * The cell, which is what the box is: two icons cut from the same
   * 32x32 fill the same box however differently they were trimmed
   */
  const cell = (): { width: number; height: number } => {
    const drawn = frame();

    return {
      width: drawn?.sourceWidth ?? DEFAULT_CELL,
      height: drawn?.sourceHeight ?? DEFAULT_CELL,
    };
  };

  const scale = (): number => {
    const longest = Math.max(cell().width, cell().height);

    return props.size == null || longest <= 0 ? 1 : props.size / longest;
  };

  /**
   * The box: a share of the parent where the caller wants it to
   * follow, and the cell at whatever scale otherwise. Either way it is
   * held before the sheet arrives, so a tray of icons does not jump
   * about as they load
   */
  const box = (): JSX.CSSProperties =>
    props.fill === true
      ? { width: '100%', 'aspect-ratio': `${cell().width} / ${cell().height}` }
      : {
          width: `${cell().width * scale()}px`,
          height: `${cell().height * scale()}px`,
        };

  const rendering = (): NonNullable<JSX.CSSProperties['image-rendering']> => (props.smooth === true ? 'auto' : 'pixelated');

  return (
    <span
      role="img"
      aria-label={props.label ?? props.name}
      aria-hidden={props.label === '' ? true : undefined}
      title={props.title}
      style={box()}
      class={`relative block shrink-0 overflow-hidden ${props.class ?? ''}`}
    >
      <Show when={sheet()}>
        {(loaded) => (
          <Show when={frame()}>
            {(drawn) => (
              <span
                style={
                  props.fill === true
                    ? fillingOf(loaded(), drawn(), rendering())
                    : backgroundOf(loaded(), drawn(), scale(), rendering())
                }
              />
            )}
          </Show>
        )}
      </Show>
    </span>
  );
}
