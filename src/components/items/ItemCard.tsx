import { type JSX, Show } from 'solid-js';
import type { Items } from '../../data/ids/items';
import { detailItem } from '../details';
import { Detail } from '../styled';

/**
 * What one thing in a tray is, in a window that can carry a button.
 * The hover card's bar names it; this says what it does.
 *
 * A square of the bag shows a picture and a number, which between them
 * say neither what the thing does nor whether it is worth what he is
 * asking for it.
 */

export interface ItemCardProps {
  item: Items;
  /**
   * How many are in the bag. It is the answer a crate cannot give —
   * the price is on the square, and whether to pay it depends on how
   * many are already carried
   */
  carried?: number;
}

export default function ItemCard(props: ItemCardProps): JSX.Element {
  const detail = (): { name: string; description: string } => detailItem(props.item);

  // The name is on the card's bar, so the body starts at what it does
  return (
    <div class="flex flex-col gap-2">
      <p class="m-0 text-xs leading-snug text-muted">{detail().description}</p>
      <Show when={props.carried != null}>
        <div class="border-t-2 border-line-soft pt-1.5 text-xs">
          <Detail label="Amount in bag">{props.carried}</Detail>
        </div>
      </Show>
    </div>
  );
}
