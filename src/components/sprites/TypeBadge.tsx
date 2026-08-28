import { For, type JSX, Show } from 'solid-js';
import AtlasSprite from './AtlasSprite';
import { UI_SPRITE_ROOT } from '../../canvas/basic-sprites';
import {
  TYPE_COLORS,
  TYPE_NAMES,
  type TypeMatchups,
  Types,
  getTypeMatchups,
} from '../../data/constants/types';
import { Detail, TooltipHost } from '../styled';

/**
 * A type, drawn as the series draws it: the sigil on the colour that
 * belongs to it.
 *
 * A player reading a move list or a dex entry is looking for "the
 * Water one" rather than reading eighteen words, and a picture is what
 * survives being glanced at. The name and the chart it sits in are
 * said on a card instead, since knowing a move is Water is only half
 * of knowing whether to use it.
 */

const SHEET = `${UI_SPRITE_ROOT}/types`;

/**
 * How wide the sigil is drawn, in the page and on the card. The sheet
 * cuts them at 128, far larger than either
 */
const SIZE = 24;
const CARD_SIZE = 20;

/**
 * What each type is called on the sheet. `Unknown` and `Stellar` are
 * missing because neither has a sigil drawn for it, and they fall back
 * to the word on their colour
 */
const PICTURES: Partial<Record<Types, string>> = {
  [Types.Normal]: 'normal',
  [Types.Fighting]: 'fighting',
  [Types.Flying]: 'flying',
  [Types.Poison]: 'poison',
  [Types.Ground]: 'ground',
  [Types.Rock]: 'rock',
  [Types.Bug]: 'bug',
  [Types.Ghost]: 'ghost',
  [Types.Steel]: 'steel',
  [Types.Fire]: 'fire',
  [Types.Water]: 'water',
  [Types.Grass]: 'grass',
  [Types.Electric]: 'electric',
  [Types.Psychic]: 'psychic',
  [Types.Ice]: 'ice',
  [Types.Dragon]: 'dragon',
  [Types.Dark]: 'dark',
  [Types.Fairy]: 'fairy',
};

/**
 * How dark a colour has to be before the word on it is drawn light.
 * The measure is perceived brightness rather than the plain average:
 * green reads far brighter than blue at the same value
 */
const CONTRAST_THRESHOLD = 0.6;

function isDark(color: string): boolean {
  const red = Number.parseInt(color.slice(1, 3), 16) / 255;
  const green = Number.parseInt(color.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(color.slice(5, 7), 16) / 255;

  return 0.299 * red + 0.587 * green + 0.114 * blue < CONTRAST_THRESHOLD;
}

interface SigilProps {
  type: Types;
  size?: number;
  class?: string;
}

/**
 * The picture on its own. The card is built out of these rather than
 * out of whole badges, so a sigil on a card does not carry a card of
 * its own
 */
function Sigil(props: SigilProps): JSX.Element {
  return (
    <Show
      when={PICTURES[props.type]}
      fallback={
        <span
          class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold
            whitespace-nowrap uppercase ${props.class ?? ''}`}
          style={{
            'background-color': TYPE_COLORS[props.type],
            color: isDark(TYPE_COLORS[props.type]) ? '#ffffff' : '#1b1b1b',
          }}
        >
          {TYPE_NAMES[props.type]}
        </span>
      }
    >
      {(name) => (
        <AtlasSprite
          sheet={SHEET}
          name={name()}
          size={props.size ?? SIZE}
          label={TYPE_NAMES[props.type]}
          smooth
          class={props.class}
        />
      )}
    </Show>
  );
}

/** One line of the chart, left out when the type has nothing in it */
function Matchup(props: { label: string; types: Types[] }): JSX.Element {
  return (
    <Show when={props.types.length > 0}>
      <Detail label={props.label}>
        <span class="flex flex-wrap gap-1 py-0.5">
          <For each={props.types}>
            {(type) => <Sigil type={type} size={CARD_SIZE} />}
          </For>
        </span>
      </Detail>
    </Show>
  );
}

/**
 * The chart from this type's side. Attacking first, since a type is
 * usually read off a move: what it does before what is done to it
 */
function Matchups(props: { type: Types }): JSX.Element {
  const chart = (): TypeMatchups => getTypeMatchups(props.type);

  return (
    <>
      <Matchup label="Strong against" types={chart().strong} />
      <Matchup label="Weak to" types={chart().weak} />
      <Matchup label="Resists" types={chart().resists} />
      <Matchup label="Immune to" types={chart().immune} />
    </>
  );
}

export interface TypeBadgeProps {
  type: Types;
  /** The longest side of the sigil, where a caller wants it bigger or smaller */
  size?: number;
  class?: string;
}

export default function TypeBadge(props: TypeBadgeProps): JSX.Element {
  return (
    <TooltipHost
      class={`inline-flex items-center ${props.class ?? ''}`}
      name={TYPE_NAMES[props.type]}
      extra={() => <Matchups type={props.type} />}
    >
      <Sigil type={props.type} size={props.size} />
    </TooltipHost>
  );
}
