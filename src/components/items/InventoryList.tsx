import {
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createResource,
  createSignal,
} from 'solid-js';
import { type CandyStack, getCandies } from '../../auth/candy';
import { getCaught } from '../../auth/caught';
import { ItemFlags, type Items, getMachineMove, isMachineItem } from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import { isPPItem } from '../../data/items/vitamins';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import { getItemData } from '../../data/items';
import CatchPicker from '../catches/catch-picker';
import IncreasePPDialog from '../catches/IncreasePPDialog';
import TeachMoveDialog from '../catches/TeachMoveDialog';
import CandyGrid from './CandyGrid';
import ItemGrid from './ItemGrid';
import { describeItem } from '../details';
import spendItemOn, { getLevelMoves, isUsableOn } from './use-item';
import { useGame } from '../app/game-context';
import { Note, useToast } from '../styled';

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
  /**
   * Bumped after every spend, so the picker re-reads: a potion that
   * filled a pokemon up should take it out of the list, and the list
   * is what says there is anything left to use it on
   */
  const [spent, setSpent] = createSignal(0);
  /**
   * Whether the picker is closing because something was picked rather
   * than because it was dismissed. A repeatable item leaves it open,
   * and the picker closes itself either way
   */
  let repeating = false;
  const [teaching, setTeaching] = createSignal<Teaching | null>(null);
  const [bottling, setBottling] = createSignal<{ catchId: string; item: Items } | null>(null);

  const said = (message: string, tone: 'neutral' | 'ember' | 'leaf' = 'neutral'): void => {
    toast.push({ message, tone });
  };

  /** Everything that was looking at the pokemon it changed */
  const changed = (): void => {
    props.onSpent();
    setSpent((count) => count + 1);
    game.touchRecords();
  };

  /**
   * Whether spending it leaves the player where they can spend another
   * straight away. A machine and a bottle both open a question of
   * their own, and the picker cannot stand behind it
   */
  const repeatable = (item: Items): boolean => !isMachineItem(item) && !isPPItem(item);

  // Nothing left to spend is nothing to keep the picker open for
  createEffect(() => {
    const item = using();
    const carried = props.items.latest;

    if (item != null && carried != null && !carried.some((entry) => entry.item === item)) {
      setUsing(null);
    }
  });

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
              shelves come with it.

              Nothing here is refused. A bag is what the player is
              carrying, and a nugget is not unavailable for being a
              nugget — it simply has no use to press. Only the ones
              that do are announced as something to use */}
        <ItemGrid
          entries={(props.items.latest ?? []).map((entry) => ({
            item: entry.item,
            amount: entry.amount,
            said: `${isUsable(entry.item) ? 'Use ' : ''}${describeItem(entry.item)}, ${
              entry.amount
            } carried`,
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
          revision={spent()}
          // A potion is used on one pokemon after another, so the list
          // stays up: it is the same question with a different answer,
          // and closing it after each meant reopening the bag, finding
          // the same square and pressing it again for every one
          onClose={() => {
            if (repeating) {
              repeating = false;
              return;
            }
            setUsing(null);
          }}
          onPick={(catchId) => {
            const item = using();

            if (catchId == null || item == null) {
              setUsing(null);
              return;
            }
            repeating = repeatable(item);
            spend(catchId, item);
          }}
        />
      </Show>

      <h4>Candies</h4>
      {/* The same tray the items are in, in the jar's own colours: a
          pile is a picture and a number, not a line of text */}
      <CandyGrid
        piles={(props.candies() ?? []).map((stack) => ({
          family: stack.family,
          count: stack.count,
        }))}
      />

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
