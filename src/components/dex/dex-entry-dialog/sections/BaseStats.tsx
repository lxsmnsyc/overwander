import { For, type JSX } from 'solid-js';
import { STAT_ORDER } from '../../../../data/constants/stats';
import type { SpeciesData } from '../../../../data/species';
import { STAT_LABELS } from '../../../catches/catch-dialog/describe';
import { CARD, CARD_TITLE, Hint, HintList, riseAfter } from '../../../styled';
import { STAT_BARS, STAT_CEILING } from '../species-facts';
import { m } from '../../../../i18n/paraglide/messages.js';

/** The sum of a species' base stats */
function sumStats(data: SpeciesData): number {
  let total = 0;

  for (const stat of STAT_ORDER) {
    total += data.stats[stat];
  }
  return total;
}

/** A stat's row: its name, its number, and a bar against the ceiling */
const ROW = 'grid grid-cols-[5.5rem_2.25rem_minmax(0,1fr)] items-center gap-2 text-[13px]';

/** The six base stats as bars, and their total */
export default function BaseStats(props: { data: SpeciesData }): JSX.Element {
  return (
    <section class={CARD} style={riseAfter(2)}>
      <span class="flex items-center gap-1.5">
        <h3 class={CARD_TITLE}>{m.dex_base_stats()}</h3>
        <Hint title={m.dex_base_stats_help()}>
          <HintList>
            <li>{m.dex_base_stats_help_start()}</li>
            <li>{m.dex_base_stats_help_own()}</li>
            <li>{m.dex_base_stats_help_bars({ max: STAT_CEILING })}</li>
          </HintList>
        </Hint>
      </span>
      <div class="flex flex-col gap-1">
        <For each={STAT_ORDER}>
          {(stat) => (
            <div class={ROW}>
              <span class="truncate font-bold">{STAT_LABELS[stat]}</span>
              <span class="text-right font-display font-semibold tabular-nums">
                {props.data.stats[stat]}
              </span>
              <span class="h-2 overflow-hidden rounded-full bg-line-soft">
                <span
                  class={`block h-full rounded-full ${STAT_BARS[stat]}`}
                  style={{
                    width: `${Math.min(100, (props.data.stats[stat] / STAT_CEILING) * 100)}%`,
                  }}
                />
              </span>
            </div>
          )}
        </For>
        <div class={`${ROW} mt-0.5 border-t-2 border-line-soft pt-1.5`}>
          <span aria-hidden="true" class="font-bold">
            {m.dex_total_label()}
          </span>
          <span aria-hidden="true" class="text-right font-display font-semibold tabular-nums">
            {sumStats(props.data)}
          </span>
          <span class="sr-only">{m.dex_total({ total: sumStats(props.data) })}</span>
        </div>
      </div>
    </section>
  );
}
