import { type JSX, Show } from 'solid-js';
import {
  CheckboxDescription,
  CheckboxIndicator,
  CheckboxLabel,
  Checkbox as HeadlessCheckbox,
} from 'terracotta';

/**
 * One thing that is either on or off, with the sentence that says what
 * turning it on means.
 *
 * Terracotta keeps the checked state, the `role` and the space bar;
 * what is decided here is that the box is a box the game drew rather
 * than the browser's, so it carries the same edge and the same hard
 * shadow as everything else.
 */

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** What ticking it does, where the label alone leaves it in doubt */
  description?: string;
  disabled?: boolean;
  class?: string;
}

const BOX =
  'flex size-5 shrink-0 items-center justify-center rounded-md border-2 bg-paper text-on-accent' +
  ' transition-colors aria-disabled:cursor-not-allowed aria-disabled:border-line' +
  ' aria-disabled:bg-line-soft focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-tide';

export default function Checkbox(props: CheckboxProps): JSX.Element {
  return (
    <HeadlessCheckbox
      checked={props.checked}
      disabled={props.disabled}
      onChange={(state?: boolean) => {
        props.onChange(state === true);
      }}
      class={`flex items-start gap-2 text-sm ${
        props.disabled === true ? 'opacity-70' : 'cursor-pointer'
      } ${props.class ?? ''}`}
    >
      <CheckboxIndicator
        // Terracotta marks the box with `tc-checked` and nothing a
        // screen reader reads, so a `role="checkbox"` that never says
        // whether it is ticked
        aria-checked={props.checked}
        class={`${BOX} ${props.checked ? 'border-leaf-dark bg-leaf' : 'border-line'}`}
      >
        {/* Drawn rather than a character: a tick that is part of the box
            cannot be left behind by a font */}
        <svg viewBox="0 0 16 16" class="size-3.5" aria-hidden="true">
          <path
            d="M3 8.5l3.2 3.2L13 5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class={props.checked ? '' : 'opacity-0'}
          />
        </svg>
      </CheckboxIndicator>
      <span class="flex flex-col gap-0.5">
        <CheckboxLabel class="font-semibold">{props.label}</CheckboxLabel>
        <Show when={props.description}>
          {(said) => <CheckboxDescription class="text-xs text-muted">{said()}</CheckboxDescription>}
        </Show>
      </span>
    </HeadlessCheckbox>
  );
}
