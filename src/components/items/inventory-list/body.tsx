import {
  For,
  type JSX,
  type Resource,
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
} from 'solid-js';
import type { CandyStack } from '../../../auth/candy';
import { getCaught } from '../../../auth/caught';
import { capAsksForStat } from '../../../data/items/bottle-caps';
import { type ItemTypes, type Items, getMachineMove, isMachineItem } from '../../../data/ids/items';
import type { Moves } from '../../../data/ids/moves';
import { isAbilityPatch } from '../../../data/items/ability-items';
import { isPPItem } from '../../../data/items/vitamins';
import type { InventoryEntry } from '../../../auth/inventory';
import { getLocalOffset } from '../../../model/local-time';
import useEscapeRope from '../../../auth/escape-rope';
import { hostMythicalRaid } from '../../../auth/raids';
import { isEscapeRope } from '../../../data/items/escape-rope';
import { ITEM_TYPE_ORDER } from '../../../data/items/names';
import CatchPicker from '../../catches/catch-picker';
import AbilityPatchDialog from '../../catches/AbilityPatchDialog';
import IncreasePPDialog from '../../catches/IncreasePPDialog';
import BottleCapDialog from '../../catches/BottleCapDialog';
import { askTeachings } from '../../forms/teach-move';
import CandyGrid, { type CandyPile } from '../CandyGrid';
import ItemGrid, { type ItemCell } from '../ItemGrid';
import { describeItem } from '../../details';
import spendItemOn, { isUsableOn } from '../../../game/items/use-item';
import { getLevelMovesBetween } from '../../../model/level-moves';
import spentToast, { playSpentCue } from '../spent-toast';
import { GameDialog, useGame } from '../../app/game-context';
import { Note, RailCount, RailTab, RailTabs, TabGroup, TabPane, useToast } from '../../styled';
import DetailPanel from './DetailPanel';
import settings, { setSetting } from '../../app/settings';
import { failed, readable } from '../../app/resource-reads';
import describeFailure from '../../../i18n/refusals';
import {
  ALL_ITEMS,
  ALL_TONE,
  CANDIES,
  CANDY_TONE,
  POCKET_NAMES,
  POCKET_TONES,
  getItemType,
  isRelic,
  isUsable,
} from './pockets';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';

export interface InventoryListProps {
  player: string;
  /** The item whose details are docked beside the tray, if any */
  chosen: Items | null;
  onChoose: (item: Items | null) => void;
}

/**
 * A pocket's row, a little shorter than a box's: the bag can hold twelve
 * pockets, and all of them stand beside the tray on a laptop
 */
const POCKET_ROW = 'md:!min-h-9 md:!py-1';

