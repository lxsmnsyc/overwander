import {
  EFFORT_STEP,
  NATURE_MARKS,
  NATURE_NUMBERS,
  NATURE_WORDS,
  STAT_LABELS,
  natureShift,
  totalOf,
} from '../describe';
import { CARD_TITLE } from '../metrics';
import StatHexagon, { type HexagonStat } from './StatHexagon';

import type { CaughtPokemon } from '../../../../auth/caught';

import { unusedEffort } from '../../../../model/effort';

import {
  EFFORT_PER_LEVEL,
  MAX_EFFORT_PER_STAT,
  MAX_IV,
  STAT_ORDER,
  Stats,
  getIV,
} from '../../../../data/constants/stats';

import { VITAMIN_EFFORT } from '../../../../data/items/vitamins';
import { WING_EFFORT } from '../../../../data/items/wings';

import { NATURE_NAMES } from '../../../../data/ids/text';
import { Badge, Button, Hint, HintList, Meta, TooltipHost } from '../../../styled';

import { For, type JSX, Show, createEffect, createSignal, on } from 'solid-js';
import { formatList } from '../../../../i18n/format';
import { m } from '../../../../i18n/paraglide/messages.js';

/** The six clockwise from the top, the way a summary screen draws them */
const HEXAGON_ORDER: readonly Stats[] = [
  Stats.HP,
  Stats.Attack,
  Stats.Defense,
  Stats.Speed,
  Stats.SpecialDefense,
  Stats.SpecialAttack,
];

/** The stats' short names, for the nature badge where the full ones do not fit */
const STAT_SHORT: Record<Stats, () => string> = {
  [Stats.HP]: m.catch_stat_short_hp,
  [Stats.Attack]: m.catch_stat_short_attack,
  [Stats.Defense]: m.catch_stat_short_defense,
  [Stats.SpecialAttack]: m.catch_stat_short_special_attack,
  [Stats.SpecialDefense]: m.catch_stat_short_special_defense,
  [Stats.Speed]: m.catch_stat_short_speed,
};

