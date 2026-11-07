import { For, type JSX } from 'solid-js';
import { STAT_ORDER } from '../../../../data/constants/stats';
import type { SpeciesData } from '../../../../data/species';
import { STAT_LABELS } from '../../../catches/catch-dialog/describe';
import { DialogSection, Hint, HintList, Meta } from '../../../styled';
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

/** The six base stats as bars, and their total */
export default function BaseStats(props: { data: SpeciesData }): JSX.Element {
  return (
    <DialogSection
      title={m.dex_base_stats()}
      hint={
        <Hint title={m.dex_base_stats_help()}>
          <HintList>
            <li>{m.dex_base_stats_help_start()}</li>
            <li>{m.dex_base_stats_help_own()}</li>
            <li>{m.dex_base_stats_help_bars({ max: STAT_CEILING })}</li>
          </HintList>
        </Hint>
      }
    >
      <div class="flex flex-col gap-1">
        <For each={STAT_ORDER}>
          {(stat) => (
            <div class="flex items-center gap-2">
              <Meta class="w-24 shrink-0 text-left">{STAT_LABELS[stat]}</Meta>
              <span class="w-8 shrink-0 text-right text-sm font-semibold">
                {props.data.stats[stat]}
              </span>
              <div class="h-1.5 grow overflow-hidden rounded-full bg-line-soft">
                <div
                  class={`h-full rounded-full ${STAT_BARS[stat]}`}
                  style={{
                    width: `${Math.min(100, (props.data.stats[stat] / STAT_CEILING) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </For>
        <Meta class="text-right">{m.dex_total({ total: sumStats(props.data) })}</Meta>
      </div>
    </DialogSection>
  );
}
