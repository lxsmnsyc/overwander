import { For, type JSX, Show, createResource } from 'solid-js';
import { getCandies } from '../auth/candy';
import { getInventory } from '../auth/inventory';
import type Families from '../data/ids/families';
import { describeItem } from './InventoryPicker';

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
      <Show when={!items.loading} fallback={<p>Loading items…</p>}>
        <Show when={items()?.length} fallback={<p>Carrying nothing.</p>}>
          <ul>
            <For each={items()}>
              {(entry) => (
                <li>
                  {describeItem(entry.item)} × {entry.amount}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>

      <h4>Candies</h4>
      <Show when={!candies.loading} fallback={<p>Loading candies…</p>}>
        <Show when={candies()?.length} fallback={<p>No candies.</p>}>
          <ul>
            <For each={candies()}>
              {(stack) => (
                <li>
                  {describeFamily(stack.family)} × {stack.count}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>
    </>
  );
}
