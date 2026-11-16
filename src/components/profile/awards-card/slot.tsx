import { type JSX, Show } from 'solid-js';
import type Awards from '../../../data/ids/awards';
import Npc from '../../../data/overworld/npc';
import { AWARD_COLORS, AWARD_NAMES, AWARD_SPRITES } from '../../../data/awards';
import NpcSprite from '../../overworld/NpcSprite';
import ExtraSprite from '../../sprites/ExtraSprite';
import { Detail, HoverCard, Meta } from '../../styled';
import { m } from '../../../i18n/paraglide/messages.js';
import { CHAMPION_TITLES_SET, PERSON_AWARD_SHEETS } from './people';

/**
 * One award as a medal: its own picture in a round-cornered square,
 * the name under it, and how many times its fight has been won in the
 * corner. An unearned one sits greyed, which is the point: it says
 * what is still out there.
 */

/** How tall the art is drawn inside its square */
const ART = 40;

/** The titles read as a star where there is no picture, the rest as their first letter */
function markOf(award: Awards, name: string): string {
  return CHAMPION_TITLES_SET.has(award) ? '★' : name.slice(0, 1);
}

/**
 * An award's own picture where it has one, for anywhere outside the
 * shelf that names an award as won
 */
export function AwardArt(props: { award: Awards; size: number }): JSX.Element {
  return (
    <Show
      when={AWARD_SPRITES[props.award]}
      keyed
      fallback={
        <span
          class="flex items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{
            width: `${props.size}px`,
            height: `${props.size}px`,
            'background-color': AWARD_COLORS[props.award],
          }}
        >
          {markOf(props.award, AWARD_NAMES[props.award])}
        </span>
      }
    >
      {(sprite) => <ExtraSprite sheet={sprite[0]} name={sprite[1]} label="" size={props.size} />}
    </Show>
  );
}

export default function Slot(props: { award: Awards; wins: number | null }): JSX.Element {
  const name = (): string => AWARD_NAMES[props.award];
  const held = (): boolean => props.wins != null;

  return (
    <HoverCard
      class="block w-full"
      title={name()}
      kind={m.award_kind()}
      trigger={
        <button
          type="button"
          aria-label={
            held()
              ? m.award_beaten_label({ name: name(), count: props.wins ?? 0 })
              : m.award_unearned_label({ name: name() })
          }
          class="flex w-full min-w-0 cursor-default flex-col items-center gap-1 border-0
            bg-transparent p-0 shadow-none"
        >
          <span
            class={`relative flex size-14 items-center justify-center rounded-full border-2
              bg-paper ${held() ? 'border-line shadow-pop-sm' : 'border-line-soft bg-line-soft'}`}
          >
            <Show
              when={AWARD_SPRITES[props.award]}
              keyed
              fallback={
                <Show
                  when={PERSON_AWARD_SHEETS[props.award]}
                  keyed
                  fallback={
                    <span
                      class={`pointer-events-none flex size-10 items-center justify-center
                        rounded-full text-base font-semibold ${
                          held()
                            ? 'text-white shadow-sm'
                            : 'border border-dashed border-line text-muted opacity-50'
                        }`}
                      style={held() ? { 'background-color': AWARD_COLORS[props.award] } : undefined}
                    >
                      {markOf(props.award, name())}
                    </span>
                  }
                >
                  {(sheet) => (
                    <NpcSprite
                      npc={Npc.Trainer}
                      sheet={sheet}
                      size={ART}
                      label=""
                      class={`pointer-events-none ${held() ? '' : 'opacity-40 grayscale'}`}
                    />
                  )}
                </Show>
              }
            >
              {(sprite) => (
                <ExtraSprite
                  sheet={sprite[0]}
                  name={sprite[1]}
                  label=""
                  size={ART}
                  class={`pointer-events-none ${held() ? '' : 'opacity-40 grayscale'}`}
                />
              )}
            </Show>
            {/* How many times its fight has been won, in the corner */}
            <Show when={props.wins} keyed>
              {(wins) => (
                <span
                  class="pointer-events-none absolute -right-1 -bottom-1 rounded-full border
                    border-line bg-paper px-1 text-[10px] leading-tight font-bold text-ink"
                >
                  {wins}
                </span>
              )}
            </Show>
          </span>
          <span
            class={`line-clamp-2 text-center text-[11px] leading-tight font-extrabold ${
              held() ? 'text-ink' : 'text-muted'
            }`}
          >
            {name()}
          </span>
        </button>
      }
    >
      <div class="flex flex-col gap-1">
        <span class="font-semibold">{name()}</span>
        <Detail label={m.award_beaten()}>{m.award_times({ count: props.wins ?? 0 })}</Detail>
        <Show when={!held()}>
          <Meta>{m.award_unearned()}</Meta>
        </Show>
      </div>
    </HoverCard>
  );
}
