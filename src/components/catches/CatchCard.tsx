import { For, Index, type JSX, Show } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import {
  getCatchName,
  getCatchSlots,
  getMovePoints,
  isFavorite,
  isGuarded,
  isPurified,
  isShadow,
  isShiny,
} from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { getMaxHealth, getStats, isFainted } from '../../auth/health';
import getSigil from '../../data/constants/sigil';
import { LockIcon, MoonIcon, SparklesIcon, StarIcon, SunIcon } from '../icons';
import { MAX_IV_STARS, Stats, getIVStars } from '../../data/constants/stats';
import { Slots } from '../../data/constants/slots';
import type { Items } from '../../data/ids/items';
import { NATURE_NAMES } from '../../data/ids/natures';
import { getSpeciesData } from '../../data/species';
import TypeBadge from '../sprites/TypeBadge';
import { describeMove, detailAbility } from '../details';
import { GENDER_LABELS, GENDER_MARKS } from './catch-summary';
import MoveHoverCard from '../moves/MoveHoverCard';
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

/**
 * How big the type sigils are drawn. They share a line with words, so
 * they are cut to the line rather than to the size they are elsewhere
 */
const TYPE_SIGIL = 16;

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
      {/* The two rolls it was made from, one at each end: how well it
          rolled, and the mark that says which individual it is. Two of
          the same species with the same sigil are the same pokemon.
          An egg has neither yet */}
      <Show when={!egg()}>
        <div class="flex items-center justify-between gap-1">
          <span
            role="img"
            aria-label={`${getIVStars(caught().ivs)} of ${MAX_IV_STARS} stars`}
            class="shrink-0 tracking-[0.2em] text-gold"
          >
            {stars()}
          </span>
          <Meta class="shrink-0 font-mono tracking-[0.15em]">
            {getSigil(caught().individualValue, caught().traitValue)}
          </Meta>
        </div>
      </Show>

      {/* What its owner calls it, behind the marks the square says in
          its corners: a card read at a glance should answer "is it
          shiny, is it shadowed, is it kept, is it put away" without
          being read through. Centred rather than sat on a baseline,
          since a mark is a picture and a picture has no baseline to
          share with the words beside it */}
      <div class="flex min-w-0 items-center gap-1">
        <Show when={!egg() && isShiny(caught())}>
          <SparklesIcon aria-hidden="true" class="size-3.5 shrink-0 text-gold" />
        </Show>
        <Show when={!egg() && isShadow(caught())}>
          <MoonIcon aria-hidden="true" class="size-3.5 shrink-0 text-arcane" />
        </Show>
        <Show when={!egg() && isPurified(caught())}>
          <SunIcon aria-hidden="true" class="size-3.5 shrink-0 text-gold" />
        </Show>
        <Show when={isFavorite(caught())}>
          <StarIcon aria-hidden="true" class="size-3.5 shrink-0 text-gold" />
        </Show>
        <Show when={isGuarded(caught())}>
          <LockIcon aria-hidden="true" class="size-3.5 shrink-0 text-tide" />
        </Show>
        <strong class="min-w-0 truncate">{egg() ? 'Egg' : getCatchName(caught())}</strong>
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
        {/* What it brings to a fight: what it fights as, then how far
            along it is, which one it is, and how it is inclined. The
            species is not named again, since the line above has just
            said it */}
        <div class="flex items-center gap-1">
          <span class="flex shrink-0 items-center gap-0.5">
            <For each={getSpeciesData(caught().species).types}>
              {(type) => <TypeBadge type={type} size={TYPE_SIGIL} />}
            </For>
          </span>
          <span class="shrink-0 text-muted">Lv. {caught().level}</span>
          <Show when={GENDER_MARKS[caught().gender] !== ''}>
            <span class="shrink-0" role="img" aria-label={GENDER_LABELS[caught().gender]}>
              {GENDER_MARKS[caught().gender]}
            </span>
          </Show>
          <span class="truncate">{NATURE_NAMES[caught().nature]}</span>
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
          {/* The name is all that fits in a third of a card; what a
              move or an ability does is on the card over it */}
          <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
            <For each={caught().moves} fallback={<Meta>No move</Meta>}>
              {(move) => (
                <li>
                  <MoveHoverCard
                    class="block"
                    move={move}
                    points={getMovePoints(caught(), move)}
                    speed={getStats(caught())[Stats.Speed]}
                  >
                    <span class="block truncate rounded border border-line-soft bg-line-soft px-1 py-0.5">
                      {describeMove(move)}
                    </span>
                  </MoveHoverCard>
                </li>
              )}
            </For>
          </ul>

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
