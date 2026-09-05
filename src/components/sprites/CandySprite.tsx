import type { JSX } from 'solid-js';
import AtlasSprite from './AtlasSprite';
import { UI_SPRITE_ROOT } from '../../canvas/basic-sprites';
import type Families from '../../data/ids/families';
import familyCandyIcon from '../../data/species/family-candy';
import { getFamilyName } from '../../data/species';

/**
 * A picture of one family's candy.
 *
 * Candy is a pile of a family's own sweets rather than a currency, and
 * a number beside the word "candy" says neither which family nor how
 * much of a pile it is. The pictures are palette swaps of one drawing
 * in the colours of the family's base species, so a bag of them reads
 * as the pokemon they feed.
 */

/**
 * How wide the box is by default.
 *
 * The candies are packed as items are, a 16-pixel drawing sitting in
 * the middle of an item's 32-pixel cell, and the box is the cell. So
 * this is `ItemSprite`'s own default and draws a candy the size the
 * Rare Candy beside it in the bag is drawn: asking for 16 here fits
 * the whole cell into 16 and leaves the drawing itself at 8
 */
const DEFAULT_SIZE = 32;

export interface CandySpriteProps {
  family: Families;
  size?: number;
  /** Whether it fills the square it is put in rather than taking a number of pixels */
  fill?: boolean;
  class?: string;
  /**
   * What a screen reader is told. It falls back to the family's own
   * candy; a caller with the name already written beside it passes an
   * empty string so the row is not read out twice
   */
  label?: string;
}

export default function CandySprite(props: CandySpriteProps): JSX.Element {
  const icon = (): { sheet: string; name: string } => {
    const named = familyCandyIcon(props.family);
    const cut = named.lastIndexOf('/');

    return { sheet: `${UI_SPRITE_ROOT}/${named.slice(0, cut)}`, name: named.slice(cut + 1) };
  };

  return (
    <AtlasSprite
      sheet={icon().sheet}
      name={icon().name}
      size={props.fill === true ? undefined : (props.size ?? DEFAULT_SIZE)}
      fill={props.fill}
      class={props.class}
      label={props.label ?? `${getFamilyName(props.family)} candy`}
    />
  );
}
