import { type JSX, Show } from 'solid-js';
import type { Items } from '../../data/ids/items';
import { detailItem } from '../details';
import { Detail } from '../styled';

/**
 * What one thing in a tray is, said in the boxes the tooltip says it
 * in: the same words, in a window that can carry a button.
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

  return (
    <div class="flex flex-col gap-1.5">
      <Detail label="Name">{detail().name}</Detail>
      <Detail label="Description">{detail().description}</Detail>
      <Show when={props.carried != null}>
        <Detail label="Amount in bag">{props.carried}</Detail>
      </Show>
    </div>
  );
}
