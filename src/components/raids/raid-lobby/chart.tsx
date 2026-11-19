import { For, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { TYPE_EFFECTIVENESS, type Types, getTypeFactor } from '../../../data/constants/types';
import TypeBadge from '../../sprites/TypeBadge';

/** The combined multipliers the boss card lists, strongest first */
const FACTORS: [factor: number, said: string][] = [
  [4, '×4'],
  [2, '×2'],
  [0.5, '×½'],
  [0.25, '×¼'],
  [0, '×0'],
];

/** Every attacking type that does not hit these types for plain damage, by multiplier */
export function defenceChart(defending: readonly Types[]): Map<number, Types[]> {
  const chart = new Map<number, Types[]>();

  for (const key of Object.keys(TYPE_EFFECTIVENESS)) {
    const attacking: Types = Number(key);
    const factor = getTypeFactor(attacking, defending);

    if (factor !== 1) {
      const listed = chart.get(factor) ?? [];

      listed.push(attacking);
      chart.set(factor, listed);
    }
  }
  return chart;
}

/** One labelled block of the chart, a line per multiplier */
export function ChartRows(props: {
  label: string;
  chart: Map<number, Types[]>;
  factors: number[];
}): JSX.Element {
  const rows = (): [said: string, types: Types[]][] => {
    const found: [string, Types[]][] = [];

    for (const [factor, said] of FACTORS) {
      const types = props.chart.get(factor);

      if (props.factors.includes(factor) && types != null) {
        found.push([said, types]);
      }
    }
    return found;
  };

  return (
    <Show when={rows().length > 0}>
      <div class="grid grid-cols-[4.5rem_2rem_minmax(0,1fr)] items-start gap-x-1 gap-y-1 text-xs">
        <For each={rows()}>
          {([said, types], at) => (
            <>
              <span class="pt-0.5 text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
                {at() === 0 ? props.label : ''}
              </span>
              <span class="pt-0.5 font-bold tabular-nums">{said}</span>
              <span class="flex flex-wrap gap-1">
                <For each={types}>{(type) => <TypeBadge type={type} />}</For>
              </span>
            </>
          )}
        </For>
      </div>
    </Show>
  );
}
