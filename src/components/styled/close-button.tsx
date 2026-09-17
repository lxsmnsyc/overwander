import type { JSX } from 'solid-js';
import { CloseIcon } from '../icons';

/** An × that shuts whatever it sits in, for a top row with no room for the word */
export default function CloseButton(props: { onPress: () => void; label?: string }): JSX.Element {
  return (
    <button
      type="button"
      aria-label={props.label ?? 'Close'}
      class="inline-flex items-center rounded-xl border-2 border-line bg-paper px-2 py-1 text-ink
        shadow-pop hover:border-tide hover:text-tide-dark"
      onClick={() => {
        props.onPress();
      }}
    >
      <CloseIcon class="size-5" aria-hidden="true" />
    </button>
  );
}
