import { ITEM_SPRITE, isHoldable, itemSlots } from '../describe';

import type { CatchOrder, CaughtPokemon } from '../../../../auth/caught';

import { getMovePoints } from '../../../../auth/caught-record';
import { getStats } from '../../../../auth/health';
import { Stats } from '../../../../data/constants/stats';

import type { InventoryEntry } from '../../../../auth/inventory';

import type Abilities from '../../../../data/ids/abilities';

import type { Items } from '../../../../data/ids/items';

import type { Moves } from '../../../../data/ids/moves';

import { getMoveData } from '../../../../data/moves';

import { describeAbility, detailAbility } from '../../../details';

import InventoryPicker from '../../../items/InventoryPicker';
import ItemCard from '../../../items/ItemCard';

import ItemSprite from '../../../items/ItemSprite';
import MoveHoverCard from '../../../moves/MoveHoverCard';

import {
  Badge,
  Button,
  DialogSection,
  HoverCard,
  Note,
  Row,
  TooltipHost,
  carried,
  createReorder,
} from '../../../styled';

import { Index, type JSX, Show, createEffect, createSignal, on } from 'solid-js';

/**
 * What it brings to a fight, in one row: what it knows, what it is,
 * and what it is carrying.
 *
 * All three are lists its owner can put in order, and the order is not
 * decoration: a fight allows so many of each and takes them from the
 * top, so a pokemon that knows eight moves in a fight that allows four
 * fights with the first four. They are laid out here and saved
 * together on one press, so shuffling all three costs one round trip.
 */
export interface BattleSectionProps {
  caught: CaughtPokemon;
  owned: boolean;
  frozen: boolean;
  /** What in the bag it could be given, which decides whether a slot invites a press */
  holdables: InventoryEntry[];
  bag: InventoryEntry[] | undefined;
  /** Whether the bag is open over the sheet */
  giving: boolean;
  onGiving: (open: boolean) => void;
  onGive: (item: Items) => void;
  /** Take this item back into the bag */
  onTake: (item: Items) => void;
  /** Save the whole arrangement, whichever of the three lists moved */
  onArrange: (order: CatchOrder) => void;
}

/** Whether a laid-out list stands in a different order to the stored one */
function shifted(laid: readonly number[], held: readonly number[]): boolean {
  return laid.length !== held.length || laid.some((entry, at) => entry !== held[at]);
}