/** A corner's label by what the nature does to it: lowered, untouched, raised */
const HEXAGON_TONES = ['fill-tide', '', 'fill-ember-dark'] as const;

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

  /** Which stat the nature raises and which it lowers, where it moves any */
  const natureShifts = (): { raised: Stats; lowered: Stats } | null => {
    let raised: Stats | null = null;
    let lowered: Stats | null = null;

    for (const stat of STAT_ORDER) {
      if (shift(stat) === 2) {
        raised = stat;
      } else if (shift(stat) === 0) {
        lowered = stat;
      }
    }
    return raised == null || lowered == null ? null : { raised, lowered };
  };

  /**
   * The nature's name, with the stats it moves, named short on the badge
   * and in full on its tooltip
   */
  const natureLabel = (short: boolean): string => {
    const nature = NATURE_NAMES[props.caught.nature];
    const moved = natureShifts();

    if (moved == null) {
      return nature;
    }
    return m.catch_nature_shift({
      nature,
      raised: short ? STAT_SHORT[moved.raised]() : STAT_LABELS[moved.raised],
      lowered: short ? STAT_SHORT[moved.lowered]() : STAT_LABELS[moved.lowered],
    });
  };

  /** The six totals, clockwise from the top the way a summary screen draws them */
  const shape = (): HexagonStat[] => {
    const corners: HexagonStat[] = [];

    for (const stat of HEXAGON_ORDER) {
      corners.push({
        name: STAT_LABELS[stat],
        value: totalOf(props.caught, stat),
        tone: HEXAGON_TONES[shift(stat)],
      });
    }
    return corners;
  };

  /** What the hexagon says, read aloud */
  const shapeLabel = (): string => {
    const parts: string[] = [];

    for (const stat of STAT_ORDER) {
      parts.push(
        m.catch_stat_value({ stat: STAT_LABELS[stat], value: totalOf(props.caught, stat) }),
      );
    }
    return formatList(parts, 'and');
  };

  return (
    <section class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="flex shrink-0 items-center gap-1.5">
          <h3 class={CARD_TITLE}>{m.catch_stats()}</h3>
          <Hint title={m.catch_stats_help()}>
            <HintList>
              <li>{m.catch_stats_help_iv({ max: MAX_IV })}</li>
              <li>
                {m.catch_stats_help_ev({ level: EFFORT_PER_LEVEL, max: MAX_EFFORT_PER_STAT })}
              </li>
              <li>{m.catch_stats_help_items({ wing: WING_EFFORT, vitamin: VITAMIN_EFFORT })}</li>
              <li>{m.catch_stats_help_berries()}</li>
              <li>{m.catch_stats_help_nature()}</li>
              <li>{m.catch_stats_help_shape()}</li>
            </HintList>
          </Hint>
        </span>
        {/* Beside the arrows it explains */}
        <TooltipHost
          class="flex min-w-0"
          name={NATURE_NAMES[props.caught.nature]}
          description={natureLabel(false)}
        >
          <Badge class="min-w-0">
            <span class="min-w-0 truncate">{natureLabel(true)}</span>
          </Badge>
        </TooltipHost>
      </div>

      {/* The totals as a shape, measured against its own best stat, so
          which end of the pokemon is the sharp one reads at a glance */}
      <StatHexagon stats={shape()} label={shapeLabel()} class="mx-auto h-39" />

      {/* Columns sized to their content with real gaps between them, so
          the headings and the numbers under them never run together */}
      <div
        class="grid grid-cols-[0.75rem_minmax(0,1fr)_2.5rem_2rem_3.25rem] items-center gap-x-2 gap-y-0.5
          text-sm"
      >
        <span />
        <span />
        {/* Spills left rather than wrapping: ごうけい is wider than the column */}
        <span class="text-right text-[10px] font-extrabold whitespace-nowrap text-muted uppercase">
          {m.catch_stats_total()}
        </span>
        <span class="text-right text-[10px] font-extrabold text-muted uppercase">IV</span>
        <span class="text-right text-[10px] font-extrabold text-muted uppercase">EV</span>

        <For each={STAT_ORDER}>
          {(stat) => (
            <>
              {/* The arrow in its own column keeps the names in line,
                  and a colour is not something everybody can read */}
              <span
                class={`text-xs font-extrabold ${NATURE_NUMBERS[shift(stat)]}`}
                title={
                  NATURE_MARKS[shift(stat)] === ''
                    ? undefined
                    : m.catch_stats_nature({
                        stat: STAT_LABELS[stat],
                        shift: NATURE_WORDS[shift(stat)](),
                      })
                }
                aria-label={
                  NATURE_MARKS[shift(stat)] === '' ? undefined : NATURE_WORDS[shift(stat)]()
                }
              >
                {NATURE_MARKS[shift(stat)]}
              </span>
              <span class="truncate text-left">{STAT_LABELS[stat]}</span>
              <span
                class={`text-right font-display font-semibold tabular-nums ${NATURE_NUMBERS[shift(stat)]}`}
              >
                {totalOf(props.caught, stat)}
              </span>
              <span
                class={`text-right font-display tabular-nums ${
                  getIV(props.caught.ivs, stat) === MAX_IV
                    ? 'font-semibold text-gold-dark'
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
                fallback={
                  <span class="text-right font-display tabular-nums text-muted">
                    {laidOut()[stat]}
                  </span>
                }
              >
                <input
                  type="number"
                  class="h-6 w-full rounded-chip px-1 py-0 text-right font-display tabular-nums"
                  min={floorOf(stat)}
                  max={ceilingOf(stat)}
                  step={EFFORT_STEP}
                  value={laidOut()[stat]}
                  disabled={props.frozen}
                  aria-label={m.catch_stats_effort({
                    stat: STAT_LABELS[stat],
                    saved: floorOf(stat),
                  })}
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
      {/* As tall as its buttons whether or not they are showing, so
          laying a point out never pushes the column past the sheet */}
      <div class="flex min-h-9 items-center justify-end gap-2 empty:hidden">
        <Show when={props.owned}>
          <Meta class="tabular-nums">{m.catch_stats_remaining({ count: left() })}</Meta>
          <Show when={spent() > 0}>
            <Button
              onClick={() => {
                setPending({});
              }}
            >
              {m.catch_undo()}
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
              {m.catch_heading_save()}
            </Button>
          </Show>
        </Show>
      </div>
    </section>
  );
}
