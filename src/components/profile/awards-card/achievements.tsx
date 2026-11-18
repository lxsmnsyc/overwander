import { type Accessor, For, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import type { AchievementSheet } from '../../../auth/achievements';
import {
  type AchievementStanding,
  AchievementTier,
  LINE_DEEDS,
  LINE_NAMES,
  TIER_COLORS,
  TIER_NAMES,
  tierName,
} from '../../../data/achievements';
import { TYPE_COLORS, TYPE_NAMES } from '../../../data/constants/types';
import {
  TRAINER_BASE_NAMES,
  TRAINER_TYPES,
  type TrainerClass,
} from '../../../data/overworld/trainers';
import { Detail, HoverCard, Meta } from '../../styled';
import { formatNumber } from '../../../i18n/format';
import { m } from '../../../i18n/paraglide/messages.js';

/**
 * The achievement trays: the general lines, the type lines and the
 * trainer classes, in the tray dress the box wears. Standings are the
 * server's derivation from the lifetime counters
 */

/** How many squares stand across a tray */
const GRID_COLUMNS = 8;

/**
 * One achievement as a slot: the name in the square, the tier as the
 * ring and the corner number, and the exact standing on the hover
 */
function LineSlot(props: {
  name: string;
  deed: string;
  standing: AchievementStanding | null;
  tint?: string;
}): JSX.Element {
  const tier = (): AchievementTier => props.standing?.tier ?? AchievementTier.None;
  const count = (): number => props.standing?.count ?? 0;
  const ranked = (): boolean => tier() !== AchievementTier.None;

  const progress = (): string => {
    const next = props.standing?.next;

    return next == null
      ? m.award_progress_top({
          count: formatNumber(count()),
          deed: props.deed,
          tier: TIER_NAMES[tier()],
        })
      : m.award_progress_next({
          count: formatNumber(count()),
          deed: props.deed,
          tier: tierName(tier() + 1),
          next: formatNumber(next),
        });
  };

  return (
    <HoverCard
      class="block w-full"
      title={props.name}
      kind={m.award_achievement_kind()}
      trigger={
        <button
          type="button"
          aria-label={m.award_line_label({
            name: props.name,
            tier: TIER_NAMES[tier()],
            progress: progress(),
          })}
          class={`relative flex aspect-square w-full cursor-default items-center justify-center
            rounded-lg border-2 bg-paper p-1 ${ranked() ? '' : 'border-dashed border-line'}`}
          style={ranked() ? { 'border-color': TIER_COLORS[tier()] } : undefined}
        >
          <span
            class={`pointer-events-none text-center text-[9px] leading-tight font-bold break-words
              ${ranked() ? '' : 'text-muted opacity-60'}`}
            style={props.tint != null && ranked() ? { color: props.tint } : undefined}
          >
            {props.name}
          </span>
          <Show when={ranked()}>
            <span
              class="pointer-events-none absolute right-0.5 bottom-0.5 rounded-full border
                border-line bg-paper px-1 text-[10px] leading-tight font-bold text-ink"
            >
              {tier()}
            </span>
          </Show>
        </button>
      }
    >
      <div class="flex flex-col gap-1">
        <span class="font-semibold">{props.name}</span>
        <Detail label={m.award_tier()}>{TIER_NAMES[tier()]}</Detail>
        <Meta>{progress()}</Meta>
      </div>
    </HoverCard>
  );
}

function fillers(count: number): number[] {
  const short = Math.ceil(count / GRID_COLUMNS) * GRID_COLUMNS - count;

  const slots: number[] = [];

  for (let at = 0; at < short; at += 1) {
    slots.push(at);
  }
  return slots;
}

function Filler(): JSX.Element {
  return (
    <span
      aria-hidden="true"
      class="aspect-square w-full rounded-lg border-2 border-line-soft bg-paper/40"
    />
  );
}

/**
 * What a trainer slot is tinted with: the type they field. The Ace
 * fields anything, so theirs is left in the tray's own colour
 */
function tintOf(trainer: TrainerClass): string | undefined {
  // The first of what they field, since a slot is one colour and the
  // Aces field everything
  const [type] = TRAINER_TYPES[trainer];

  return TRAINER_TYPES[trainer].length === 0 ? undefined : TYPE_COLORS[type];
}

/** One tray of achievement slots, filled out to whole rows */
function Tray(props: { count: number; children: JSX.Element }): JSX.Element {
  return (
    <div class="w-full">
      <div
        class="grid w-full grid-cols-4 gap-1.5 rounded-card border-4 border-tide bg-parchment p-1.5
          sm:grid-cols-8"
      >
        {props.children}
        <For each={fillers(props.count)}>{() => <Filler />}</For>
      </div>
    </div>
  );
}

export function LineShelf(props: { sheet: Accessor<AchievementSheet> }): JSX.Element {
  return (
    <Tray count={props.sheet().lines.length}>
      <For each={props.sheet().lines}>
        {([line, standing]) => (
          <LineSlot name={LINE_NAMES[line]} deed={LINE_DEEDS[line]} standing={standing} />
        )}
      </For>
    </Tray>
  );
}

export function TypeShelf(props: { sheet: Accessor<AchievementSheet> }): JSX.Element {
  return (
    <Tray count={props.sheet().types.length}>
      <For each={props.sheet().types}>
        {([type, standing]) => (
          <LineSlot
            name={TYPE_NAMES[type]}
            deed={m.award_type_deed({ type: TYPE_NAMES[type] })}
            standing={standing}
            tint={TYPE_COLORS[type]}
          />
        )}
      </For>
    </Tray>
  );
}

export function TrainerShelf(props: { sheet: Accessor<AchievementSheet> }): JSX.Element {
  return (
    <Tray count={props.sheet().trainers.length}>
      <For each={props.sheet().trainers}>
        {([trainer, standing]) => (
          <LineSlot
            name={TRAINER_BASE_NAMES[trainer]}
            deed={m.award_trainer_deed({ name: TRAINER_BASE_NAMES[trainer] })}
            standing={standing}
            tint={tintOf(trainer)}
          />
        )}
      </For>
    </Tray>
  );
}
