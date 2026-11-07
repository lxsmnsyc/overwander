import { For, Index, type JSX, Show } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import {
  getCatchName,
  getHeldItemRoom,
  getMovePoints,
  isFavorite,
  isGuarded,
  isPurified,
  isShadow,
  isShiny,
} from '../../model/caught-record';
import { isEgg } from '../../model/egg';
import { getMaxHealth, getStats, isFainted } from '../../model/health';
import getSigil from '../../data/constants/sigil';
import { LockIcon, MoonIcon, SparklesIcon, StarIcon, SunIcon } from '../icons';
import { MAX_IV_STARS, Stats, getIVStars } from '../../data/constants/stats';
import { TYPE_COLORS, TYPE_NAMES } from '../../data/constants/types';
import type { Items } from '../../data/ids/items';
import { NATURE_NAMES } from '../../data/ids/text';
import { getSpeciesData } from '../../data/species';
import StatusSquares from './StatusSquares';
import TypeBadge from '../sprites/TypeBadge';
import { ABILITY_PILLS, abilityKind, describeMove, detailAbility, detailItem } from '../details';
import { GENDER_LABELS, GENDER_MARKS } from './catch-summary';
import MoveTooltip from '../moves/MoveTooltip';
import ItemCard from '../items/ItemCard';
import ItemSprite from '../items/ItemSprite';
import { Button, HoverCard, Meta, TooltipHost, tint } from '../styled';
import { m } from '../../i18n/paraglide/messages.js';

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
const ITEM_SPRITE = 22;

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
  const slots = (): null[] => {
    // Room is only worth drawing to somebody who can fill it: on a
    // stranger's pokemon an empty slot is a button nobody may press
    const length =
      props.owned === true
        ? Math.max(caught().items.length, getHeldItemRoom(caught()))
        : caught().items.length;
    const made: null[] = [];

    for (let slot = 0; slot < length; slot++) {
      made.push(null);
    }
    return made;
  };

  const stars = (): string => {
    const filled = getIVStars(caught().ivs);

    return `${'★'.repeat(filled)}${'☆'.repeat(MAX_IV_STARS - filled)}`;
  };

  return (
    // No frame of its own: it is shown inside a window that already
    // has one, and two borders around one pokemon reads as two cards
    <div class={`flex w-full flex-col gap-2 text-left text-xs ${props.class ?? ''}`}>
      {/* The two rolls it was made from, one at each end: how well it
          rolled, and the mark that says which individual it is. Two of
          the same species with the same sigil are the same pokemon. An
          egg has neither yet */}
      <Show when={!egg()}>
        <div class="flex items-center justify-between gap-1">
          <span
            role="img"
            aria-label={m.catch_stars({ stars: getIVStars(caught().ivs), max: MAX_IV_STARS })}
            class="shrink-0 text-sm tracking-[0.1em] text-gold"
          >
            {stars()}
          </span>
          <Meta class="shrink-0 font-mono tracking-[0.15em] text-arcane-dark">
            {getSigil(caught().individualValue, caught().traitValue)}
          </Meta>
        </div>
      </Show>

      {/* Its name behind the marks the square says in its corners, then
          how far along it is, which one it is and how it is inclined. A
          mark is a picture, so the row is centred rather than set on a
          baseline */}
      <div class="flex min-w-0 items-center gap-1.5">
        <Show when={!egg() && isShiny(caught())}>
          <SparklesIcon aria-hidden="true" class="size-4 shrink-0 text-arcane" />
        </Show>
        <Show when={!egg() && isShadow(caught())}>
          <MoonIcon aria-hidden="true" class="size-4 shrink-0 text-arcane" />
        </Show>
        <Show when={!egg() && isPurified(caught())}>
          <SunIcon aria-hidden="true" class="size-4 shrink-0 text-gold" />
        </Show>
        <Show when={isFavorite(caught())}>
          <StarIcon aria-hidden="true" class="size-4 shrink-0 text-gold" />
        </Show>
        <Show when={isGuarded(caught())}>
          <LockIcon aria-hidden="true" class="size-4 shrink-0 text-muted" />
        </Show>
        <strong class="min-w-0 truncate font-display text-lg leading-tight font-semibold">
          {egg() ? m.ui_egg() : getCatchName(caught())}
        </strong>
        <Show when={!egg()}>
          <span class="flex min-w-0 shrink items-center gap-1 text-xs text-muted">
            <span class="shrink-0">{m.catch_level({ level: caught().level })}</span>
            <Show when={GENDER_MARKS[caught().gender] !== ''}>
              <span aria-hidden="true">·</span>
              <span class="shrink-0" role="img" aria-label={GENDER_LABELS[caught().gender]()}>
                {GENDER_MARKS[caught().gender]}
              </span>
            </Show>
            <span aria-hidden="true">·</span>
            <span class="truncate">{NATURE_NAMES[caught().nature]}</span>
          </span>
        </Show>
      </div>

      {/* An egg says nothing about what is inside it (that is the
          finder's to discover), so the rest of the card is what the walk
          has come to */}
      <Show
        when={!egg()}
        fallback={
          <>
            <div class="h-2 overflow-hidden rounded-full bg-line-soft">
              <div class="h-full bg-gold" style={{ width: `${hatching() * 100}%` }} />
            </div>
            <Meta>
              {m.catch_steps_walked({ steps: caught().steps, hatch: caught().hatchSteps })}
            </Meta>
          </>
        }
      >
        {/* What it fights as, each type a pill washed in its colour */}
        <div class="flex flex-wrap items-center gap-1">
          <For each={getSpeciesData(caught().species).types}>
            {(type) => (
              <span
                class="inline-flex h-[22px] items-center gap-1 rounded-full pr-2 pl-1 text-[11px]
                  font-extrabold text-ink"
                style={{ background: tint(TYPE_COLORS[type], 22) }}
              >
                <TypeBadge type={type} size={TYPE_SIGIL} />
                {TYPE_NAMES[type]}
              </span>
            )}
          </For>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
            <div
              class={`h-full rounded-full ${isFainted(caught()) ? 'bg-muted' : 'bg-leaf'}`}
              style={{ width: `${health() * 100}%` }}
            />
          </div>
          <span class="shrink-0 font-display text-xs font-semibold tabular-nums">
            {Math.max(0, Math.round(caught().health))}/{getMaxHealth(caught())}
          </span>
          {/* What it is still carrying from its last fight */}
          <StatusSquares statuses={caught().statuses} />
        </div>

        {/* Three columns, because they answer three different questions
            and one stack of pills reads as a single list of words */}
        <div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-1.5 text-[11px] font-bold">
          {/* The name is all that fits; what a move or an ability does is
              on the card over it */}
          <ul class="m-0 flex list-none flex-col gap-0.5 p-0">
            <For each={caught().moves} fallback={<Meta>{m.catch_no_move()}</Meta>}>
              {(move) => (
                <li>
                  <MoveTooltip
                    class="block"
                    move={move}
                    points={getMovePoints(caught(), move)}
                    speed={getStats(caught())[Stats.Speed]}
                  >
                    <span class="block truncate py-px hover:text-tide-dark">
                      {describeMove(move)}
                    </span>
                  </MoveTooltip>
                </li>
              )}
            </For>
          </ul>

          <ul class="m-0 flex list-none flex-col gap-1 p-0">
            <For each={caught().abilities} fallback={<Meta>{m.catch_no_ability()}</Meta>}>
              {(ability) => (
                <li>
                  <TooltipHost class="block" kind="ability" {...detailAbility(ability)}>
                    <span
                      class={`block truncate rounded-full border px-2 py-0.5 ${
                        ABILITY_PILLS[abilityKind(caught().species, ability)]
                      }`}
                    >
                      {detailAbility(ability).name}
                    </span>
                  </TooltipHost>
                </li>
              )}
            </For>
          </ul>

          {/* Pictures rather than names, two to a row: a held item is one
              square, and the columns beside it are already two of words */}
          <ul class="m-0 grid list-none grid-cols-[28px_28px] content-start gap-1 p-0">
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
                        aria-label={m.catch_give_item()}
                        class={`flex size-7 items-center justify-center rounded-chip border-2
                          border-dashed border-line bg-transparent text-muted shadow-none
                          active:translate-y-0 ${
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
                      title={detailItem(caught().items[at]).name}
                      kind={m.tooltip_kind_item()}
                      footer={(close) => (
                        <Show
                          when={props.owned === true}
                          fallback={<Button onClick={close}>{m.ui_close()}</Button>}
                        >
                          <Button
                            tone="primary"
                            onClick={() => {
                              close();
                              props.onTake?.(caught().items[at]);
                            }}
                          >
                            {m.catch_take()}
                          </Button>
                        </Show>
                      )}
                      trigger={
                        <span
                          class="flex size-7 items-center justify-center rounded-chip border-2
                            border-gold/60 bg-gold-soft"
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
