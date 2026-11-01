import type { JSX } from 'solid-js';
import AtlasSprite from './AtlasSprite';
import { UI_SPRITE_ROOT } from '../../canvas/sprites/basic-sprites';
import { MoveCategories } from '../../data/ids/moves';
import { m } from '../../i18n/paraglide/messages.js';

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

/** What each category is called, in the player's language */
export const MOVE_CATEGORY_LABELS: Record<MoveCategories, () => string> = {
  [MoveCategories.Physical]: m.move_category_physical,
  [MoveCategories.Special]: m.move_category_special,
  [MoveCategories.Status]: m.move_category_status,
};

/**
 * How wide the badge is drawn. The sheet cuts them at 32x14, so this
 * is one to one — a pixel badge drawn at any other size is a smudge
 */
const WIDTH = 32;

export interface MoveCategorySpriteProps {
  category: MoveCategories;
  /** The picture's width, where a caller wants it smaller than the sheet's */
  size?: number;
  class?: string;
}

export default function MoveCategorySprite(props: MoveCategorySpriteProps): JSX.Element {
  return (
    <AtlasSprite
      sheet={SHEET}
      name={PICTURES[props.category]}
      size={props.size ?? WIDTH}
      label={MOVE_CATEGORY_LABELS[props.category]()}
      class={props.class}
    />
  );
}
