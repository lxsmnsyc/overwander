import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
} from 'solid-js';
import { type CandyStack, getCandies } from '../../auth/candy';
import { ItemFlags, type Items } from '../../data/ids/items';
import { getFamilyName } from '../../data/species';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import { getItemData } from '../../data/items';
import { isEgg } from '../../auth/egg';
import CatchPicker from '../catches/CatchPicker';
import ItemGrid from './ItemGrid';
import { useGame } from '../app/game-context';
import { Badge, List, ListRow, Note } from '../styled';

export interface InventoryListProps {
  player: string;
}

/**
 * Whether this is a thing that gets spent on a pokemon — a remedy, a
 * cap, a machine. Everything else in the bag is held, sold or carried
 * until somebody asks for it, and has nothing to press
 */
function isUsable(item: Items): boolean {
  try {
    return (getItemData(item).flags & ItemFlags.Usable) !== 0;
  } catch {
    return false;
  }
}

/**
 * The bag itself, which is where the stacks are read.
 *
 * Either read in the body that declared it would throw past every
 * `Suspense` written there and land on the boundary around the whole
 * page, so the reading half is its own component
 */
function BagBody(
  props: InventoryListProps & {
    items: Resource<InventoryEntry[]>;
    candies: Resource<CandyStack[]>;
  },
): JSX.Element {
  const game = useGame();
  /**
   * What has been chosen to spend, while the pokemon to spend it on is
   * being picked. The bag asks in that order — item, then pokemon —
   * because that is the order the player is thinking in
   */
  const [using, setUsing] = createSignal<Items | null>(null);

  return (
    <>
      <h4>Items</h4>
      <Show when={props.items()?.length} fallback={<Note>Carrying nothing.</Note>}>
        {/* The same tray the picker uses: what the bag holds is a
              thing to look at rather than read, and the search and the
              shelves come with it. What a square's card offers is Use,
              and only where using it would mean anything */}
        <ItemGrid
          entries={(props.items() ?? []).map((entry) => ({
            item: entry.item,
            amount: entry.amount,
            action: isUsable(entry.item) ? 'Use' : null,
          }))}
          onPress={(item) => {
            if (isUsable(item)) {
              setUsing(item);
            }
          }}
        />

        {/* Which pokemon it goes on. The sheet spends it on arrival,
              so this is the last press */}
        <CatchPicker
          player={props.player}
          open={using() != null}
          value={null}
          title="Use it on"
          verb="Use"
          empty="You have nothing to use it on."
          filter={(option) => !isEgg(option.caught) && !option.fighting}
          onClose={() => {
            setUsing(null);
          }}
          onPick={(catchId) => {
            const item = using();

            setUsing(null);
            if (catchId != null && item != null) {
              game.setSheet({ catchId, useItem: item });
            }
          }}
        />
      </Show>

      <h4>Candies</h4>
      <Show when={props.candies()?.length} fallback={<Note>No candies.</Note>}>
        <List>
          <For each={props.candies()}>
            {(stack) => (
              <ListRow>
                <span class="grow">{getFamilyName(stack.family)} Candy</span>
                <Badge tone="gold">× {stack.count}</Badge>
              </ListRow>
            )}
          </For>
        </List>
      </Show>
    </>
  );
}

/**
 * What the player carries. The stacks are read one component down,
 * under this boundary, so a bag still arriving replaces the list
 * rather than the panel it is drawn in
 */
export default function InventoryList(props: InventoryListProps): JSX.Element {
  const [items] = createResource(() => props.player, getInventory);
  const [candies] = createResource(() => props.player, getCandies);

  return (
    <Suspense fallback={<Note>Looking through the bag…</Note>}>
      <BagBody {...props} items={items} candies={candies} />
    </Suspense>
  );
}
