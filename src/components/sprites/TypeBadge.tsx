import type { JSX } from 'solid-js';
import { TYPE_COLORS, TYPE_NAMES, type Types } from '../../data/constants/types';

/**
 * A type, drawn as the series draws it: the word on the colour that
 * belongs to it.
 *
 * The colour is the point. A player reading a move list or a dex entry
 * is looking for "the Water one" rather than reading eighteen words,
 * and the word is kept beside it so that the colour is never the only
 * thing carrying the meaning — which is what makes it readable to
 * somebody who cannot tell two of them apart.
 *
 * It is not one of the styled `Badge` tones because those are a
 * closed set of five the whole game shares; there are twenty types,
 * and their colours are data rather than design
 */

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

export interface TypeBadgeProps {
  type: Types;
  class?: string;
}

export default function TypeBadge(props: TypeBadgeProps): JSX.Element {
  return (
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
  );
}
