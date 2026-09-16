import {
  EFFORT_STEP,
  NATURE_BARS,
  NATURE_MARKS,
  NATURE_NUMBERS,
  NATURE_WORDS,
  STAT_LABELS,
  bestTotal,
  natureShift,
  totalOf,
} from '../describe';

import type { CaughtPokemon } from '../../../../auth/caught';

import { unusedEffort } from '../../../../auth/effort';

import { STATUS_NAMES } from '../../../../auth/health';

import type { Stats } from '../../../../data/constants/stats';
import { MAX_EFFORT_PER_STAT, MAX_IV, STAT_ORDER, getIV } from '../../../../data/constants/stats';

import { unpackStatuses } from '../../../../data/ids/status';

import { Button, Meta } from '../../../styled';

import { For, type JSX, Show, createEffect, createSignal, on } from 'solid-js';

/**
 * The six stats, each read three ways side by side: what the pokemon
 * has, what it was born with, and what has been trained into it.
 */
export interface StatsSectionProps {
  caught: CaughtPokemon;
  /** Whether the reader owns it, which is what the effort boxes need */
  owned: boolean;
  /** Whether the record is being held still, by a lock or by a fight */
  frozen: boolean;
  /**
   * Save a whole spread at once. The pane lays the points out and
   * hands them over on one press, so six stats are one round trip
   */
  onTrain: (spread: Partial<Record<Stats, number>>) => void;
}

function statusNames(statuses: number): string {
  const names: string[] = [];

  for (const carried of unpackStatuses(statuses)) {
    names.push(STATUS_NAMES[carried]);
  }
  return names.join(' · ');
}

