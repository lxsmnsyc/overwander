import { For, Index, type JSX, Show } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { getCatchName, getCatchSlots, isShiny } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { getMaxHealth, isFainted } from '../../auth/health';
import getSigil from '../../data/constants/sigil';
import { MAX_IV_STARS, getIVStars } from '../../data/constants/stats';
import { Slots } from '../../data/constants/slots';
import type { Items } from '../../data/ids/items';
import { NATURE_NAMES } from '../../data/ids/natures';
import { getMoveData } from '../../data/moves';
import { detailAbility } from '../details';
import { GENDER_LABELS, GENDER_MARKS } from './catch-summary';
import ItemCard from '../items/ItemCard';
import ItemSprite from '../items/ItemSprite';
import { Button, HoverCard, Meta, TooltipHost } from '../styled';

/**
 * One of the player's pokemon, read at a glance: which individual it
 * is, how much of it is left, how well it rolled, and what it brings
 * to a fight.
 *
 * It is the catch sheet's answer without the sheet — small enough to
 * float over a square of the box, so a player hunting through thirty
 * of them does not have to open each one.
 */

/**
 * How big the held-item pictures are drawn. Small enough that a full
 * column of them still fits the card's third
 */
const ITEM_SPRITE = 24;

export interface CatchCardProps {
  caught: CaughtPokemon;
  /**
   * Whether this pokemon is the reader's. Somebody else's is read and
   * nothing more — there is no giving it anything and no taking what
   * it holds
   */
  owned?: boolean;
  /** Pressing an empty slot: the bag, to give it something */
  onGive?: () => void;
  /** Taking one of its items back into the bag */
  onTake?: (item: Items) => void;
  class?: string;
}

