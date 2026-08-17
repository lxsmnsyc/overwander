import { For, type JSX, Show } from 'solid-js';
import {
  RadioGroup as HeadlessRadioGroup,
  RadioGroupDescription,
  RadioGroupLabel,
  RadioGroupOption,
} from 'terracotta';

/**
 * One of a handful of choices, all of them on screen.
 *
 * It is for a set small enough to read at once and worth reading — a
 * role, a rate of spawning, what a ban does. Anything longer than about
 * five is a `Select`, which shows one and hides the rest.
 *
 * Each choice is a row rather than a dot and a word: the sentence under
 * the name is usually the reason to pick it, and a dot leaves nowhere
 * to put it.
 */

export interface RadioOption<V> {
  value: V;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps<V> {
  label: string;
  value: V;
  options: RadioOption<V>[];
  onChange: (value: V) => void;
  class?: string;
}

const OPTION =
  'flex cursor-pointer items-start gap-2 rounded-xl border-2 border-line bg-paper px-3 py-2' +
  ' text-sm shadow-pop-sm transition-colors hover:border-tide aria-checked:border-leaf' +
  ' aria-checked:bg-leaf-soft aria-disabled:cursor-not-allowed aria-disabled:opacity-70' +
  ' aria-disabled:hover:border-line focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-tide';

/** The dot, filled in for the row that is chosen */
const MARK =
  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-line' +
  ' bg-paper';

export default function RadioGroupField<V>(props: RadioGroupProps<V>): JSX.Element {
  return (
    <HeadlessRadioGroup
      value={props.value}
      onChange={(value) => {
        if (value !== undefined) {
          props.onChange(value);
        }
      }}
      class={`flex flex-col gap-1 ${props.class ?? ''}`}
    >
      <RadioGroupLabel class="text-sm font-semibold text-muted">{props.label}</RadioGroupLabel>
      <div class="flex flex-col gap-2">
        <For each={props.options}>
          {(option) => (
            <RadioGroupOption value={option.value} disabled={option.disabled} class={OPTION}>
              <span class={MARK}>
                <span
                  aria-hidden="true"
                  class={`size-2 rounded-full bg-leaf ${
                    option.value === props.value ? '' : 'opacity-0'
                  }`}
                />
              </span>
              <span class="flex flex-col gap-0.5">
                <RadioGroupLabel class="font-semibold">{option.label}</RadioGroupLabel>
                <Show when={option.description}>
                  {(said) => (
                    <RadioGroupDescription class="text-xs text-muted">
                      {said()}
                    </RadioGroupDescription>
                  )}
                </Show>
              </span>
            </RadioGroupOption>
          )}
        </For>
      </div>
    </HeadlessRadioGroup>
  );
}