/** A pocket's colour, as a square on its row */
function PocketDot(props: { tone: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class="size-4 shrink-0 rounded-[5px] md:size-[22px] md:rounded-[7px]"
      style={{ background: props.tone }}
    />
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
  /** A move a candy grew it into, which is free, rather than a machine's */
  levelled: boolean;
}

/**
 * The bag itself, which is where the stacks are read.
 *
 * Either read in the body that declared it would throw past every
 * `Suspense` written there and land on the boundary around the whole
 * page, so the reading half is its own component
 */
export default function BagBody(
  props: InventoryListProps & {
    items: Resource<InventoryEntry[]>;
    candies: Resource<CandyStack[]>;
    onSpent: () => void;
  },
): JSX.Element {
  const game = useGame();
  const toast = useToast();
  /** The docked panel's id, which the square that opened it points at */
  const panelId = createUniqueId();
  /** The tray and its pockets, where a square is found to hand focus back to */
  let shelves: HTMLDivElement | undefined;
  /**
   * What has been chosen to spend, while the pokemon to spend it on is
   * being picked. The bag asks in that order (item, then pokemon)
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
  /** The catch a Bottle Cap is being spent on, while it asks which stat */
  const [capping, setCapping] = createSignal<string | null>(null);

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
      said(m.item_relic_no_place(), 'ember');
      return;
    }

    hostMythicalRaid(at.chunkX, at.chunkY, item, getLocalOffset())
      .then((lobby) => {
        props.onSpent();

        if (lobby == null) {
          said(m.item_relic_nothing());
          return;
        }
        game.setRaid(lobby[0]);
        game.setDialog(GameDialog.Raids);
      })
      .catch((caught: unknown) => {
        said(describeFailure(caught), 'ember');
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
          said(m.item_rope_refused(), 'ember');
          return;
        }
        props.onSpent();
        game.standHere(at);
        said(m.item_rope_used(), 'leaf');
      })
      .catch((caught: unknown) => {
        said(describeFailure(caught), 'ember');
      });
  };

  /** The squares of one type, or of everything for `null` */
  const tray = (type: ItemTypes | null): ItemCell[] => {
    const cells: ItemCell[] = [];

    for (const entry of readable(props.items) ?? []) {
      if (type != null && getItemType(entry.item) !== type) {
        continue;
      }
      cells.push({
        item: entry.item,
        amount: entry.amount,
        current: entry.item === props.chosen,
        // A press opens the panel rather than spending it, so the square
        // says what it is and the panel's button says what it does
        expanded: entry.item === props.chosen,
        controls: entry.item === props.chosen ? panelId : undefined,
        said: m.item_cell_carried({
          label: describeItem(entry.item),
          count: formatNumber(entry.amount),
        }),
      });
    }
    return cells;
  };

  /** The types the bag holds, in the order the bag is read */
  const types = createMemo((): ItemTypes[] => {
    const held = new Set<ItemTypes | null>();

    for (const entry of readable(props.items) ?? []) {
      held.add(getItemType(entry.item));
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

  // A machine asks which move is given up for it, and a level whether a
  // new one is taken at all: the same form with a different price
  askTeachings(teaching, nextTeaching, () => {
    said(m.catch_taught());
    changed();
  });

  /**
   * Spend it where the player is standing.
   *
   * The bag used to hand the pair to the catch sheet and let it do the
   * spending, which meant every potion opened a whole screen about the
   * pokemon it was spent on. The two items that ask a question back
   * (a machine, a bottle) ask it here instead
   */
  const spend = (catchId: string, item: Items): void => {
    const move = isMachineItem(item) ? getMachineMove(item) : null;

    if (move != null) {
      setTeaching({ catchId, move, rest: [], levelled: false });
      return;
    }
    if (isPPItem(item)) {
      setBottling({ catchId, item });
      return;
    }
    if (capAsksForStat(item)) {
      setCapping(catchId);
      return;
    }
    if (isAbilityPatch(item)) {
      setPatching(catchId);
      return;
    }

    spendItemOn(catchId, item)
      .then(async (result) => {
        playSpentCue(result);
        toast.push(spentToast(item, result));
        changed();

        // A candy can grow it into a move, which is the one question
        // that comes after the item rather than before it
        if (result.level == null) {
          return;
        }

        const caught = await getCaught(catchId);
        const learning =
          caught == null
            ? []
            : getLevelMovesBetween(caught, result.from ?? result.level, result.level);

        if (learning.length > 0) {
          setTeaching({ catchId, move: learning[0], rest: learning.slice(1), levelled: true });
        }
      })
      .catch((caught: unknown) => {
        said(describeFailure(caught), 'ember');
      });
  };

  /**
   * Put focus back on the square whose panel was just closed, so a
   * keyboard is left where it was rather than at the top of the page.
   * Only the open pocket's square is drawn, and so only it has a box
   */
  const refocus = (item: Items): void => {
    for (const square of shelves?.querySelectorAll<HTMLElement>(`[data-item="${item}"]`) ?? []) {
      if (square.offsetParent != null) {
        square.focus();
        return;
      }
    }
  };

  /** A square pressed docks its item beside the tray; pressed again, it goes back */
  const choose = (item: Items): void => {
    props.onChoose(props.chosen === item ? null : item);
  };

  /** The stack whose details are docked, while it is still carried */
  const docked = (): InventoryEntry | undefined => {
    for (const entry of readable(props.items) ?? []) {
      if (entry.item === props.chosen) {
        return entry;
      }
    }
    return undefined;
  };

  // A stack spent to nothing takes its details with it
  createEffect(() => {
    if (props.chosen != null && readable(props.items) != null && docked() == null) {
      props.onChoose(null);
    }
  });

  /** What the panel's button does, or nothing for an item with no use from the bag */
  const verbFor = (item: Items): string | null => {
    if (isRelic(item)) {
      return m.item_open_raid_with({ item: describeItem(item) });
    }
    if (isEscapeRope(item)) {
      return m.item_climb_out_with({ item: describeItem(item) });
    }
    return isUsable(item) ? m.item_panel_use() : null;
  };

  /** The open pocket's name, over its tray */
  const shelfName = (): string => {
    const at = shelf();

    if (at === ALL_ITEMS) {
      return m.item_pocket_all();
    }
    return at === CANDIES ? m.item_pocket_candies() : POCKET_NAMES[at as ItemTypes]();
  };

  /** How many stacks or piles the open pocket holds */
  const shelfCount = (): string => {
    const at = shelf();

    if (at === CANDIES) {
      return m.item_pocket_piles({ count: piles().length });
    }
    return m.item_pocket_stacks({
      count: at === ALL_ITEMS ? (readable(props.items)?.length ?? 0) : tray(at).length,
    });
  };

  return (
    <>
      {/* The pockets down the left from `md` up, a row of chips that
          scrolls sideways on a phone; the tray beside them; and the item
          pressed, docked on the right */}
      <TabGroup
        horizontal
        value={shelf()}
        onChange={(value) => {
          setSetting('bagPocket', value);
        }}
        class="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-5"
      >
        {/* Wide enough for "Objetos equipables" and its count */}
        <RailTabs label={m.panel_bag()} class="md:w-[13rem]">
          <RailTab value={ALL_ITEMS} class={POCKET_ROW}>
            <PocketDot tone={ALL_TONE} />
            <span class="truncate">{m.item_pocket_all()}</span>
            <RailCount>{readable(props.items)?.length ?? 0}</RailCount>
          </RailTab>
          <For each={types()}>
            {(type) => (
              <RailTab value={type} class={POCKET_ROW}>
                <PocketDot tone={POCKET_TONES[type]} />
                <span class="truncate">{POCKET_NAMES[type]()}</span>
                <RailCount>{tray(type).length}</RailCount>
              </RailTab>
            )}
          </For>
          <span
            aria-hidden="true"
            class="mx-1 my-1.5 hidden h-0.5 shrink-0 bg-line-soft md:block"
          />
          <RailTab value={CANDIES} class={POCKET_ROW}>
            <PocketDot tone={CANDY_TONE} />
            <span class="truncate">{m.item_pocket_candies()}</span>
            <RailCount>{piles().length}</RailCount>
          </RailTab>
        </RailTabs>

        <div ref={shelves} class="flex min-w-0 grow flex-col gap-2.5">
          <div class="flex items-baseline gap-2.5">
            <h3 class="m-0 font-display text-xl leading-tight font-semibold">{shelfName()}</h3>
            <span class="text-[13px] text-muted">{shelfCount()}</span>
          </div>
          <TabPane value={ALL_ITEMS}>
            <Show
              when={readable(props.items)?.length}
              fallback={<Note>{failed(props.items) ?? m.item_bag_empty()}</Note>}
            >
              <ItemGrid entries={tray(null)} onPress={choose} fill />
            </Show>
          </TabPane>
          <For each={types()}>
            {(type) => (
              <TabPane value={type}>
                <ItemGrid entries={tray(type)} onPress={choose} fill />
              </TabPane>
            )}
          </For>
          <TabPane value={CANDIES}>
            <Show when={failed(props.candies)} fallback={<CandyGrid piles={piles()} fill />}>
              {(refused) => <Note>{refused()}</Note>}
            </Show>
          </TabPane>
        </div>

        {/* Proposal, approved: the item pressed, with its verb */}
        <Show when={docked()}>
          {(entry) => (
            <DetailPanel
              id={panelId}
              player={props.player}
              item={entry().item}
              amount={entry().amount}
              pocket={(() => {
                const type = getItemType(entry().item);

                return type == null ? m.item_pocket_all() : POCKET_NAMES[type]();
              })()}
              tone={(() => {
                const type = getItemType(entry().item);

                return type == null ? ALL_TONE : POCKET_TONES[type];
              })()}
              verb={verbFor(entry().item)}
              // In the order a press checks: a relic and the rope are
              // spent on a place, so neither has pokemon to help
              onPokemon={
                !isRelic(entry().item) && !isEscapeRope(entry().item) && isUsable(entry().item)
              }
              onVerb={() => {
                press(entry().item);
              }}
              onClose={() => {
                const item = entry().item;

                props.onChoose(null);
                refocus(item);
              }}
            />
          )}
        </Show>
      </TabGroup>

      {/* Which pokemon it goes on, and the last press: the item is spent
          here rather than on a screen about the pokemon. Only the ones it
          would do some good are offered */}
      <CatchPicker
        player={props.player}
        open={using() != null}
        value={null}
        title={m.item_use_on()}
        verb={m.catch_use()}
        empty={m.item_use_on_empty()}
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

      <BottleCapDialog
        catchId={capping()}
        onClose={() => {
          setCapping(null);
        }}
        onUsed={(message) => {
          said(message);
          changed();
        }}
      />
    </>
  );
}
