import { type JSX, Show } from 'solid-js';

/**
 * The seconds before the fight starts, drawn over the middle of the
 * field because the field is what it is counting down to
 */
export default function Countdown(props: { left: number | null }): JSX.Element {
  return (
    <Show when={props.left}>
      {(left) => (
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center"
          role="status"
        >
          <span
            class="rounded-full border-4 border-tide bg-paper/90 px-6 py-3 text-4xl
              font-extrabold tabular-nums shadow-pop backdrop-blur-sm"
          >
            {left()}
          </span>
        </div>
      )}
    </Show>
  );
}