export default function BattleSection(props: BattleSectionProps): JSX.Element {
  /**
   * The three lists as the player has laid them out, which is the
   * section's own until Save is pressed. A pokemon that is not theirs,
   * or is being held still, is read rather than arranged
   */
  const [moves, setMoves] = createSignal<Moves[]>([]);
  const [abilities, setAbilities] = createSignal<Abilities[]>([]);
  const [items, setItems] = createSignal<Items[]>([]);

  const lay = (caught: CaughtPokemon): void => {
    setMoves([...caught.moves]);
    setAbilities([...caught.abilities]);
    setItems([...caught.items]);
  };

  // A different pokemon on the sheet, or the same one saved, is a
  // fresh arrangement
  createEffect(on(() => props.caught, lay));

  const arrangeable = (): boolean => props.owned && !props.frozen;
  const laidOut = (): boolean =>
    shifted(moves(), props.caught.moves) ||
    shifted(abilities(), props.caught.abilities) ||
    shifted(items(), props.caught.items);

  const movesOrder = createReorder({
    enabled: arrangeable,
    onMove: (from, to) => {
      setMoves((held) => carried(held, from, to));
    },
  });
  const abilitiesOrder = createReorder({
    enabled: arrangeable,
    onMove: (from, to) => {
      setAbilities((held) => carried(held, from, to));
    },
  });
  const itemsOrder = createReorder({
    enabled: arrangeable,
    // Only the filled squares are carried: the empty ones past them
    // are a button for giving it something, not a place in the order
    onMove: (from, to) => {
      setItems((held) => (to < held.length ? carried(held, from, to) : held));
    },
  });

  /** How a draggable entry is drawn, and how the one in hand is */
  const grip = (lifted: boolean): string => {
    if (!arrangeable()) {
      return '';
    }
    return lifted ? 'cursor-grabbing opacity-50' : 'cursor-grab';
  };

  const save = (): void => {
    props.onArrange({
      ...(shifted(moves(), props.caught.moves) ? { moves: moves() } : {}),
      ...(shifted(abilities(), props.caught.abilities) ? { abilities: abilities() } : {}),
      ...(shifted(items(), props.caught.items) ? { items: items() } : {}),
    });
  };

  return (
    <DialogSection>
      <Show when={arrangeable()}>
        {/* Said once for all three lists, since what it is worth is
            the same in each: the top of the list is what it takes
            into a fight that allows fewer than it has */}
        <Note>
          Drag to put them in order, or hold Alt and press the arrows. A fight that allows fewer
          than it has takes them from the top.
        </Note>
      </Show>

      <div class="grid gap-3 sm:grid-cols-3">
        <div class="flex flex-col gap-1">
          <h4>Moves</h4>
          {/* The name, with the entry over it. The
          description was written out under each row
          once, which is four paragraphs in a column
          a third this wide */}
          <Show when={moves().length} fallback={<Note>It knows nothing.</Note>}>
            <ul class="m-0 flex list-none flex-col gap-1 p-0" {...movesOrder.listProps}>
              <Index each={moves()}>
                {(move, at) => (
                  <li {...movesOrder.itemProps(at)} class={grip(movesOrder.held() === at)}>
                    <MoveHoverCard
                      class="block"
                      move={move()}
                      points={getMovePoints(props.caught, move())}
                      speed={getStats(props.caught)[Stats.Speed]}
                    >
                      {/* The name and nothing else: what
                      kind it is and what it does are
                      on the card over it, and three
                      marks in a column this narrow
                      left no room for the word */}
                      <span
                        class="block truncate rounded-lg border-2 border-line
                      bg-paper px-2 py-1 text-sm font-medium"
                      >
                        {getMoveData(move()).name}
                      </span>
                    </MoveHoverCard>
                  </li>
                )}
              </Index>
            </ul>
          </Show>
        </div>

        <div class="flex flex-col gap-1">
          <h4>Abilities</h4>
          <Show when={abilities().length} fallback={<Note>None.</Note>}>
            <ul class="m-0 flex list-none flex-col gap-1 p-0" {...abilitiesOrder.listProps}>
              <Index each={abilities()}>
                {(ability, at) => (
                  <li {...abilitiesOrder.itemProps(at)} class={grip(abilitiesOrder.held() === at)}>
                    <TooltipHost class="block" {...detailAbility(ability())}>
                      <Badge class="w-full justify-center" wrap>
                        {describeAbility(ability())}
                      </Badge>
                    </TooltipHost>
                  </li>
                )}
              </Index>
            </ul>
          </Show>
        </div>

        <div class="flex flex-col gap-1">
          <h4>Held items</h4>
          {/* Squares four across, the way the bag draws
          them: a pokemon carries one by default and
          a Utility Belt widens the record's own
          room, so the tray is as wide as the pokemon
          is rather than as wide as the game allows.
          Room is only drawn for somebody who can
          fill it — an empty square on a stranger's
          pokemon is a button nobody may press */}
          <ul class="m-0 grid list-none grid-cols-4 gap-1 p-0" {...itemsOrder.listProps}>
            <Index each={itemSlots(props.caught, props.owned)}>
              {(_, at) => (
                <li
                  class={`contents ${at < items().length ? grip(itemsOrder.held() === at) : ''}`}
                  {...(at < items().length ? itemsOrder.itemProps(at) : {})}
                >
                  <Show
                    when={at < items().length}
                    fallback={
                      <button
                        type="button"
                        disabled={props.frozen || props.holdables.length === 0}
                        aria-label="Give it an item"
                        class="flex aspect-square cursor-pointer items-center
                      justify-center rounded-lg border-2 border-dashed
                      border-line bg-paper/40 p-0 text-muted shadow-none
                      hover:border-tide hover:text-tide-dark
                      active:translate-y-0 disabled:cursor-not-allowed"
                        onClick={() => {
                          props.onGiving(true);
                        }}
                      >
                        +
                      </button>
                    }
                  >
                    <HoverCard
                      class="block"
                      title="Info"
                      footer={(close) => (
                        <Show when={props.owned} fallback={<Button onClick={close}>Close</Button>}>
                          <Button
                            tone="primary"
                            disabled={props.frozen}
                            onClick={() => {
                              close();
                              props.onTake(items()[at]);
                            }}
                          >
                            Take
                          </Button>
                        </Show>
                      )}
                      trigger={
                        <span
                          class="flex aspect-square w-full items-center
                        justify-center rounded-lg border-2 border-line bg-paper"
                        >
                          <ItemSprite item={items()[at]} size={ITEM_SPRITE} label="" />
                        </span>
                      }
                    >
                      <ItemCard item={items()[at]} />
                    </HoverCard>
                  </Show>
                </li>
              )}
            </Index>
          </ul>
        </div>
      </div>

      {/* One press for all three lists: the section holds what has
          been laid out and hands it over when the player saves */}
      <Show when={laidOut()}>
        <Row>
          <Button
            onClick={() => {
              lay(props.caught);
            }}
          >
            Undo
          </Button>
          <Button tone="primary" disabled={props.frozen} onClick={save}>
            Save
          </Button>
        </Row>
      </Show>

      {/* The bag opens as its own window rather than
      unfolding inside the sheet: a tray of thirty
      squares pushed everything under it off the
      screen */}
      <Show when={props.owned}>
        <InventoryPicker
          open={props.giving}
          onClose={() => {
            props.onGiving(false);
          }}
          title="Give an item"
          description="Choose what it should carry."
          entries={props.bag}
          disabled={props.frozen}
          value={null}
          verb="Give"
          filter={(entry) => isHoldable(entry.item)}
          onPick={(item) => {
            props.onGiving(false);

            if (item != null) {
              props.onGive(item);
            }
          }}
        />
      </Show>
    </DialogSection>
  );
}
