import { ITEM_SPRITE, isHoldable, itemSlots } from '../describe';

import type { CatchOrder, CaughtPokemon } from '../../../../auth/caught';

import { getMovePoints } from '../../../../auth/caught-record';
import { getStats } from '../../../../auth/health';
import {
  DEFAULT_ABILITY_SLOTS,
  DEFAULT_ITEM_SLOTS,
  DEFAULT_MOVE_SLOTS,
  Slots,
  mostSlots,
} from '../../../../data/constants/slots';
import { Stats } from '../../../../data/constants/stats';

import type { InventoryEntry } from '../../../../auth/inventory';

import type Abilities from '../../../../data/ids/abilities';

import type { Items } from '../../../../data/ids/items';

import type { Moves } from '../../../../data/ids/moves';

import { getMoveData } from '../../../../data/moves';

import { describeAbility, describeItem, detailAbility } from '../../../details';
import { CHANNELER_FEE } from '../../../../data/overworld/npc';

import InventoryPicker from '../../../items/InventoryPicker';
import ItemCard from '../../../items/ItemCard';

import ItemSprite from '../../../items/ItemSprite';
import MoveHoverCard from '../../../moves/MoveHoverCard';
import MoveCategorySprite from '../../../sprites/MoveCategorySprite';
import { Sigil } from '../../../sprites/TypeBadge';