export default function StatsSection(props: StatsSectionProps): JSX.Element {
  /**
   * Points laid out but not yet saved, by stat. They are the pane's
   * own until Save is pressed: nothing has been asked of the server,
   * so Undo costs nothing
   */
  const [pending, setPending] = createSignal<Partial<Record<Stats, number>>>({});

  // A different pokemon on the sheet is a different set of points
  createEffect(
    on(
      () => props.caught,
      () => {
        setPending({});
      },
    ),
  );

  /** How many points are laid out across all six */
  const spent = (): number => {
    let total = 0;

    for (const stat of STAT_ORDER) {
      total += pending()[stat] ?? 0;
    }
    return total;
  };

  /** What is left of the budget once what is laid out is counted */
  const left = (): number => unusedEffort(props.caught) - spent();

  /** The six values as the pane is showing them, saved or not */
  const laidOut = (): Record<Stats, number> => {
    const values = { ...props.caught.effortValues };

    for (const stat of STAT_ORDER) {
      values[stat] += pending()[stat] ?? 0;
    }
    return values;
  };

  /**
   * The lowest this stat may be typed down to: what is already saved
   * into it. Effort only comes back off a stat by feeding the pokemon
   * a bitter berry, which costs an item and earns the pokemon's
   * regard, so the box will not undo that for free
   */
  const floorOf = (stat: Stats): number => props.caught.effortValues[stat];

  /**
   * The highest it may be typed up to: the stat's own ceiling, or what
   * the budget stretches to once the other five have taken their share
   */
  const ceilingOf = (stat: Stats): number =>
    Math.min(MAX_EFFORT_PER_STAT, floorOf(stat) + left() + (pending()[stat] ?? 0));

  /**
   * Lay this stat out at a typed total, held inside what it may be.
   * The bottom is `0` while the box is being typed in and the saved
   * value once it is left: a box that snapped up to what is already
   * saved on every keystroke could not be typed a smaller number
   * before a larger one
   */
  const aim = (stat: Stats, wanted: number, settled: boolean): void => {
    const bottom = settled ? floorOf(stat) : 0;
    const held = Math.min(ceilingOf(stat), Math.max(bottom, Math.trunc(wanted)));

    setPending((laid) => ({ ...laid, [stat]: held - floorOf(stat) }));
  };

  /** A nature's mark and colour for one stat */
  const shift = (stat: Stats): number => natureShift(props.caught.nature, stat);

  return (
    <section class="flex flex-col gap-1">
      {/* Columns sized to their content with real gaps between them, so
          the headings and the numbers under them never run together */}
      <div
        class="grid grid-cols-[0.75rem_max-content_minmax(3rem,1fr)_2.5rem_2rem_4rem]
          items-center gap-x-3 gap-y-0.5 text-sm"
      >
        <h3 class="col-span-3 text-left">Stats</h3>
        <span class="text-right text-xs font-semibold text-muted uppercase">Total</span>
        <span class="text-right text-xs font-semibold text-muted uppercase">IV</span>
        <span class="text-right text-xs font-semibold text-muted uppercase">EV</span>

        <For each={STAT_ORDER}>
          {(stat) => (
            <>
              {/* The arrow in its own column keeps the names in line,
                  and a colour is not something everybody can read */}
              <span
                class={NATURE_NUMBERS[shift(stat)]}
                title={
                  NATURE_MARKS[shift(stat)] === ''
                    ? undefined
                    : `${STAT_LABELS[stat]} is ${NATURE_WORDS[shift(stat)]}`
                }
                aria-label={
                  NATURE_MARKS[shift(stat)] === '' ? undefined : NATURE_WORDS[shift(stat)]
                }
              >
                {NATURE_MARKS[shift(stat)]}
              </span>
              <span class="text-left whitespace-nowrap">{STAT_LABELS[stat]}</span>
              {/* Measured against its own best stat, so the bar says which
                  end of the pokemon is the sharp one */}
              <div class="h-2 overflow-hidden rounded-full bg-line-soft">
                <div
                  class={`h-full rounded-full ${NATURE_BARS[shift(stat)]}`}
                  style={{
                    width: `${(totalOf(props.caught, stat) / bestTotal(props.caught)) * 100}%`,
                  }}
                />
              </div>
              <span class={`text-right tabular-nums ${NATURE_NUMBERS[shift(stat)]}`}>
                {totalOf(props.caught, stat)}
              </span>
              <span
                class={`text-right tabular-nums ${
                  getIV(props.caught.ivs, stat) === MAX_IV
                    ? 'font-semibold text-gold'
                    : 'text-muted'
                }`}
              >
                {getIV(props.caught.ivs, stat)}
              </span>
              {/* Typed rather than stepped: a full stat is sixty-three
                  presses. The arrows still move in fours, which is what
                  one point of the stat costs */}
              <Show
                when={props.owned}
                fallback={<span class="text-right tabular-nums text-muted">{laidOut()[stat]}</span>}
              >
                <input
                  type="number"
                  class="w-full px-1 py-0 text-right tabular-nums"
                  min={floorOf(stat)}
                  max={ceilingOf(stat)}
                  step={EFFORT_STEP}
                  value={laidOut()[stat]}
                  disabled={props.frozen}
                  aria-label={`${STAT_LABELS[stat]} effort, ${floorOf(stat)} saved`}
                  onInput={(event) => {
                    aim(stat, Number(event.currentTarget.value), false);
                  }}
                  onChange={(event) => {
                    aim(stat, Number(event.currentTarget.value), true);
                  }}
                />
              </Show>
            </>
          )}
        </For>
      </div>

      {/* Points are laid out first and saved on one press, so six
          stats are one round trip and free to change until then */}
      <div class="flex items-center justify-end gap-2">
        <Show when={props.caught.statuses !== 0}>
          <Meta class="mr-auto">{statusNames(props.caught.statuses)}</Meta>
        </Show>
        <Show when={props.owned}>
          <Meta class="tabular-nums">Remaining: {left()}</Meta>
          <Show when={spent() > 0}>
            <Button
              onClick={() => {
                setPending({});
              }}
            >
              Undo
            </Button>
            <Button
              tone="primary"
              disabled={props.frozen || spent() === 0}
              onClick={() => {
                // Only what is going in: a box left mid-typing can
                // stand below what is saved, and the server refuses
                // a spread that takes any back out
                const laid: Partial<Record<Stats, number>> = {};

                for (const each of STAT_ORDER) {
                  const step = pending()[each];

                  if (step != null && step > 0) {
                    laid[each] = step;
                  }
                }

                setPending({});
                props.onTrain(laid);
              }}
            >
              Save
            </Button>
          </Show>
        </Show>
      </div>
    </section>
  );
}
