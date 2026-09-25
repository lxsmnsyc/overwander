import {
  For,
  type JSX,
  type Resource,
  Show,
  Suspense,
  createEffect,
  createMemo,
  createResource,
  createSignal,
} from 'solid-js';
import { type CandyStack, getCandies } from '../../auth/candy';
import { getCaught } from '../../auth/caught';
import {
  ItemFlags,
  type ItemTypes,
  type Items,
  getMachineMove,
  isMachineItem,
} from '../../data/ids/items';
import type { Moves } from '../../data/ids/moves';
import { isAbilityPatch } from '../../data/items/ability-items';
import { isPPItem } from '../../data/items/vitamins';
import { type InventoryEntry, getInventory } from '../../auth/inventory';
import { getLocalOffset } from '../../auth/local-time';
import useEscapeRope from '../../auth/escape-rope';
import { hostMythicalRaid } from '../../auth/raids';
import { isEscapeRope } from '../../data/items/escape-rope';
import { getRaidSpecies } from '../../data/items/raid-items';
import { getItemData } from '../../data/items';
import { ITEM_TYPE_NAMES, ITEM_TYPE_ORDER } from '../../data/items/names';
import CatchPicker from '../catches/catch-picker';
import AbilityPatchDialog from '../catches/AbilityPatchDialog';
import IncreasePPDialog from '../catches/IncreasePPDialog';
import TeachMoveDialog from '../catches/TeachMoveDialog';
import CandyGrid, { type CandyPile } from './CandyGrid';
import ItemGrid, { type ItemCell } from './ItemGrid';
import { describeItem } from '../details';
import spendItemOn, { getLevelMoves, isUsableOn } from './use-item';
import spentToast from './spent-toast';
import { GameDialog, useGame } from '../app/game-context';
import { Hint, HintList, Note, TabBar, TabButton, TabGroup, TabPane, useToast } from '../styled';
import settings, { setSetting } from '../app/settings';
import { failed, readable } from '../app/resource-reads';

export interface InventoryListProps {
  player: string;
}

/** The items tab that holds every type at once, beside one tab per type */
const ALL_ITEMS = -1;

/** The candy pocket, numbered past the item types like `ALL_ITEMS` */
const CANDIES = -2;

/** An item's type, or null for one the registry does not know */
function typeOf(item: Items): ItemTypes | null {
  try {
    return getItemData(item).type;
  } catch {
    return null;
  }
}

/**
 * Whether this is a thing that gets spent on a pokemon — a remedy, a
 * cap, a machine. Everything else in the bag is held, sold or carried
 * until somebody asks for it, and has nothing to press.
 *
 * A relic is `Usable` too but goes nowhere near a pokemon, so it is
 * kept out of this one and answered by `isRelic` instead
 */
function isUsable(item: Items): boolean {
  try {
    return (getItemData(item).flags & ItemFlags.Usable) !== 0;
  } catch {
    return false;
  }
}

/**
 * Whether pressing it opens a raid rather than asking for a pokemon.
 * A relic is spent on a place, not on anything the bag could pick
 */
function isRelic(item: Items): boolean {
  return getRaidSpecies(item) != null;
}

/** How many different things a pocket holds, beside its name */
function Count(props: { of: number }): JSX.Element {
  return <span class="ml-2 text-xs font-normal tabular-nums opacity-80">{props.of}</span>;
}

/** What pressing this square is announced as doing */
function relicVerb(item: Items): string {
  if (isRelic(item)) {
    return 'Open the raid with ';
  }
  if (isEscapeRope(item)) {
    return 'Climb out with ';
  }
  return isUsable(item) ? 'Use ' : '';
}

