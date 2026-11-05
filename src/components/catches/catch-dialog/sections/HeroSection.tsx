import { healthLeft } from '../describe';
import { tint } from '../metrics';
import PortraitSection from './PortraitSection';

import type { CaughtPokemon } from '../../../../auth/caught';
import { isFavorite, isGuarded } from '../../../../auth/caught';
import { isShadow, isShiny } from '../../../../model/caught-record';
import { isEgg } from '../../../../model/egg';
import { getMaxHealth, isFainted } from '../../../../model/health';
import { deriveCatchSize } from '../../../../overworld/encounter';

import { MAX_FRIENDSHIP } from '../../../../data/constants/friendship';
import getSigil from '../../../../data/constants/sigil';
import { MAX_IV_STARS, getIVStars } from '../../../../data/constants/stats';
import { TYPE_COLORS } from '../../../../data/constants/types';
import { getSpeciesData } from '../../../../data/species';

import { HeartIcon, LockIcon, SparklesIcon, StarIcon } from '../../../icons';
import TypeBadge from '../../../sprites/TypeBadge';
import { Badge, Meta, TooltipHost } from '../../../styled';
import StatusSquares from '../../StatusSquares';
import { GENDER_LABELS, GENDER_MARKS, sayFriendship } from '../../catch-summary';

import { For, type JSX, Show, children } from 'solid-js';
import { m } from '../../../../i18n/paraglide/messages.js';

/**
 * The top of the sheet: the pokemon on its field, who it is, what it
 * is like and how it is doing, with what can be done to it on the
 * right.
 */
export interface HeroSectionProps {
  caught: CaughtPokemon;
  /** What it is called, which is its nickname or its species */
  named: string;
  /** Its level as the sheet shows it, candy presses included */
  level: number;
  /** Whether it is the one walking with the reader */
  buddy: boolean;
  /** Whether it is the reader's and is in a fight right now */
  raiding: boolean;
  /** The box chip, the menu and the way out, top right */
  controls: JSX.Element;
  /** What can be raised from here (tera type, candy), under the controls */
  tiles?: JSX.Element;
}

