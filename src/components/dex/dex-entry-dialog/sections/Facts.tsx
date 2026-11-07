import type { JSX, Resource } from 'solid-js';
import { EGG_HATCH_STEPS } from '../../../../model/egg';
import { type SpeciesData, getFamilyName } from '../../../../data/species';
import { failed, readable } from '../../../app/resource-reads';
import { m } from '../../../../i18n/paraglide/messages.js';

/** One fact as a tile: a word over a number */
function Tile(props: {
  label: string;
  value: string;
  /** The whole fact as a sentence, for a screen reader */
  said: string;
  gold?: boolean;
}): JSX.Element {
  return (
    <div
      role="group"
      aria-label={props.said}
      class={`flex min-w-0 flex-col rounded-card border-2 px-2.5 py-2 ${
        props.gold === true ? 'border-gold/40' : 'border-line-soft'
      }`}
    >
      <span
        aria-hidden="true"
        class="truncate text-[10px] font-extrabold tracking-[0.12em] text-muted uppercase"
      >
        {props.label}
      </span>
      <b
        aria-hidden="true"
        class={`truncate font-display text-lg leading-tight font-semibold tabular-nums ${
          props.gold === true ? 'text-gold-dark' : ''
        }`}
      >
        {props.value}
      </b>
    </div>
  );
}

/** How big it is, what the reader holds of its candy, and how long its egg walks */
export default function Facts(props: { data: SpeciesData; candy: Resource<number> }): JSX.Element {
  /** The candy held, or a question mark where it could not be read */
  const candy = (): number | '?' =>
    failed(props.candy) == null ? (readable(props.candy) ?? 0) : '?';

  return (
    <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-2">
      <Tile
        label={m.dex_tile_height()}
        value={`${props.data.height} m`}
        said={`${m.dex_tile_height()} ${props.data.height} m`}
      />
      <Tile
        label={m.dex_tile_weight()}
        value={`${props.data.weight} kg`}
        said={`${m.dex_tile_weight()} ${props.data.weight} kg`}
      />
      <Tile
        gold
        label={m.dex_tile_candy()}
        value={String(candy())}
        said={m.battle_candy_earned({ count: candy(), family: getFamilyName(props.data.family) })}
      />
      <Tile
        label={m.dex_tile_hatch()}
        value={EGG_HATCH_STEPS.toLocaleString()}
        said={m.dex_hatch_steps({ count: EGG_HATCH_STEPS })}
      />
    </div>
  );
}
