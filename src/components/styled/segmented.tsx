import { For, type JSX } from 'solid-js';

/**
 * Two to four choices side by side on one track, the chosen one raised
 * as a white key: This box or All boxes, All, Caught or Missing.
 *
 * It is a radio group to a screen reader. A choice that opens a panel
 * of its own is a tab instead; this one only changes what the panel
 * beside it shows.
 */

export interface SegmentedOption<V> {
  value: V;
  label: string;
}

export interface SegmentedProps<V> {
  /** What the group is called, for a screen reader */
  label: string;
  value: V;
  options: SegmentedOption<V>[];
  onChange: (value: V) => void;
  class?: string;
}

const TRACK = 'flex shrink-0 gap-0.5 rounded-button bg-line-soft p-[3px]';

const KEY =
  'cursor-pointer whitespace-nowrap rounded-[10px] border-2 px-3 py-1 text-sm font-extrabold' +
  ' shadow-none transition-colors duration-(--motion-quick) active:translate-y-0' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide';

export default function Segmented<V>(props: SegmentedProps<V>): JSX.Element {
  return (
    <div role="radiogroup" aria-label={props.label} class={`${TRACK} ${props.class ?? ''}`}>
      <For each={props.options}>
        {(option) => (
          <button
            type="button"
            role="radio"
            aria-checked={option.value === props.value}
            class={`${KEY} ${
              option.value === props.value
                ? 'border-line bg-paper text-ink'
                : 'border-transparent bg-transparent text-muted hover:text-ink'
            }`}
            onClick={() => {
              props.onChange(option.value);
            }}
          >
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}
