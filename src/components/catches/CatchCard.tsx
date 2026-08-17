import { For, type JSX, Show } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { getCatchName, isShiny } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { getMaxHealth, isFainted } from '../../auth/health';
import getSigil from '../../data/constants/sigil';
import { MAX_IV_STARS, getIVStars } from '../../data/constants/stats';
import { NATURE_NAMES } from '../../data/ids/natures';
import { getMoveData } from '../../data/moves';
import { detailAbility, detailItem } from '../details';
import { GENDER_LABELS, GENDER_MARKS } from './catch-summary';
import ItemSprite from '../items/ItemSprite';
import { Meta, TooltipHost } from '../styled';

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
            an individual that changes how it fights */}
        <div class="flex items-baseline gap-1 truncate">
          <span class="text-muted">Lv. {caught().level}</span>
          <span class="truncate">{NATURE_NAMES[caught().nature]}</span>
          <Show when={GENDER_MARKS[caught().gender] !== ''}>
            <span role="img" aria-label={GENDER_LABELS[caught().gender]}>
              {GENDER_MARKS[caught().gender]}
            </span>
          </Show>
          <Show when={isShiny(caught())}>
            <span role="img" aria-label="Shiny" class="text-gold">
              ✦
            </span>
          </Show>
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

        {/* How well it rolled, coarsely. The six numbers are on the
            sheet; a card is for deciding whether to open one */}
        <span
          role="img"
          aria-label={`${getIVStars(caught().ivs)} of ${MAX_IV_STARS} stars`}
          class="tracking-[0.2em] text-gold"
        >
          {stars()}
        </span>

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

          {/* Pictures rather than names: a held item is one square,
              and the column beside it is already two of words */}
          <ul class="m-0 flex list-none flex-wrap content-start gap-0.5 p-0">
            <For each={caught().items} fallback={<Meta>No item</Meta>}>
              {(item) => (
                <li class="flex">
                  <TooltipHost {...detailItem(item)}>
                    <ItemSprite item={item} size={ITEM_SPRITE} />
                  </TooltipHost>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </div>
  );
}