/** What the bag's pockets hold and what pressing does, for the dialog's title bar */
export function BagHint(): JSX.Element {
  return (
    <Hint title="About the bag">
      <HintList>
        <li>Press an item you can use to pick the pokemon to use it on.</li>
        <li>Medicine heals and cures. Poke Balls are thrown at wild pokemon.</li>
        <li>Held items are given to a pokemon from its sheet.</li>
        <li>Machines teach a move, and evolution items evolve the pokemon that need them.</li>
        <li>Training items change a pokemon's values or effort.</li>
        <li>Fossils are revived by the Fossil Scientist, and valuables are only worth selling.</li>
        <li>
          Candies belong to a family. Every pokemon in that line spends the same pile to level up,
          and releasing one gives some back.
        </li>
      </HintList>
    </Hint>
  );
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
  /** Whoever is having its signature written, while the patch asks what gives way */
  const [patching, setPatching] = createSignal<string | null>(null);

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
    const carried = readable(props.items);

    if (item == null || carried == null) {
      return;
    }
    for (const entry of carried) {
      if (entry.item === item) {
        return;
      }
    }
    setUsing(null);
  });

  /**
   * Open the lobby a relic calls, from the bag, standing wherever the
   * player already is.
   *
   * Pressing it costs nothing: the server checks the relic is carried
   * and leaves it there, and it comes out of the bag when the raid
   * starts. So this needs no second question, and pressing the same
   * relic again is the way back into a lobby that was walked out of
   */
  const call = (item: Items): void => {
    const at = game.position();

    if (at == null) {
      said('Take a walk first: a relic is used where the player is standing.', 'ember');
      return;
    }

    hostMythicalRaid(at.chunkX, at.chunkY, item, getLocalOffset())
      .then((lobby) => {
        props.onSpent();

        if (lobby == null) {
          said('That relic called nothing.');
          return;
        }
        game.setRaid(lobby[0]);
        game.setDialog(GameDialog.Raids);
      })
      .catch((caught: unknown) => {
        said(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /**
   * Out of the cave, at the nearest mouth. Nothing is asked first: the
   * rope is spent on a place, and pressing it is the whole question.
   * The bag stays open over a board that has moved underneath it
   */
  const climb = (): void => {
    useEscapeRope()
      .then((at) => {
        if (at == null) {
          said('A rope is for the dark, and there is no way up within reach.', 'ember');
          return;
        }
        props.onSpent();
        game.standHere(at);
        said('Up the rope, and out into the light.', 'leaf');
      })
      .catch((caught: unknown) => {
        said(caught instanceof Error ? caught.message : String(caught), 'ember');
      });
  };

  /** The squares of one type, or of everything for `null` */
  const tray = (type: ItemTypes | null): ItemCell[] => {
    const cells: ItemCell[] = [];

    for (const entry of readable(props.items) ?? []) {
      if (type != null && typeOf(entry.item) !== type) {
        continue;
      }
      cells.push({
        item: entry.item,
        amount: entry.amount,
        said: `${relicVerb(entry.item)}${describeItem(entry.item)}, ${entry.amount} carried`,
      });
    }
    return cells;
  };

  /** The types the bag holds, in the order the bag is read */
  const types = createMemo((): ItemTypes[] => {
    const held = new Set<ItemTypes | null>();

    for (const entry of readable(props.items) ?? []) {
      held.add(typeOf(entry.item));
    }
    const order: ItemTypes[] = [];

    for (const type of ITEM_TYPE_ORDER) {
      if (held.has(type)) {
        order.push(type);
      }
    }
    return order;
  });
  /** The open pocket, remembered per device. A type the bag no longer holds falls back to All */
  const shelf = (): number => {
    const at = settings().bagPocket;

    return at === ALL_ITEMS || at === CANDIES || types().includes(at) ? at : ALL_ITEMS;
  };

  /**
   * Pressing a square. Nothing is refused: an item with no use has
   * nothing to press, and only the ones that do are announced as usable
   */
  const press = (item: Items): void => {
    if (isRelic(item)) {
      call(item);
      return;
    }
    if (isEscapeRope(item)) {
      climb();
      return;
    }
    if (isUsable(item)) {
      setUsing(item);
    }
  };

  const piles = (): CandyPile[] => {
    const stacks: CandyPile[] = [];

    for (const stack of readable(props.candies) ?? []) {
      stacks.push({ family: stack.family, count: stack.count });
    }
    return stacks;
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
    if (isAbilityPatch(item)) {
      setPatching(catchId);
      return;
    }

    spendItemOn(catchId, item)
      .then(async (result) => {
        toast.push(spentToast(item, result));
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
      {/* One level of pockets: a side list from `md` up, a bar that
          scrolls sideways on a phone */}
      <TabGroup
        horizontal
        value={shelf()}
        onChange={(value) => {
          setSetting('bagPocket', value);
        }}
        class="flex flex-col gap-3 md:flex-row md:items-start md:gap-4"
      >
        <TabBar class="md:sticky md:top-0 md:w-44 md:shrink-0 md:flex-col md:overflow-visible">
          <TabButton value={ALL_ITEMS} class="md:justify-between">
            All
            <Count of={readable(props.items)?.length ?? 0} />
          </TabButton>
          <For each={types()}>
            {(type) => (
              <TabButton value={type} class="md:justify-between">
                {ITEM_TYPE_NAMES[type]}
                <Count of={tray(type).length} />
              </TabButton>
            )}
          </For>
          <span aria-hidden="true" class="mx-2 my-1 hidden h-0.5 bg-line-soft md:block" />
          <TabButton value={CANDIES} class="md:justify-between">
            Candies
            <Count of={piles().length} />
          </TabButton>
        </TabBar>

        <div class="min-w-0 grow">
          <TabPane value={ALL_ITEMS}>
            <Show
              when={readable(props.items)?.length}
              fallback={<Note>{failed(props.items) ?? 'Carrying nothing.'}</Note>}
            >
              <ItemGrid entries={tray(null)} onPress={press} />
            </Show>
          </TabPane>
          <For each={types()}>
            {(type) => (
              <TabPane value={type}>
                <ItemGrid entries={tray(type)} onPress={press} />
              </TabPane>
            )}
          </For>
          <TabPane value={CANDIES}>
            <Show when={failed(props.candies)} fallback={<CandyGrid piles={piles()} />}>
              {(refused) => <Note>{refused()}</Note>}
            </Show>
          </TabPane>
        </div>
      </TabGroup>

      {/* Which pokemon it goes on, and the last press: the item is spent
          here rather than on a screen about the pokemon. Only the ones it
          would do some good are offered */}
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
        // stays up rather than closing after each
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

      {/* And a patch asks which ability the signature is written over,
          which is the one question here nothing undoes */}
      <AbilityPatchDialog
        catchId={patching()}
        onClose={() => {
          setPatching(null);
        }}
        onUsed={(message) => {
          said(message);
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
