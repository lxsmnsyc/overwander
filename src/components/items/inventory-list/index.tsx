import { type JSX, Suspense, createResource } from 'solid-js';
import { getCandies } from '../../../auth/candy';
import { getInventory } from '../../../auth/inventory';
import { Note } from '../../styled';
import BagBody, { type InventoryListProps } from './body';
import BagHint from './BagHint';
import { m } from '../../../i18n/paraglide/messages.js';

export type { InventoryListProps };
export { BagHint };

/**
 * What the player carries. The stacks are read one component down,
 * under this boundary, so a bag still arriving replaces the list
 * rather than the panel it is drawn in
 */
export default function InventoryList(props: InventoryListProps): JSX.Element {
  const [items, { refetch }] = createResource(() => props.player, getInventory);
  const [candies] = createResource(() => props.player, getCandies);

  return (
    <Suspense fallback={<Note>{m.item_bag_loading()}</Note>}>
      <BagBody
        {...props}
        items={items}
        candies={candies}
        onSpent={() => {
          Promise.resolve(refetch()).catch(() => undefined);
        }}
      />
    </Suspense>
  );
}
