import { type JSX, Show } from 'solid-js';

/**
 * The seconds before the fight starts, as a large ring over the middle
 * of the field, because the field is what it is counting down to. Each
 * number is drawn afresh, so it springs in from small; under reduce
 * motion it fades
 */
export default function Countdown(props: { left: number | null }): JSX.Element {
  return (
    <Show when={props.left} keyed>
      {(left) => (
        <div
          class="pointer-events-none absolute inset-x-0 top-[44%] z-10 flex -translate-y-1/2
            justify-center"
        >
          <span
            role="status"
            class="motion-crossfade box-border flex size-30 items-center justify-center rounded-full
              border-[6px] border-tide bg-paper/90 font-display text-6xl font-bold text-tide
              tabular-nums shadow-[0_6px_0_0_var(--blue-shade)] backdrop-blur-sm
              animate-[grow-in_var(--motion-move)_var(--ease-spring)_backwards] sm:size-[150px]
              sm:text-7xl"
          >
            {left}
          </span>
        </div>
      )}
    </Show>
  );
}
