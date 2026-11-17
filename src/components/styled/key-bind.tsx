import { type JSX, Show, createSignal, onCleanup } from 'solid-js';
import Button from './button';
import { SETTING_ROW } from './card';
import { m } from '../../i18n/paraglide/messages.js';

/**
 * One key, and the press that changes it.
 *
 * It is a row the shape of a `Switch`: what it is for on the left, and
 * the control on the right. The control is a button that says the key
 * it is bound to, and pressing it hands the keyboard over until the
 * next press, which is the binding.
 */

export interface KeyBindProps {
  label: string;
  /** The key as it is stored: a letter in lower case, or a key name */
  value: string;
  onChange: (key: string) => void;
  description?: string;
  /** Drawn as a settings row: the key as a keycap, and a Change button after it */
  row?: boolean;
  class?: string;
}

/** A key as it is worth reading: the space bar has no glyph of its own */
export function keyLabel(key: string): string {
  if (key === ' ') {
    return m.key_space();
  }
  return key.length === 1 ? key.toUpperCase() : key;
}

/** What a key cannot be bound to, because the page needs it back */
const REFUSED = new Set(['Tab', 'Escape']);

export default function KeyBind(props: KeyBindProps): JSX.Element {
  const [listening, setListening] = createSignal(false);

  const listen = (): void => {
    if (listening()) {
      return;
    }
    setListening(true);

    /**
     * Caught on the way down the page rather than on the way back up,
     * so the button under the finger never sees the press: Enter on a
     * focused button is a press of that button, and binding Enter
     * would otherwise ask to bind a key all over again
     */
    const taken = (event: KeyboardEvent): void => {
      // A modifier on its own is somebody still reaching for the key
      if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setListening(false);
      window.removeEventListener('keydown', taken, true);
      if (!REFUSED.has(event.key)) {
        props.onChange(event.key.length === 1 ? event.key.toLowerCase() : event.key);
      }
    };

    window.addEventListener('keydown', taken, true);
    onCleanup(() => {
      setListening(false);
      window.removeEventListener('keydown', taken, true);
    });
  };

  const spoken = (): string =>
    listening()
      ? m.key_press_for({ label: props.label })
      : m.key_bound({ label: props.label, key: keyLabel(props.value) });

  if (props.row === true) {
    return (
      <div class={`flex justify-between text-sm ${SETTING_ROW} ${props.class ?? ''}`}>
        <span class="flex min-w-0 grow flex-col gap-0.5">
          <span class="font-extrabold">{props.label}</span>
          <Show when={props.description}>
            {(said) => <span class="text-xs text-muted">{said()}</span>}
          </Show>
        </span>
        <span
          aria-hidden="true"
          class={`inline-flex h-[34px] min-w-11 items-center justify-center rounded-[10px] border-2
            border-b-4 px-2.5 font-display text-sm font-semibold ${
              listening()
                ? 'border-tide bg-tide-soft text-tide-dark'
                : 'border-line bg-parchment text-ink'
            }`}
        >
          {listening() ? m.key_press() : keyLabel(props.value)}
        </span>
        <Button class="h-[34px]" onClick={listen} label={spoken()}>
          {m.key_change()}
        </Button>
      </div>
    );
  }

  return (
    <div class={`flex items-start justify-between gap-3 text-sm ${props.class ?? ''}`}>
      <span class="flex flex-col gap-0.5">
        <span class="font-semibold">{props.label}</span>
        <Show when={props.description}>
          {(said) => <span class="text-xs text-muted">{said()}</span>}
        </Show>
      </span>
      <Button
        tone={listening() ? 'primary' : 'ghost'}
        onClick={listen}
        // Said in full, since the button itself is a key name and a
        // key name on its own says nothing about what it is for
        aria-label={spoken()}
      >
        <span class="min-w-16 text-center font-mono">
          {listening() ? m.key_press() : keyLabel(props.value)}
        </span>
      </Button>
    </div>
  );
}
