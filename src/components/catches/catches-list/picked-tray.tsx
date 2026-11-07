import { For, type JSX, Show } from 'solid-js';
import { Genders, Species } from '../../../data/ids/species';
import { isEgg } from '../../../model/egg';
import { isShiny } from '../../../model/caught-record';
import AnimatedSprite from '../../sprites/AnimatedSprite';
import type { CatchOption } from '../catch-picker';
import { describeCatch } from '../catch-summary';
import { m } from '../../../i18n/paraglide/messages.js';

/** How many picks the tray draws before it counts the rest */
const SHOWN = 14;

/**
 * Everything picked, wherever it is filed, under the box while
 * selecting. Picks stay picked while the player looks in another box,
 * and this is where they can see that they did
 */
export default function PickedTray(props: { chosen: CatchOption[] }): JSX.Element {
  /** How many boxes the picks come from, Default counted as one */
  const boxes = (): number => {
    const found = new Set<string>();

    for (const option of props.chosen) {
      found.add(option.caught.box ?? '');
    }
    return found.size;
  };

  const shown = (): CatchOption[] => props.chosen.slice(0, SHOWN);

  return (
    <Show when={props.chosen.length > 0}>
      <div
        class="motion-crossfade flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 rounded-card
          border-2 border-dashed border-leaf bg-leaf-soft/50 px-3 py-2
          animate-[rise-in_var(--motion-base)_var(--ease-settle)_backwards]"
      >
        <span class="text-[11px] font-extrabold tracking-[0.12em] text-leaf-dark uppercase">
          {m.catch_picked()}
        </span>
        <ul class="m-0 flex list-none flex-row flex-wrap gap-1 p-0">
          <For each={shown()}>
            {(option) => (
              <li class="relative size-7 rounded-chip border-2 border-leaf/40 bg-paper">
                <span
                  role="img"
                  aria-label={describeCatch(option.caught)}
                  title={describeCatch(option.caught)}
                  class="absolute inset-0"
                >
                  <AnimatedSprite
                    species={isEgg(option.caught) ? Species.Egg : option.caught.species}
                    shiny={isShiny(option.caught)}
                    female={!isEgg(option.caught) && option.caught.gender === Genders.Female}
                    direction="DownLeft"
                    still
                    fill
                  />
                </span>
              </li>
            )}
          </For>
        </ul>
        <Show when={props.chosen.length > SHOWN}>
          <span class="font-display text-xs font-semibold text-leaf-dark">
            {m.catch_picked_more({ count: props.chosen.length - SHOWN })}
          </span>
        </Show>
        <span class="text-xs text-leaf-dark">{m.catch_picked_from({ boxes: boxes() })}</span>
      </div>
    </Show>
  );
}
