import { ITEM_SPRITE, isHoldable, itemSlots } from '../describe';

import type { CatchOrder, CaughtPokemon } from '../../../../auth/caught';

import { getCatchSlots, getHeldItemRoom, getMovePoints } from '../../../../model/caught-record';
import { getStats } from '../../../../model/health';
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

import { Items } from '../../../../data/ids/items';

import type { Moves } from '../../../../data/ids/moves';

import { getMoveData, getMovePP } from '../../../../data/moves';
import { TYPE_COLORS, TYPE_NAMES } from '../../../../data/constants/types';

import {
  type AbilityKind,
  abilityKind,
  describeAbility,
  describeItem,
  detailAbility,
  detailItem,
} from '../../../details';
import { CHANNELER_FEE } from '../../../../data/overworld/npc';

import InventoryPicker from '../../../items/InventoryPicker';
import ItemCard from '../../../items/ItemCard';

import ItemSprite from '../../../items/ItemSprite';
import MoveTooltip from '../../../moves/MoveTooltip';
import { MOVE_CATEGORY_LABELS } from '../../../sprites/MoveCategorySprite';
import { LockIcon } from '../../../icons';
import { CARD, CARD_TITLE, riseAfter } from '../metrics';

import {
  Button,
  Hint,
  HintList,
  HoverCard,
  TooltipHost,
  carried,
  createReorder,
} from '../../../styled';

import { Index, type JSX, Show, createEffect, createSignal, on } from 'solid-js';
import { m } from '../../../../i18n/paraglide/messages.js';

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

/**
 * A slot the pokemon has room for and has not filled, or one it has no
 * room for yet. Both are drawn so the layout never shifts, and are told
 * apart so a player can see what is free and what still has to be opened
 */
type OpenSlot = 'empty' | 'locked';

/** One entry per slot between what is shown and the most allowed, `room` of them open */
function unfilled(shown: number, room: number, kind: Slots): OpenSlot[] {
  const open: OpenSlot[] = [];

  for (let slot = shown; slot < mostSlots(kind); slot += 1) {
    open.push(slot < room ? 'empty' : 'locked');
  }
  return open;
}

/** An ability's slot colour by where it comes from: its hidden pool, or its family's signature */
const ABILITY_SLOTS: Record<AbilityKind, string> = {
  regular: 'border-line bg-paper text-ink',
  hidden: 'border-arcane/40 bg-arcane-soft text-arcane-dark',
  signature: 'border-gold/60 bg-gold-soft text-gold-dark',
};

/** A move card, and the empty and locked cards beside it */
const MOVE_CARD = 'min-h-[66px] rounded-[14px]';

/** An ability slot */
const ABILITY_SLOT = 'h-9 rounded-[10px]';

/** A held item's square */
const ITEM_SQUARE = 'size-12 rounded-button';

/** What a move is, said under its name: type, category, power and PP */
function describeMove(move: Moves, points: number): string {
  const data = getMoveData(move);
  const facts = {
    type: TYPE_NAMES[data.type],
    category: MOVE_CATEGORY_LABELS[data.category](),
    pp: getMovePP(move, points),
  };

  // A status move has no power to state
  return data.power == null
    ? m.catch_move_facts_status(facts)
    : m.catch_move_facts({ ...facts, power: data.power });
}

/** What opens a locked slot of each kind */
const UNLOCKED_BY: Record<Slots, () => string> = {
  [Slots.Ability]: m.catch_slot_unlock_ability,
  [Slots.Item]: () => m.catch_slot_unlock_item({ item: describeItem(Items.UtilityBelt) }),
  [Slots.Move]: () => m.catch_slot_unlock_move({ item: describeItem(Items.HeartScale) }),
};

/**
 * An unfilled slot: dashed while free, shaded with a lock while it still
 * has to be opened. A wordy one says which it is; a square says it with
 * its look alone and its label
 */
function Unfilled(props: {
  state: OpenSlot;
  kind: Slots;
  class: string;
  wordy?: boolean;
}): JSX.Element {
  return (
    <Show
      when={props.state === 'locked'}
      fallback={
        <li
          aria-label={m.catch_slot_empty_label()}
          class={`flex items-center justify-center border-2 border-dashed border-line text-[13px] font-bold
            text-muted ${props.class}`}
        >
          {props.wordy === true ? m.catch_slot_empty_label() : ''}
        </li>
      }
    >
      <li>
        <TooltipHost
          class="block"
          name={m.catch_slot_locked()}
          description={UNLOCKED_BY[props.kind]()}
        >
          <span
            class={`flex items-center justify-center gap-1.5 border-2 border-dashed border-line-soft
              bg-line-soft/60 text-[13px] font-bold text-muted ${props.class}`}
          >
            <LockIcon class="size-3.5" aria-hidden="true" />
            {props.wordy === true ? m.catch_slot_locked() : ''}
          </span>
        </TooltipHost>
      </li>
    </Show>
  );
}

