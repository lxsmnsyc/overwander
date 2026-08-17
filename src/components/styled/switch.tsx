import { type JSX, Show } from 'solid-js';
import { Toggle } from 'terracotta';

/**
 * A setting that takes effect as it is pressed, rather than when a
 * form is saved.
 *
 * That is the whole difference from a checkbox, and it is why the two
 * look nothing alike: a switch says the thing is on *now*. Anything
 * that only counts once Save is pressed is a checkbox.
 */

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
  class?: string;
}

const TRACK =
  'relative h-6 w-11 shrink-0 rounded-full border-2 border-line bg-line-soft transition-colors' +
  ' aria-pressed:border-leaf-dark aria-pressed:bg-leaf aria-disabled:cursor-not-allowed' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide';

/** The knob, moved by the same distance the track is wider than it */
const KNOB =
  'absolute top-0.5 left-0.5 size-4 rounded-full bg-paper shadow-pop-sm transition-transform';

export default function Switch(props: SwitchProps): JSX.Element {
  return (
    <div class={`flex items-start justify-between gap-3 text-sm ${props.class ?? ''}`}>
      <span class="flex flex-col gap-0.5">
        <span class="font-semibold">{props.label}</span>
        <Show when={props.description}>
          {(said) => <span class="text-xs text-muted">{said()}</span>}
        </Show>
      </span>
      <Toggle
        pressed={props.checked}
        disabled={props.disabled}
        onChange={(state: boolean) => {
          props.onChange(state);
        }}
        // Named by the setting beside it: the track says nothing on its
        // own, and "on" is what it is already announced as
        aria-label={props.label}
        class={`${TRACK} ${props.disabled === true ? 'opacity-70' : ''}`}
      >
        <span aria-hidden="true" class={`${KNOB} ${props.checked ? 'translate-x-5' : ''}`} />
      </Toggle>
    </div>
  );
}
