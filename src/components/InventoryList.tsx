import { For, type JSX, Show, createResource, createSignal } from 'solid-js';
import { getCandies } from '../auth/candy';
import { type InventoryEntry, getInventory } from '../auth/inventory';
import type Families from '../data/ids/families';
import {
  EVERY_CATEGORY,
  type ItemCategory,
  describeItem,
  isInCategory,
  listCategories,
} from './InventoryPicker';
import matches from '../core/search';
import {
  Badge,
  Filter,
  type FilterOption,
  List,
  ListRow,
  Note,
  Row,
  SEARCH_FROM,
  Search,
} from './styled';

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

  /**
   * Which shelf of the bag is being looked at. It narrows what is
   * shown and nothing else — the bag is unchanged, and `All` is always
   * one press away
   */
  const [category, setCategory] = createSignal<ItemCategory>(EVERY_CATEGORY);

  const categories = (): FilterOption<ItemCategory>[] =>
    listCategories((items() ?? []).map((entry) => entry.item));

  /**
   * What was typed. The shelf and the search narrow the same list from
   * two directions — a category is what kind of thing, a search is
   * which one — so they are asked separately and answered together
   */
  const [query, setQuery] = createSignal('');

  const shown = (): InventoryEntry[] =>
    (items() ?? []).filter(
      (entry) => isInCategory(entry.item, category()) && matches(describeItem(entry.item), query()),
    );

  return (
    <>
      <Row>
        <h4 class="grow">Items</h4>
        {/* Neither is worth offering over a bag small enough to read */}
        <Show when={(items()?.length ?? 0) > SEARCH_FROM}>
          <Search
            placeholder="Search the bag"
            value={query()}
            onChange={(typed) => {
              setQuery(typed);
            }}
          />
        </Show>
        <Show when={categories().length > 2}>
          <Filter
            label="Category"
            value={category()}
            options={categories()}
            onChange={(picked) => {
              setCategory(picked);
            }}
          />
        </Show>
      </Row>
      <Show when={!items.loading} fallback={<Note>Loading items…</Note>}>
        <Show when={items()?.length} fallback={<Note>Carrying nothing.</Note>}>
          <Show when={shown().length} fallback={<Note>Nothing here matches.</Note>}>
            <List>
              <For each={shown()}>
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
