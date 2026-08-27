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
import { getCaught } from '../../auth/caught';
import { ItemFlags, type Items, getMachineMove, isMachineItem } from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import { getFamilyName } from '../../data/species';
import { isPPItem } from '../../data/items/vitamins';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import { getItemData } from '../../data/items';
import CatchPicker from '../catches/catch-picker';
import IncreasePPDialog from '../catches/IncreasePPDialog';
import TeachMoveDialog from '../catches/TeachMoveDialog';
import ItemGrid from './ItemGrid';
import spendItemOn, { getLevelMoves, isUsableOn } from './use-item';
import { useGame } from '../app/game-context';
import { Badge, List, ListRow, Note, useToast } from '../styled';

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
 * A move waiting to be taught, and whoever is being taught it. A level
 * can hand over two at once, so the rest queue behind the first
 */
interface Teaching {
  catchId: string;
  move: Moves;
  rest: Moves[];
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
    onSpent: () => void;
  },
): JSX.Element {
  const game = useGame();
  const toast = useToast();
  /**
   * What has been chosen to spend, while the pokemon to spend it on is
   * being picked. The bag asks in that order — item, then pokemon —
   * because that is the order the player is thinking in
   */
  const [using, setUsing] = createSignal<Items | null>(null);
  const [teaching, setTeaching] = createSignal<Teaching | null>(null);
  const [bottling, setBottling] = createSignal<{ catchId: string; item: Items } | null>(null);

  const said = (message: string, tone: 'neutral' | 'ember' | 'leaf' = 'neutral'): void => {
    toast.push({ message, tone });
  };

  /** Everything that was looking at the pokemon it changed */
  const changed = (): void => {
    props.onSpent();
    game.touchRecords();
  };

  /** Move on to the next move the level offered, or shut the dialog */
  const nextTeaching = (): void => {
    const current = teaching();
    const queued = current?.rest ?? [];

    setTeaching(
      current == null || queued.length === 0
        ? null
        : { ...current, move: queued[0], rest: queued.slice(1) },
    );
  };

  /**
   * Spend it where the player is standing.
   *
   * The bag used to hand the pair to the catch sheet and let it do the
   * spending, which meant every potion opened a whole screen about the
   * pokemon it was spent on. The two items that ask a question back —
   * a machine, a bottle — ask it here instead
   */
  const spend = (catchId: string, item: Items): void => {
    const move = isMachineItem(item) ? getMachineMove(item) : null;

    if (move != null) {
      setTeaching({ catchId, move, rest: [] });
      return;
    }
    if (isPPItem(item)) {
      setBottling({ catchId, item });
      return;
    }

    spendItemOn(catchId, item)
      .then(async (result) => {
        said(result.said, result.tone);
        changed();

        // A candy can grow it into a move, which is the one question
        // that comes after the item rather than before it
        if (result.level == null) {
          return;
        }

        const caught = await getCaught(catchId);
        const learning = caught == null ? [] : getLevelMoves(caught, result.level);

        if (learning.length > 0) {
          setTeaching({ catchId, move: learning[0], rest: learning.slice(1) });
        }
      })
      .catch((caught: unknown) => {
        said(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  return (
    <>
      <h4>Items</h4>
      <Show when={props.items.latest?.length} fallback={<Note>Carrying nothing.</Note>}>
        {/* The same tray the picker uses: what the bag holds is a
              thing to look at rather than read, and the search and the
              shelves come with it. What a square's card offers is Use,
              and only where using it would mean anything */}
        <ItemGrid
          entries={(props.items.latest ?? []).map((entry) => ({
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

        {/* Which pokemon it goes on, and the last press: the item is
              spent here rather than on a screen about the pokemon.
              Only the ones it would do some good are offered */}
        <CatchPicker
          player={props.player}
          open={using() != null}
          value={null}
          title="Use it on"
          verb="Use"
          empty="You have nothing to use it on."
          filter={(option) => {
            const item = using();

            return item != null && !option.fighting && isUsableOn(item, option.caught);
          }}
          onClose={() => {
            setUsing(null);
          }}
          onPick={(catchId) => {
            const item = using();

            setUsing(null);
            if (catchId != null && item != null) {
              spend(catchId, item);
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

      {/* A machine asks which move is given up for it, and a level
          asks whether a new one is taken at all. Both are the same
          question with a different price, so both come here */}
      <TeachMoveDialog
        catchId={teaching()?.catchId ?? null}
        move={teaching()?.move ?? null}
        onClose={nextTeaching}
        onTaught={() => {
          said('Taught.');
          changed();
        }}
      />

      {/* And a bottle asks which move the points land on. Nothing
          leaves the bag until it is answered */}
      <IncreasePPDialog
        catchId={bottling()?.catchId ?? null}
        item={bottling()?.item ?? null}
        onClose={() => {
          setBottling(null);
        }}
        onUsed={(message) => {
          said(message);
          changed();
        }}
      />
    </>
  );
}

/**
 * What the player carries. The stacks are read one component down,
 * under this boundary, so a bag still arriving replaces the list
 * rather than the panel it is drawn in
 */
export default function InventoryList(props: InventoryListProps): JSX.Element {
  const [items, { refetch }] = createResource(() => props.player, getInventory);
  const [candies] = createResource(() => props.player, getCandies);

  return (
    <Suspense fallback={<Note>Looking through the bag…</Note>}>
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
