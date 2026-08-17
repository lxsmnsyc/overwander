import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import AtlasSprite from '../sprites/AtlasSprite';
import { UI_SPRITE_ROOT } from '../../canvas/basic-sprites';
import type { Items } from '../../data/ids/items';
import { describeItem } from '../details';
import { getItemData } from '../../data/items';

/**
 * A picture of one thing a player carries.
 *
 * Everywhere the bag is shown used to be a column of names — "Poke
 * Ball", "Oran Berry", "TM Surf" — which reads as a spreadsheet of a
 * satchel. The items have always had pictures under
 * `public/sprites/ui/items`; nothing drew them, so nothing showed
 * them.
 *
 * It is the item's half of `AtlasSprite`: which sheet and which
 * picture comes off the item's own registration, and the drawing is
 * the browser's.
 */

/**
 * How wide the box is by default. The sheets are cut at thirty-two, so
 * this is one to one
 */
const DEFAULT_SIZE = 32;

/**
 * Where the item sheets live. An item names its picture as
 * `sheet/name`, which is the whole of the mapping — it sits beside the
 * price and the flags rather than in a table somewhere else
 */
const ITEM_ICON_ROOT = `${UI_SPRITE_ROOT}/items`;

export interface ItemSpriteProps {
  item: Items;
  /**
   * The side of the square it is drawn in. The picture is fitted to it
   * without being stretched, so a sheet cut at another size still
   * lines up in a column with the rest
   */
  size?: number;
  /**
   * Whether it fills the square it is put in instead of taking a
   * number of pixels. A tray whose squares are a sixth of the screen
   * asks for this; a row of fixed-height lines asks for a size
   */
  fill?: boolean;
  class?: string;
  /**
   * What a screen reader is told. It falls back to the item's name,
   * which is what the picture is of — a caller only says otherwise
   * when the name is already written beside it, and then it passes an
   * empty string so the row is not read out twice
   */
  label?: string;
}

/**
 * Which sheet and which picture, from what the item says about itself.
 * An item the registry has never heard of names nothing, and nothing
 * is what gets drawn
 */
function iconOf(item: Items): { sheet: string; name: string } | null {
  let icon: string;

  try {
    icon = getItemData(item).icon;
  } catch {
    return null;
  }

  const cut = icon.lastIndexOf('/');

  return cut <= 0
    ? null
    : { sheet: `${ITEM_ICON_ROOT}/${icon.slice(0, cut)}`, name: icon.slice(cut + 1) };
}

export default function ItemSprite(props: ItemSpriteProps): JSX.Element {
  const icon = (): { sheet: string; name: string } | null => iconOf(props.item);

  const size = (): number => props.size ?? DEFAULT_SIZE;

  const label = (): string => props.label ?? describeItem(props.item);

  return (
    // Square whatever the sheet holds: a bag is a grid of squares, and
    // one icon a few pixels shorter than the rest sets its whole row
    // off. The picture is centred in it rather than stretched to it
    <span
      role={icon() == null ? 'img' : undefined}
      aria-label={icon() == null ? label() : undefined}
      style={
        props.fill === true
          ? { width: '100%', 'aspect-ratio': '1 / 1' }
          : { width: `${size()}px`, height: `${size()}px` }
      }
      class={`flex shrink-0 items-center justify-center ${props.class ?? ''}`}
    >
      <Show when={icon()}>
        {(found) => (
          <AtlasSprite
            sheet={found().sheet}
            name={found().name}
            size={props.fill === true ? undefined : size()}
            fill={props.fill}
            label={label()}
          />
        )}
      </Show>
    </span>
  );
}