export default function HeroSection(props: HeroSectionProps): JSX.Element {
  // Each slot resolved once, so its markup is built once
  const controls = children(() => props.controls);
  const tiles = children(() => props.tiles);

  const egg = (): boolean => isEgg(props.caught);
  const species = (): ReturnType<typeof getSpeciesData> => getSpeciesData(props.caught.species);

  const stars = (): string => {
    const filled = getIVStars(props.caught.ivs);

    return `${'★'.repeat(filled)}${'☆'.repeat(MAX_IV_STARS - filled)}`;
  };

  const size = (): { height: number; weight: number } =>
    deriveCatchSize(props.caught.species, props.caught.traitValue, props.caught.type);

  /** The header's wash, in its first type's colour; an egg's is the page's own */
  const wash = (): string =>
    egg() ? 'var(--color-paper)' : tint(TYPE_COLORS[species().types[0]], 12);

  return (
    <div
      class="-mx-4 -mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 border-b-2 border-line-soft px-4
        pt-3 pb-4 sm:-mx-5 sm:-mt-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-4.5 md:px-4.5 md:pt-4"
      style={{ background: `linear-gradient(180deg, ${wash()}, var(--color-paper))` }}
    >
      <PortraitSection caught={props.caught} named={props.named} />

      {/* On a phone only the name stands beside the portrait, and the
          rows under it run the sheet's whole width */}
      <div class="contents md:flex md:min-w-0 md:flex-col md:gap-2">
        {/* Who it is: the name large, the species where a nickname took
            its place, its gender and whether it sparkles, and its level */}
        <div class="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1 self-center md:self-auto">
          <span
            class="min-w-0 font-display text-2xl leading-7 font-semibold break-words md:truncate md:text-[30px] md:leading-[34px]"
            data-name
          >
            {props.named}
          </span>
          <Show when={!egg() && props.caught.nickname !== ''}>
            <span class="text-sm font-bold text-muted md:text-[15px]">{species().name}</span>
          </Show>
          <Show when={!egg() && GENDER_MARKS[props.caught.gender] !== ''}>
            <span
              class="text-sm font-bold text-muted md:text-[15px]"
              title={GENDER_LABELS[props.caught.gender]()}
              aria-label={GENDER_LABELS[props.caught.gender]()}
            >
              {GENDER_MARKS[props.caught.gender]}
            </span>
          </Show>
          <Show when={!egg() && isShiny(props.caught)}>
            <SparklesIcon
              class="size-4.5 shrink-0 self-center text-gold-dark"
              aria-label={m.catch_shiny()}
            />
          </Show>
          <Show when={!egg()}>
            <span
              class="self-center rounded-[10px] bg-ink px-2.5 font-display text-base font-semibold text-paper
                tabular-nums md:text-lg"
            >
              {m.catch_level({ level: props.level })}
            </span>
          </Show>
        </div>

        <Show when={!egg()}>
          {/* Its facts as chips: what it is, its size, and what walking
              with it has earned */}
          <div class="col-span-2 flex flex-wrap items-center gap-1.5">
            <For each={species().types}>{(type) => <TypeBadge type={type} />}</For>
            <Badge>{species().category}</Badge>
            <Badge>{size().height.toFixed(2)} m</Badge>
            <Badge>{size().weight.toFixed(1)} kg</Badge>
            <TooltipHost
              name={m.catch_friendship()}
              description={m.catch_friendship_of({
                count: props.caught.friendship,
                max: MAX_FRIENDSHIP,
              })}
            >
              <Badge tone="leaf">
                <HeartIcon class="size-3.5" aria-hidden="true" />
                {sayFriendship(props.caught.friendship)}
              </Badge>
            </TooltipHost>
            <Badge>{m.catch_steps({ count: props.caught.walked })}</Badge>
          </div>

          {/* Both rolls it was made from (two of a species with the same
              sigil are the same individual), then what it has left */}
          <div class="col-span-2 flex max-w-[420px] flex-wrap items-center gap-x-2.5 gap-y-1">
            <span
              role="img"
              aria-label={m.catch_stars({ stars: getIVStars(props.caught.ivs), max: MAX_IV_STARS })}
              class="text-[13px] tracking-[0.2em] text-gold"
            >
              {stars()}
            </span>
            <Meta class="font-mono text-[11px] tracking-[0.2em]">
              {getSigil(props.caught.individualValue, props.caught.traitValue)}
            </Meta>
            <div class="flex min-w-24 grow items-center gap-2">
              <div class="h-2 grow overflow-hidden rounded-full bg-line-soft">
                <div
                  class={`h-full rounded-full ${isFainted(props.caught) ? 'bg-muted' : 'bg-leaf'}`}
                  style={{ width: `${healthLeft(props.caught) * 100}%` }}
                />
              </div>
              <span class="shrink-0 font-display text-[13px] tabular-nums">
                {Math.max(0, Math.round(props.caught.health))}/{getMaxHealth(props.caught)}
                {isFainted(props.caught) ? ` · ${m.pick_team_fainted()}` : ''}
              </span>
              {/* What it is still carrying from its last fight */}
              <StatusSquares statuses={props.caught.statuses} />
            </div>
          </div>
        </Show>

        {/* What it is marked as, each only where it applies */}
        <div class="col-span-2 flex flex-wrap items-center gap-1.5 empty:hidden">
          <Show when={isFavorite(props.caught)}>
            <Badge tone="gold">
              <StarIcon class="size-3.5" aria-hidden="true" />
              {m.catch_favorite()}
            </Badge>
          </Show>
          <Show when={props.buddy}>
            <Badge tone="leaf">{m.catch_badge_buddy()}</Badge>
          </Show>
          <Show when={isGuarded(props.caught)}>
            <Badge tone="tide">
              <LockIcon class="size-3.5" aria-hidden="true" />
              {m.catch_badge_locked()}
            </Badge>
          </Show>
          <Show when={isShadow(props.caught)}>
            <Badge>{m.catch_badge_shadow()}</Badge>
          </Show>
          <Show when={props.caught.gigantamax}>
            <Badge tone="arcane">{m.catch_badge_gigantamax()}</Badge>
          </Show>
          <Show when={props.raiding}>
            <Badge tone="ember">{m.catch_badge_in_raid()}</Badge>
          </Show>
        </div>
      </div>

      {/* The controls in the top row on a phone, and the tiles across
          the foot of the hero; on a wide screen both stand on the right */}
      <div class="contents md:flex md:flex-col md:items-end md:gap-2.5">
        <div class="order-first col-span-2 flex flex-wrap items-center justify-end gap-1.5 md:order-none">
          {controls()}
        </div>
        <Show when={tiles()}>
          <div class="col-span-2 flex flex-wrap items-stretch gap-2.5 md:justify-end">
            {tiles()}
          </div>
        </Show>
      </div>
    </div>
  );
}
