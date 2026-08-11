import { For, type JSX, Show, createResource } from 'solid-js';
import { getCandies } from '../auth/candy';
import { getInventory } from '../auth/inventory';
import type Families from '../data/ids/families';
import { describeItem } from './InventoryPicker';
import { Badge, List, ListRow, Note } from './styled';

/**
 * Candy families have no display names of their own — the family
 * enum is an id list — so the family number stands in
 */
function describeFamily(family: Families): string {
  return `Family #${family}`;
}

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
          <List>
            <For each={items()}>
              {(entry) => (
                <ListRow>
                  <span class="grow">{describeItem(entry.item)}</span>
                  <Badge>× {entry.amount}</Badge>
                </ListRow>
              )}
            </For>
          </List>
        </Show>
      </Show>

      <h4>Candies</h4>
      <Show when={!candies.loading} fallback={<Note>Loading candies…</Note>}>
        <Show when={candies()?.length} fallback={<Note>No candies.</Note>}>
          <List>
            <For each={candies()}>
              {(stack) => (
                <ListRow>
                  <span class="grow">{describeFamily(stack.family)}</span>
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
