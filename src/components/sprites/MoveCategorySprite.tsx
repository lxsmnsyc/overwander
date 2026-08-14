import { type JSX, createEffect, createSignal, onCleanup } from 'solid-js';
import type BasicSprite from '../../canvas/basic-sprite';
import loadBasicSprite, { UI_SPRITE_ROOT } from '../../canvas/basic-sprites';
import { MOVE_CATEGORY_NAMES, MoveCategories } from '../../data/ids/moves';

/**
 * Which of the three kinds a move is, drawn the way the series draws
 * it.
 *
 * It used to be a coloured square with the name on its tooltip, which
 * was honest about having no picture and useless to anybody who had
 * not learned the three colours. The badges are the ones every game
 * since Diamond has used, so a player already knows them — and a move
 * list is read at a glance, which is the one thing a word cannot do.
 */

const SHEET = `${UI_SPRITE_ROOT}/move-categories`;

/**
 * What each category is called on the sheet
 */
const PICTURES: Record<MoveCategories, string> = {
  [MoveCategories.Physical]: 'move-physical',
  [MoveCategories.Special]: 'move-special',
  [MoveCategories.Status]: 'move-status',
};

/**
 * How wide the badge is drawn. The sheet cuts them at 32×14, so this
 * is one to one — a pixel badge drawn at any other size is a smudge
 */
const WIDTH = 32;
const HEIGHT = 14;

export interface MoveCategorySpriteProps {
  category: MoveCategories;
  class?: string;
}

export default function MoveCategorySprite(props: MoveCategorySpriteProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  const [sheet, setSheet] = createSignal<BasicSprite | null>(null);

  createEffect(() => {
    let live = true;

    onCleanup(() => {
      live = false;
    });

    loadBasicSprite(SHEET)
      .then((loaded) => {
        if (live) {
          setSheet(loaded);
        }
      })
      .catch(() => {
        // The badge is a picture of something the row already names in
        // its tooltip; a sheet that will not load leaves a gap
      });
  });

  createEffect(() => {
    const drawn = sheet();
    const element = canvas;
    const name = PICTURES[props.category];

    if (element == null) {
      return;
    }

    const context = element.getContext('2d');

    if (context == null) {
      return;
    }

    const ratio = globalThis.devicePixelRatio > 0 ? globalThis.devicePixelRatio : 1;

    element.width = WIDTH * ratio;
    element.height = HEIGHT * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    drawn?.draw(context, name, 0, 0, { anchor: 'top-left' });
  });

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={MOVE_CATEGORY_NAMES[props.category]}
      title={MOVE_CATEGORY_NAMES[props.category]}
      style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
      class={`block shrink-0 [image-rendering:pixelated] ${props.class ?? ''}`}
    />
  );
}
