import { type JSX, createEffect, createSignal, onCleanup } from 'solid-js';
import loadItemIcon, { type ItemIcon } from '../../canvas/item-icons';
import type { Items } from '../../data/ids/items';
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
 * It is one still frame, so it draws once per change rather than
 * running a frame loop: an icon has nothing to animate, and a bag of
 * thirty rows should not be thirty `requestAnimationFrame` callbacks.
 */

/**
 * How wide the box is by default, in pixels. The sheets are cut at
 * around thirty-two, so this is roughly one-to-one — a picture drawn
 * smaller than it was cut is the one size a pixel sprite looks worst
 * at
 */
const DEFAULT_SIZE = 32;

export interface ItemSpriteProps {
  item: Items;
  /**
   * The side of the square it is drawn in. The picture is fitted to
   * it without being stretched, so a sheet cut at another size still
   * lines up in a column with the rest
   */
  size?: number;
  class?: string;
  /**
   * What a screen reader is told. It falls back to the item's name,
   * which is what the picture is of — a caller only says otherwise
   * when the name is already written beside it, and then it passes an
   * empty string so the row is not read out twice
   */
  label?: string;
}

export default function ItemSprite(props: ItemSpriteProps): JSX.Element {
  let canvas: HTMLCanvasElement | undefined;
  const [icon, setIcon] = createSignal<ItemIcon | null>(null);

  const size = (): number => props.size ?? DEFAULT_SIZE;

  createEffect(() => {
    const item = props.item;
    let live = true;

    onCleanup(() => {
      live = false;
    });

    loadItemIcon(item)
      .then((loaded) => {
        if (live) {
          setIcon(loaded);
        }
      })
      .catch(() => {
        // A picture that will not load is one the row does without;
        // the name beside it says what the item is
      });
  });

  createEffect(() => {
    const drawn = icon();
    const element = canvas;
    const room = size();

    if (element == null) {
      return;
    }

    const context = element.getContext('2d');

    if (context == null) {
      return;
    }

    // The canvas is the cell the icon was cut in, drawn one to one,
    // and the box it fills is the element's own size — a browser
    // enlarging pixels is crisp at any size, where the same picture
    // drawn at 1.125 on a canvas is not
    const cell = drawn?.sprite.sizeOf(drawn.name);
    const side = Math.max(cell?.width ?? 0, cell?.height ?? 0) || room;

    element.width = side;
    element.height = side;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, side, side);
    // Drawn from the middle so a picture that is not square sits in
    // the middle of its column rather than against one edge
    drawn?.sprite.draw(context, drawn.name, side / 2, side / 2);
  });

  const label = (): string => props.label ?? getItemData(props.item).name;

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label()}
      aria-hidden={label() === '' ? true : undefined}
      style={{ width: `${size()}px`, height: `${size()}px` }}
      class={`block shrink-0 [image-rendering:pixelated] ${props.class ?? ''}`}
    />
  );
}
