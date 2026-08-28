import { type JSX, Show } from 'solid-js';

/**
 * A setting with a range rather than two states: a volume, a rate, a
 * share of something.
 *
 * It is the one control here built on a bare element rather than on a
 * terracotta component, because terracotta has no slider and the
 * browser's own range input already is one: it is dragged, arrowed,
 * paged and announced correctly on every platform, and none of that
 * survives being rebuilt out of a div.
 */

export interface SliderProps {
  label: string;
  /** Where it sits, 0 to 1 */
  value: number;
  onChange: (value: number) => void;
  description?: string;
  disabled?: boolean;
  class?: string;
}

/**
 * How finely it can be set. A hundredth is finer than anybody can hear
 * and finer than the track is wide, which is what makes dragging it
 * feel continuous
 */
const STEP = 0.01;

const TRACK =
  'h-2 w-full cursor-pointer appearance-none rounded-full border-2 border-line bg-line-soft' +
  ' accent-leaf disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2' +
  ' focus-visible:outline-offset-2 focus-visible:outline-tide';

export default function Slider(props: SliderProps): JSX.Element {
  const percent = (): number => Math.round(props.value * 100);

  return (
    <div class={`flex flex-col gap-1 text-sm ${props.class ?? ''}`}>
      <div class="flex items-baseline justify-between gap-3">
        <span class="flex flex-col gap-0.5">
          <span class="font-semibold">{props.label}</span>
          <Show when={props.description}>
            {(said) => <span class="text-xs text-muted">{said()}</span>}
          </Show>
        </span>
        <span class="shrink-0 tabular-nums text-muted">{percent()}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={STEP}
        value={props.value}
        disabled={props.disabled}
        // Named by the label beside it, and read out as a share rather
        // than as a number between nothing and one
        aria-label={props.label}
        aria-valuetext={`${percent()} percent`}
        class={TRACK}
        onInput={(event) => {
          props.onChange(event.currentTarget.valueAsNumber);
        }}
      />
    </div>
  );
}