export default function CatchCard(props: CatchCardProps): JSX.Element {
  const caught = (): CaughtPokemon => props.caught;

  const egg = (): boolean => isEgg(caught());

  const health = (): number => {
    const max = getMaxHealth(caught());

    return max <= 0 ? 0 : Math.max(0, Math.min(1, caught().health / max));
  };

  /**
   * How far along the walk is, for an egg. One written before the walk
   * existed has nowhere left to go, and counts as ready
   */
  const hatching = (): number =>
    caught().hatchSteps <= 0 ? 1 : Math.min(1, caught().steps / caught().hatchSteps);

  /**
   * The tray of held-item squares: what it is holding, plus the room
   * it still has. A pokemon's own record says how many it may carry —
   * a Utility Belt widens it — so the tray is the pokemon's rather
   * than the game's
   */
  const slots = (): null[] =>
    Array.from(
      {
        // Room is only worth drawing to somebody who can fill it: on a
        // stranger's pokemon an empty slot is a button nobody may press
        length:
          props.owned === true
            ? Math.max(caught().items.length, getCatchSlots(caught(), Slots.Item))
            : caught().items.length,
      },
      () => null,
    );

  const stars = (): string => {
    const filled = getIVStars(caught().ivs);

    return `${'★'.repeat(filled)}${'☆'.repeat(MAX_IV_STARS - filled)}`;
  };

  return (
    // No frame of its own: it is shown inside a window that already
    // has one, and two borders around one pokemon reads as two cards
    <div class={`flex w-full flex-col gap-1.5 text-left text-xs ${props.class ?? ''}`}>
      {/* What its owner calls it, against the mark that says which
          individual it is: two of the same species with the same sigil
          are the same pokemon */}
      <div class="flex items-baseline justify-between gap-1">
        <strong class="truncate">{egg() ? 'Egg' : getCatchName(caught())}</strong>
        <Show when={!egg()}>
          <Meta class="shrink-0 font-mono tracking-[0.15em]">
            {getSigil(caught().individualValue, caught().traitValue)}
          </Meta>
        </Show>
      </div>

      {/* An egg says nothing about what is inside it — that is the
          finder's to discover — so the rest of the card is what the
          walk has come to */}
      <Show
        when={!egg()}
        fallback={
          <>
            <div class="h-1.5 overflow-hidden rounded-full border border-line-soft bg-line-soft">
              <div class="h-full bg-gold" style={{ width: `${hatching() * 100}%` }} />
            </div>
            <Meta>
              {caught().steps} / {caught().hatchSteps} steps walked
            </Meta>
          </>
        }
      >
        {/* The nature rather than the species: the line above already
            says what it is called, and a nature is the one thing about
            an individual that changes how it fights. How well it rolled
            ends the same line, pinned to the right — coarsely, since
            the six numbers are on the sheet and a card is for deciding
            whether to open one */}
        <div class="flex items-baseline gap-1">
          <span class="shrink-0 text-muted">Lv. {caught().level}</span>
          <span class="truncate">{NATURE_NAMES[caught().nature]}</span>
          <Show when={GENDER_MARKS[caught().gender] !== ''}>
            <span class="shrink-0" role="img" aria-label={GENDER_LABELS[caught().gender]}>
              {GENDER_MARKS[caught().gender]}
            </span>
          </Show>
          <Show when={isShiny(caught())}>
            <span role="img" aria-label="Shiny" class="shrink-0 text-gold">
              ✦
            </span>
          </Show>
          <span
            role="img"
            aria-label={`${getIVStars(caught().ivs)} of ${MAX_IV_STARS} stars`}
            class="ml-auto shrink-0 tracking-[0.2em] text-gold"
          >
            {stars()}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <div class="h-1.5 grow overflow-hidden rounded-full border border-line-soft bg-line-soft">
            <div
              class={`h-full ${isFainted(caught()) ? 'bg-muted' : 'bg-leaf'}`}
              style={{ width: `${health() * 100}%` }}
            />
          </div>
          <span class="shrink-0 tabular-nums text-muted">
            {Math.max(0, Math.round(caught().health))}/{getMaxHealth(caught())}
          </span>
        </div>

        {/* Three columns, because they answer three different
            questions and one stack of pills reads as a single list of
            words */}
        <div class="grid grid-cols-3 gap-1">
          <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
            <For each={caught().moves} fallback={<Meta>No move</Meta>}>
              {(move) => (
                <li class="truncate rounded border border-line-soft bg-line-soft px-1 py-0.5">
                  {getMoveData(move).name}
                </li>
              )}
            </For>
          </ul>

          {/* The name is all that fits; what it does is on the card
              that comes up over it */}
          <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
            <For each={caught().abilities} fallback={<Meta>No ability</Meta>}>
              {(ability) => (
                <li>
                  <TooltipHost class="block" {...detailAbility(ability)}>
                    <span
                      class="block truncate rounded border border-line-soft bg-tide-soft px-1 py-0.5
                        text-tide-dark"
                    >
                      {detailAbility(ability).name}
                    </span>
                  </TooltipHost>
                </li>
              )}
            </For>
          </ul>

          {/* Pictures rather than names, two to a row: a held item is
              one square, and the column beside it is already two of
              words. Only what is held is drawn — a pokemon carries one
              thing, and a tray of empty squares beside it said nothing
              eight times over */}
          <ul class="m-0 grid list-none grid-cols-2 gap-0.5 p-0">
            <Index each={slots()}>
              {(_, at) => (
                <li class="contents">
                  <Show
                    when={at < caught().items.length}
                    fallback={
                      // An empty slot is room the pokemon has, so it is
                      // drawn as room: a press on it is what fills it
                      <button
                        type="button"
                        disabled={props.owned !== true}
                        aria-label="Give it an item"
                        class={`flex aspect-square items-center justify-center rounded border
                          border-dashed border-line-soft bg-paper/40 text-muted ${
                            props.owned === true
                              ? 'cursor-pointer hover:border-tide hover:text-tide-dark'
                              : ''
                          }`}
                        onClick={() => {
                          props.onGive?.();
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
                          when={props.owned === true}
                          fallback={<Button onClick={close}>Close</Button>}
                        >
                          <Button
                            tone="primary"
                            onClick={() => {
                              close();
                              props.onTake?.(caught().items[at]);
                            }}
                          >
                            Take
                          </Button>
                        </Show>
                      )}
                      trigger={
                        <span
                          class="flex aspect-square w-full items-center justify-center rounded
                            border border-line-soft bg-paper/60"
                        >
                          <ItemSprite item={caught().items[at]} size={ITEM_SPRITE} label="" />
                        </span>
                      }
                    >
                      <ItemCard item={caught().items[at]} />
                    </HoverCard>
                  </Show>
                </li>
              )}
            </Index>
          </ul>
        </div>
      </Show>
    </div>
  );
}
