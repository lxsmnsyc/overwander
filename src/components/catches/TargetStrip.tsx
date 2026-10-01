import { For, type JSX } from 'solid-js';
import type { CaughtPokemon } from '../../auth/caught';
import { getCatchName, isShiny } from '../../auth/caught-record';
import { isEgg } from '../../auth/egg';
import { STATUS_NAMES, getMaxHealth, isFainted } from '../../auth/health';
import { Genders, Species } from '../../data/ids/species';
import { unpackStatuses } from '../../data/ids/status';
import AnimatedSprite from '../sprites/AnimatedSprite';

/**
 * The pokemon something is about to be spent on, with its health and
 * what it carries from its last fight, so a player can see what an
 * item would fix before choosing one
 */
export default function TargetStrip(props: { caught: CaughtPokemon }): JSX.Element {
  const max = (): number => getMaxHealth(props.caught);
  const share = (): number =>
    max() <= 0 ? 0 : Math.max(0, Math.min(1, props.caught.health / max()));

  return (
    <div class="flex items-center gap-2.5 rounded-xl border-2 border-line-soft px-2.5 py-1.5">
      <span class="size-9 shrink-0">
        <AnimatedSprite
          species={isEgg(props.caught) ? Species.Egg : props.caught.species}
          shiny={!isEgg(props.caught) && isShiny(props.caught)}
          female={props.caught.gender === Genders.Female}
          direction="Down"
          still
          fill
          label=""
        />
      </span>
      <span class="flex min-w-0 grow flex-col gap-1">
        <span class="truncate text-sm font-extrabold">
          {getCatchName(props.caught)} · Lv. {props.caught.level}
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-1.5 grow overflow-hidden rounded-full bg-line-soft">
            <span
              class={`block h-full ${isFainted(props.caught) ? 'bg-muted' : 'bg-leaf'}`}
              style={{ width: `${share() * 100}%` }}
            />
          </span>
          <span class="shrink-0 text-xs text-muted tabular-nums">
            {Math.max(0, Math.round(props.caught.health))}/{max()}
          </span>
        </span>
      </span>
      <For each={unpackStatuses(props.caught.statuses)}>
        {(status) => (
          <span
            class="shrink-0 rounded-full bg-ember-soft px-2 py-0.5 text-xs font-bold
              text-ember-dark"
          >
            {STATUS_NAMES[status]}
          </span>
        )}
      </For>
    </div>
  );
}