import {
  Badge,
  Button,
  Hint,
  HintList,
  HoverCard,
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

/** How big a move's type and category marks are drawn */
const MARK_SIZE = 18;

/**
 * A slot the pokemon could fill but has not: drawn so the layout never
 * shifts, and muted and inert so it is not mistaken for a control
 */
const OPEN_SLOT = 'rounded-lg border-2 border-dashed border-line-soft bg-paper/40';

/** One entry per slot left open between what is shown and the most allowed */
function unfilled(shown: number, kind: Slots): null[] {
  const open: null[] = [];

  for (let slot = shown; slot < mostSlots(kind); slot += 1) {
    open.push(null);
  }
  return open;
}

/**
 * A list's title with its Undo and Save on the far side. The row is as
 * tall as the buttons whether or not they are showing, so reordering
 * never moves anything under it
 */
function Heading(props: {
  title: string;
  /** What the info icon beside the title explains */
  hint: JSX.Element;
  shifted: boolean;
  frozen: boolean;
  onUndo: () => void;
  onSave: () => void;
}): JSX.Element {
  return (
    <div class="flex min-h-9 items-center justify-between gap-2">
      <span class="flex items-center gap-1.5">
        <h3 class="text-left">{props.title}</h3>
        {props.hint}
      </span>
      <Show when={props.shifted}>
        <div class="flex gap-1">
          <Button onClick={props.onUndo}>Undo</Button>
          <Button tone="primary" disabled={props.frozen} onClick={props.onSave}>
            Save
          </Button>
        </div>
      </Show>
    </div>
  );
}

/** Whether a laid-out list stands in a different order to the stored one */
function shifted(laid: readonly number[], held: readonly number[]): boolean {
  if (laid.length !== held.length) {
    return true;
  }
  for (const [at, entry] of laid.entries()) {
    if (entry !== held[at]) {
      return true;
    }
  }
  return false;
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
    <section class="flex flex-col">
      <div class="flex flex-col">
        <div class="flex min-w-0 flex-col gap-1 pb-3">
          <Heading
            title="Moves"
            hint={
              <Hint title="About moves">
                <HintList>
                  <li>
                    A pokemon knows up to {DEFAULT_MOVE_SLOTS} moves to start, and never more than{' '}
                    {mostSlots(Slots.Move)}.
                  </li>
                  <li>
                    Drag to reorder, or hold Alt and press the arrows. A fight that allows fewer
                    moves takes them from the top.
                  </li>
                  <li>
                    PP is how quickly a move comes back after use, not a count that runs out. PP Ups
                    raise it for good.
                  </li>
                  <li>
                    Speed shortens every cooldown. Hover a move to see its wait for this pokemon.
                  </li>
                </HintList>
              </Hint>
            }
            shifted={shifted(moves(), props.caught.moves)}
            frozen={props.frozen}
            onUndo={() => {
              setMoves([...props.caught.moves]);
            }}
            onSave={save}
          />
          <ul class="m-0 grid list-none grid-cols-2 gap-1 p-0" {...movesOrder.listProps}>
            <Index each={moves()}>
              {(move, at) => (
                <li {...movesOrder.itemProps(at)} class={grip(movesOrder.held() === at)}>
                  <MoveHoverCard
                    class="block"
                    move={move()}
                    points={getMovePoints(props.caught, move())}
                    speed={getStats(props.caught)[Stats.Speed]}
                  >
                    {/* Its name, type and category at a glance; what
                          it does is on the card over it */}
                    <span
                      class="flex items-center gap-2 rounded-lg border-2 border-line bg-paper
                          px-2 py-1 text-left text-sm font-medium"
                    >
                      <span class="grow truncate">{getMoveData(move()).name}</span>
                      <Sigil type={getMoveData(move()).type} size={MARK_SIZE} />
                      <MoveCategorySprite
                        category={getMoveData(move()).category}
                        size={MARK_SIZE}
                      />
                    </span>
                  </MoveHoverCard>
                </li>
              )}
            </Index>
            <Index each={unfilled(moves().length, Slots.Move)}>
              {() => (
                <li aria-hidden="true">
                  <span class={`block h-8 ${OPEN_SLOT}`} />
                </li>
              )}
            </Index>
          </ul>
        </div>

        {/* Abilities and held items side by side under the moves */}
        <div class="grid grid-cols-2 border-t border-line-soft">
          <div class="flex min-w-0 flex-col gap-1 border-r border-line-soft py-3 pr-3">
            <Heading
              title="Abilities"
              hint={
                <Hint title="About abilities">
                  <HintList>
                    <li>
                      A pokemon has room for {DEFAULT_ABILITY_SLOTS} ability to start, and up to{' '}
                      {mostSlots(Slots.Ability)}.
                    </li>
                    <li>
                      An Ability Capsule draws another ability its line can reach. An Ability Patch
                      writes in its family's signature ability.
                    </li>
                    <li>
                      The Channeler, a wandering NPC, calls up another ability its line can reach
                      and adds a slot for it. She charges one {describeItem(CHANNELER_FEE)} and
                      helps once each time she appears.
                    </li>
                    <li>
                      Drag to reorder. A fight that allows fewer abilities takes them from the top.
                    </li>
                  </HintList>
                </Hint>
              }
              shifted={shifted(abilities(), props.caught.abilities)}
              frozen={props.frozen}
              onUndo={() => {
                setAbilities([...props.caught.abilities]);
              }}
              onSave={save}
            />
            <ul class="m-0 grid list-none grid-cols-2 gap-1 p-0" {...abilitiesOrder.listProps}>
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
              <Index each={unfilled(abilities().length, Slots.Ability)}>
                {() => (
                  <li aria-hidden="true">
                    <span class={`block h-7 ${OPEN_SLOT}`} />
                  </li>
                )}
              </Index>
            </ul>
          </div>

          <div class="flex min-w-0 flex-col gap-1 py-3 pl-3">
            <Heading
              title="Held items"
              hint={
                <Hint title="About held items">
                  <HintList>
                    <li>
                      A pokemon holds {DEFAULT_ITEM_SLOTS} item to start. A Utility Belt adds a slot
                      for good, up to {mostSlots(Slots.Item)}.
                    </li>
                    <li>
                      Press an empty square to give an item from the bag. Hover an item to take it
                      back.
                    </li>
                    <li>
                      Drag to reorder. A fight that allows fewer items takes them from the top.
                    </li>
                  </HintList>
                </Hint>
              }
              shifted={shifted(items(), props.caught.items)}
              frozen={props.frozen}
              onUndo={() => {
                setItems([...props.caught.items]);
              }}
              onSave={save}
            />
            {/* Only its own room is drawn, and only for somebody who can
                fill it: an empty square on a stranger's pokemon is a
                button nobody may press */}
            <ul class="m-0 grid list-none grid-cols-8 gap-1 p-0" {...itemsOrder.listProps}>
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
                          <Show
                            when={props.owned}
                            fallback={<Button onClick={close}>Close</Button>}
                          >
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
              <Index each={unfilled(itemSlots(props.caught, props.owned).length, Slots.Item)}>
                {() => <li aria-hidden="true" class={`aspect-square ${OPEN_SLOT}`} />}
              </Index>
            </ul>
          </div>
        </div>
      </div>

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
    </section>
  );
}
