import { For, Show, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { getSpeciesData } from '../../../data/species';
import type { Types } from '../../../data/constants/types';
import { RAID_BOSS_LEVEL } from '../../../overworld/raid';
import AnimatedSprite from '../../sprites/AnimatedSprite';
import TypeBadge from '../../sprites/TypeBadge';
import { Note, Pill } from '../../styled';
import { SpriteAnim } from '../../../data/ids/sprite-anims';
import { m } from '../../../i18n/paraglide/messages.js';
import { ChartRows, defenceChart } from './chart';

/**
 * What is waiting in the lair, asleep, and what to bring against it.
 * The lair's name is the panel's own heading. A row on a phone, a
 * column beside the trainers from `md` up. A Tera raid's boss is hit
 * as its Tera type alone, so the chart is read off that
 */
export default function BossCard(props: {
  species: number;
  female: boolean;
  mythical: boolean;
  hosting: boolean;
  tera: Types | null;
}): JSX.Element {
  const [wide, setWide] = createSignal(false);

  onSettled(() => {
    const query = globalThis.matchMedia('(min-width: 48rem)');
    const read = (): void => {
      setWide(query.matches);
    };

    read();
    query.addEventListener('change', read);
    return () => {
      query.removeEventListener('change', read);
    };
  });

  const data = (): ReturnType<typeof getSpeciesData> => getSpeciesData(props.species);
  const chart = (): Map<number, Types[]> =>
    defenceChart(props.tera == null ? data().types : [props.tera]);

  return (
    <div
      class="flex flex-col gap-3 rounded-panel border-2 border-line-soft p-3 md:min-h-0
        md:overflow-y-auto md:rounded-none md:border-0 md:border-r-2 md:py-3 md:pr-3.5 md:pl-4"
    >
      {/* On a phone the floor and the name share a row, so the trainers are in view */}
      <div class="flex items-center gap-3 md:flex-col md:items-stretch md:gap-3">
        {/* The boss asleep on the field's floor, feet on the grass so a
          tall boss and a short one put their name on the same line */}
        <div
          class="flex h-[110px] w-[46%] shrink-0 md:h-[150px] md:w-full items-end justify-center overflow-hidden
          rounded-card border-2 border-line-soft pb-4
          bg-[linear-gradient(var(--color-tide-soft),var(--color-parchment)_60%,var(--color-leaf-soft)_60%)]"
        >
          <AnimatedSprite
            species={props.species}
            female={props.female}
            animation={SpriteAnim.Sleep}
            direction="DownLeft"
            scale={wide() ? 4 : 2}
            shadow
            label={m.raid_waiting_label({ name: data().name })}
          />
        </div>

        <div class="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
          {/* The level first: a raid boss is fought at the cap whoever
            it is, and that is what a party is sized against */}
          <span class="font-display text-base font-semibold">
            {m.ui_level_name({ level: RAID_BOSS_LEVEL, name: data().name })}
          </span>
          <div class="flex flex-wrap justify-center gap-1">
            <For each={data().types}>{(type) => <TypeBadge type={type} />}</For>
          </div>
          <Show when={props.tera}>
            {(tera) => (
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] font-extrabold tracking-[0.12em] text-muted uppercase">
                  {m.raid_tera_type()}
                </span>
                <TypeBadge type={tera()} />
              </div>
            )}
          </Show>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 border-t-2 border-line-soft pt-2">
        <ChartRows label={m.type_weak_to()} chart={chart()} factors={[4, 2]} />
        <ChartRows label={m.type_resists()} chart={chart()} factors={[0.5, 0.25]} />
        <ChartRows label={m.raid_immune()} chart={chart()} factors={[0]} />
      </div>

      <div class="flex flex-col items-center gap-2 text-center md:mt-auto">
        {/* The relic that opened it is spent, so there is no second attempt */}
        <Show when={props.mythical}>
          <Note>{m.raid_relic_spent()}</Note>
        </Show>
        <Pill tone={props.hosting ? 'leaf' : 'neutral'}>
          {props.hosting ? m.raid_hosting() : m.raid_waiting_host()}
        </Pill>
      </div>
    </div>
  );
}
