import { For } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { RadioGroup, RadioGroupLabel, RadioGroupOption } from 'terracotta/radio-group';
import { CountPill } from './row-card';

/**
 * Two to four choices side by side on one track, the chosen one raised
 * as a white key: This box or All boxes, All, Caught or Missing.
 *
 * It is a radio group to a screen reader and to the keyboard: one Tab
 * stop, and the arrow keys move the choice. A choice that opens a panel
 * of its own is a tab instead; this one only changes what the panel
 * beside it shows.
 */

export interface SegmentedOption<V> {
  value: V;
  label: string;
  /** How many it holds, in a pill after the label */
  count?: number;
  /** The count is what waits on the player, so it reads ember */
  hot?: boolean;
}

export interface SegmentedProps<V> {
  /** What the group is called, for a screen reader */
  label: string;
  value: V;
  options: SegmentedOption<V>[];
  onChange: (value: V) => void;
  /** Stretch across the column, each key taking an equal share */
  fill?: boolean;
  class?: string;
}

const TRACK = 'flex shrink-0 gap-0.5 rounded-button bg-line-soft p-[3px]';

const KEY =
  'cursor-pointer whitespace-nowrap rounded-[10px] border-2 px-3 py-1 text-sm font-extrabold' +
  ' shadow-none transition-colors duration-(--motion-quick) active:translate-y-0' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide';

export default function Segmented<V>(props: SegmentedProps<V>): JSX.Element {
  return (
    <RadioGroup
      value={props.value}
      onChange={(value) => {
        if (value !== undefined) {
          props.onChange(value);
        }
      }}
      class={`${TRACK} ${props.fill === true ? 'w-full' : ''} ${props.class ?? ''}`}
    >
      <RadioGroupLabel as="span" class="sr-only">
        {props.label}
      </RadioGroupLabel>
      <For each={props.options}>
        {(option) => (
          <RadioGroupOption
            value={option.value}
            class={`${KEY} ${props.fill === true ? 'flex-1 text-center' : ''} ${
              option.value === props.value
                ? 'border-line bg-paper text-ink'
                : 'border-transparent bg-transparent text-muted hover:text-ink'
            }`}
          >
            <RadioGroupLabel as="span">{option.label}</RadioGroupLabel>
            {option.count == null ? null : (
              <CountPill class="ml-1.5" look={option.hot === true ? 'hot' : 'quiet'}>
                {option.count}
              </CountPill>
            )}
          </RadioGroupOption>
        )}
      </For>
    </RadioGroup>
  );
}
