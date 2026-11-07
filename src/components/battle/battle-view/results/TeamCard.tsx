import { For, type JSX, Show } from 'solid-js';
import { getSpeciesData } from '../../../../data/species';
import PlayerPlate from '../../../profile/PlayerPlate';
import type { SideSummary } from '../summary';
import { formatNumber } from '../../../../i18n/format';
import { m } from '../../../../i18n/paraglide/messages.js';
import UnitArt from './UnitArt';

export interface TeamCardProps {
  side: SideSummary;
  name: string;
  sprite: string | null;
  /** Won or Lost from the reader's result, or nothing for a draw or an onlooker */
  mark: 'won' | 'lost' | null;
  /** The side's share of all the damage dealt, from 0 to 1 */
  share: number;
  /** How far after the screen opens it rises in, in milliseconds */
  delay: number;
}

/**
 * One side of a settled fight: whose it was, whether it won, what it
 * dealt and its share, and each pokemon as the fight left it
 */
export default function TeamCard(props: TeamCardProps): JSX.Element {
  return (
    <section
      class={`motion-crossfade flex w-full min-w-0 flex-col gap-1.5 rounded-[20px] border-2 bg-paper
        p-3 text-ink animate-[rise-in_var(--motion-move)_var(--ease-spring)_backwards] sm:w-80 ${
          props.mark === 'won' ? 'border-leaf/50' : 'border-line'
        }`}
      style={{ 'animation-delay': `${props.delay}ms` }}
    >
      <div class="flex items-center justify-between gap-2">
        <span class="min-w-0 grow font-extrabold">
          <PlayerPlate name={props.name} sprite={props.sprite} />
        </span>
        <Show when={props.mark}>
          {(result) => (
            <span
              class={`inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px]
                font-extrabold ${
                  result() === 'won' ? 'bg-leaf-soft text-leaf-dark' : 'bg-line-soft text-muted'
                }`}
            >
              {result() === 'won' ? m.verdict_won() : m.verdict_lost()}
            </span>
          )}
        </Show>
      </div>
      <span class="text-xs text-muted tabular-nums">
        {m.verdict_side_damage({
          damage: formatNumber(Math.round(props.side.dealt)),
          percent: Math.round(props.share * 100),
        })}
      </span>
      <div class="h-1.5 overflow-hidden rounded-full bg-line-soft">
        <div class="h-full rounded-full bg-tide" style={{ width: `${props.share * 100}%` }} />
      </div>
      <ul class="m-0 flex list-none flex-col gap-1 p-0">
        <For each={props.side.units}>
          {(unit) => (
            <li class="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem_2.5rem] items-center gap-1.5 text-xs">
              <UnitArt
                species={unit.species}
                shiny={unit.shiny}
                female={unit.female}
                fainted={unit.health <= 0}
              />
              <span class="flex min-w-0 items-baseline gap-1">
                <span class="shrink-0 text-muted">{m.ow_level({ level: unit.level })}</span>
                <span class="truncate font-extrabold">{getSpeciesData(unit.species).name}</span>
              </span>
              <Show
                when={unit.health > 0}
                fallback={<span class="text-[11px] text-muted">{m.verdict_fainted()}</span>}
              >
                <span
                  class="block h-1.5 overflow-hidden rounded-full bg-line-soft"
                  role="img"
                  aria-label={m.battle_health_left({ percent: Math.round(unit.health * 100) })}
                >
                  <span class="block h-full bg-leaf" style={{ width: `${unit.health * 100}%` }} />
                </span>
              </Show>
              <span class="text-right font-display text-muted tabular-nums">
                {formatNumber(Math.round(unit.dealt))}
              </span>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}