/**
 * A list's title with its Undo and Save on the far side. The row is as
 * tall as the buttons whether or not they are showing, so reordering
 * never moves anything under it
 */
function Heading(props: {
  title: string;
  /** A word on the right while nothing is waiting to be saved */
  note?: string;
  /** What the info icon beside the title explains */
  hint: JSX.Element;
  shifted: boolean;
  frozen: boolean;
  onUndo: () => void;
  onSave: () => void;
}): JSX.Element {
  return (
    <div class="flex min-h-8 items-center justify-between gap-2">
      <span class="flex items-center gap-1.5">
        <h3 class={CARD_TITLE}>{props.title}</h3>
        {props.hint}
      </span>
      <Show
        when={props.shifted}
        fallback={
          <Show when={props.note}>
            <span class="text-xs font-bold text-muted">{props.note}</span>
          </Show>
        }
      >
        <div class="flex gap-1">
          <Button onClick={props.onUndo}>{m.catch_undo()}</Button>
          <Button tone="primary" disabled={props.frozen} onClick={props.onSave}>
            {m.catch_heading_save()}
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
    return lifted ? 'cursor-grabbing shadow-pop' : 'cursor-grab';
  };

  const save = (): void => {
    props.onArrange({
      ...(shifted(moves(), props.caught.moves) ? { moves: moves() } : {}),
      ...(shifted(abilities(), props.caught.abilities) ? { abilities: abilities() } : {}),
      ...(shifted(items(), props.caught.items) ? { items: items() } : {}),
    });
  };

  return (
    // A container, so the cards lay themselves out by the room the
    // column has rather than by the window: three moves to a row and
    // the two short cards side by side where there is room for them
    <section class="@container flex min-w-0 flex-col gap-2.5">
      {/* The moves first: they are what a player builds around */}
      <div class={CARD} style={riseAfter(1)}>
        <Heading
          title={m.catch_moves()}
          hint={
            <Hint title={m.catch_moves_help()}>
              <HintList>
                <li>
                  {m.catch_moves_help_room({
                    start: DEFAULT_MOVE_SLOTS,
                    max: mostSlots(Slots.Move),
                  })}
                </li>
                <li>{m.catch_moves_help_order()}</li>
                <li>{m.catch_moves_help_pp()}</li>
                <li>{m.catch_moves_help_speed()}</li>
              </HintList>
            </Hint>
          }
          note={arrangeable() ? m.catch_drag_reorder() : undefined}
          shifted={shifted(moves(), props.caught.moves)}
          frozen={props.frozen}
          onUndo={() => {
            setMoves([...props.caught.moves]);
          }}
          onSave={save}
        />
        <ul
          class="m-0 grid list-none grid-cols-2 gap-2 p-0 @lg:grid-cols-3"
          {...movesOrder.listProps}
        >
          <Index each={moves()}>
            {(move, at) => (
              <li
                {...movesOrder.itemProps(at)}
                style={movesOrder.style(at)}
                class={grip(movesOrder.held() === at)}
              >
                <MoveTooltip
                  class="block"
                  move={move()}
                  points={getMovePoints(props.caught, move())}
                  speed={getStats(props.caught)[Stats.Speed]}
                >
                  {/* Its name and what it is at a glance, its type as the
                      stripe down its side; what it does is on the card
                      over it */}
                  <span
                    class={`relative flex ${MOVE_CARD} flex-col justify-center gap-0.5 overflow-hidden
                      border-2 border-line bg-paper py-2 pr-2.5 pl-4 text-left transition-[translate,box-shadow]
                      duration-(--motion-quick) ease-spring hover:-translate-y-0.75 hover:shadow-pop`}
                  >
                    <span
                      aria-hidden="true"
                      class="absolute inset-y-0 left-0 w-1.5"
                      style={{ background: TYPE_COLORS[getMoveData(move()).type] }}
                    />
                    <span class="truncate text-sm font-extrabold">{getMoveData(move()).name}</span>
                    <span class="line-clamp-2 text-[11px] leading-[14px] text-muted @lg:truncate">
                      {describeMove(move(), getMovePoints(props.caught, move()))}
                    </span>
                  </span>
                </MoveTooltip>
              </li>
            )}
          </Index>
          <Index
            each={unfilled(moves().length, getCatchSlots(props.caught, Slots.Move), Slots.Move)}
          >
            {(state) => <Unfilled state={state()} kind={Slots.Move} class={MOVE_CARD} wordy />}
          </Index>
        </ul>
      </div>

      {/* What it is and what it carries, side by side under the moves */}
      <div class="grid gap-2.5 @lg:grid-cols-[minmax(0,1fr)_12.5rem]">
        <div class={CARD} style={riseAfter(2)}>
          <Heading
            title={m.catch_abilities()}
            hint={
              <Hint title={m.catch_abilities_help()}>
                <HintList>
                  <li>
                    {m.catch_abilities_help_room({
                      start: DEFAULT_ABILITY_SLOTS,
                      max: mostSlots(Slots.Ability),
                    })}
                  </li>
                  <li>
                    {m.catch_abilities_help_items({
                      capsule: describeItem(Items.AbilityCapsule),
                      patch: describeItem(Items.AbilityPatch),
                    })}
                  </li>
                  <li>{m.catch_abilities_help_channeler({ fee: describeItem(CHANNELER_FEE) })}</li>
                  <li>{m.catch_abilities_help_order()}</li>
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
          <ul class="m-0 grid list-none grid-cols-2 gap-1.5 p-0" {...abilitiesOrder.listProps}>
            <Index each={abilities()}>
              {(ability, at) => (
                <li
                  {...abilitiesOrder.itemProps(at)}
                  style={abilitiesOrder.style(at)}
                  class={grip(abilitiesOrder.held() === at)}
                >
                  <TooltipHost class="block" kind="ability" {...detailAbility(ability())}>
                    <span
                      class={`flex ${ABILITY_SLOT} min-w-0 items-center border-2 px-2.5 text-[13px]
                        font-extrabold ${ABILITY_SLOTS[abilityKind(props.caught.species, ability())]}`}
                    >
                      <span class="truncate">{describeAbility(ability())}</span>
                    </span>
                  </TooltipHost>
                </li>
              )}
            </Index>
            <Index
              each={unfilled(
                abilities().length,
                getCatchSlots(props.caught, Slots.Ability),
                Slots.Ability,
              )}
            >
              {(state) => (
                <Unfilled
                  state={state()}
                  kind={Slots.Ability}
                  class={`${ABILITY_SLOT} px-2.5`}
                  wordy
                />
              )}
            </Index>
          </ul>
        </div>

        <div class={CARD} style={riseAfter(3)}>
          <Heading
            title={m.catch_held_items()}
            hint={
              <Hint title={m.catch_held_items_help()}>
                <HintList>
                  <li>
                    {m.catch_held_items_help_room({
                      start: DEFAULT_ITEM_SLOTS,
                      belt: describeItem(Items.UtilityBelt),
                      max: mostSlots(Slots.Item),
                    })}
                  </li>
                  <li>{m.catch_held_items_help_give()}</li>
                  <li>{m.catch_held_items_help_order()}</li>
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
          <ul
            class="m-0 grid list-none grid-cols-[repeat(auto-fill,3rem)] gap-1.5 p-0"
            {...itemsOrder.listProps}
          >
            <Index each={itemSlots(props.caught, props.owned)}>
              {(_, at) => (
                <li
                  class={`contents ${at < items().length ? grip(itemsOrder.held() === at) : ''}`}
                  {...(at < items().length ? itemsOrder.itemProps(at) : {})}
                  style={itemsOrder.style(at)}
                >
                  <Show
                    when={at < items().length}
                    fallback={
                      <button
                        type="button"
                        disabled={props.frozen || props.holdables.length === 0}
                        aria-label={m.catch_give_item()}
                        class={`flex ${ITEM_SQUARE} cursor-pointer items-center
                          justify-center border-2 border-dashed border-line
                          bg-transparent p-0 font-extrabold text-muted shadow-none
                          hover:border-tide hover:text-tide-dark
                          active:translate-y-0 disabled:cursor-not-allowed`}
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
                      title={detailItem(items()[at]).name}
                      kind={m.tooltip_kind_item()}
                      footer={(close) => (
                        <Show
                          when={props.owned}
                          fallback={<Button onClick={close}>{m.ui_close()}</Button>}
                        >
                          <Button
                            tone="primary"
                            disabled={props.frozen}
                            onClick={() => {
                              close();
                              props.onTake(items()[at]);
                            }}
                          >
                            {m.catch_take()}
                          </Button>
                        </Show>
                      )}
                      trigger={
                        <span
                          class={`flex ${ITEM_SQUARE} items-center justify-center border-2
                            border-line bg-paper`}
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
            <Index
              each={unfilled(
                itemSlots(props.caught, props.owned).length,
                getHeldItemRoom(props.caught),
                Slots.Item,
              )}
            >
              {(state) => <Unfilled state={state()} kind={Slots.Item} class={ITEM_SQUARE} />}
            </Index>
          </ul>
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
          title={m.catch_give_title()}
          description={m.catch_give_description()}
          entries={props.bag}
          disabled={props.frozen}
          value={null}
          verb={m.catch_give_verb()}
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
