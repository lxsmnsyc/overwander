import { For, type JSX, Show, createResource } from 'solid-js';
import { getCandies } from '../../auth/candy';
import { getFamilyName } from '../../data/species';
import { getInventory } from '../../auth/inventory';
import ItemGrid from './ItemGrid';
import { Badge, List, ListRow, Note } from '../styled';

export interface InventoryListProps {
  player: string;
}

/**
 * What the player carries: item stacks and candies, each stored one
 * document per stack
 */
export default function InventoryList(props: InventoryListProps): JSX.Element {
  const [items] = createResource(() => props.player, getInventory);
  const [candies] = createResource(() => props.player, getCandies);

  return (
    <>
      <h4>Items</h4>
      <Show when={!items.loading} fallback={<Note>Loading items…</Note>}>
        <Show when={items()?.length} fallback={<Note>Carrying nothing.</Note>}>
          {/* The same tray the picker uses, taking no picks: what the
              bag holds is a thing to look at rather than read, and the
              search and the shelves come with it */}
          <ItemGrid
            entries={(items() ?? []).map((entry) => ({ item: entry.item, amount: entry.amount }))}
          />
        </Show>
      </Show>

      <h4>Candies</h4>
      <Show when={!candies.loading} fallback={<Note>Loading candies…</Note>}>
        <Show when={candies()?.length} fallback={<Note>No candies.</Note>}>
          <List>
            <For each={candies()}>
              {(stack) => (
                <ListRow>
                  <span class="grow">{getFamilyName(stack.family)} Candy</span>
                  <Badge tone="gold">× {stack.count}</Badge>
                </ListRow>
              )}
            </For>
          </List>
        </Show>
      </Show>
    </>
  );
}
