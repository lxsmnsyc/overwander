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
  /**
   * Whether each choice is a card, two to a row where there is room,
   * rather than a row with a dot: for a handful of choices that are
   * each a thing (a stat, an ability) rather than a setting
   */
  cards?: boolean;
}

const OPTION =
  'flex cursor-pointer items-start gap-2 rounded-xl border-2 border-line bg-paper px-3 py-2' +
  ' text-sm shadow-pop-sm transition-colors duration-(--motion-quick) hover:border-tide' +
  ' aria-checked:border-leaf' +
  ' aria-checked:bg-leaf-soft aria-disabled:cursor-not-allowed aria-disabled:opacity-70' +
  ' aria-disabled:hover:border-line focus-visible:outline-2 focus-visible:outline-offset-2' +
  ' focus-visible:outline-tide';

/** A choice drawn as a card: no dot, a tick in its corner once chosen */
const CARD_OPTION =
  'relative flex cursor-pointer flex-col gap-0.5 rounded-card border-2 border-line bg-paper' +
  ' px-3 py-2.5 pr-9 text-left text-sm shadow-pop-sm transition-[border-color,background-color,translate]' +
  ' duration-(--motion-quick) ease-spring hover:-translate-y-0.5 hover:border-tide' +
  ' aria-checked:border-leaf aria-checked:bg-leaf-soft aria-disabled:cursor-not-allowed' +
  ' aria-disabled:opacity-60 aria-disabled:hover:translate-y-0 aria-disabled:hover:border-line' +
  ' focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tide';

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
      <div class={props.cards === true ? 'grid gap-2 sm:grid-cols-2' : 'flex flex-col gap-2'}>
        <For each={props.options}>
          {(option) => (
            <RadioGroupOption
              value={option.value}
              disabled={option.disabled}
              class={props.cards === true ? CARD_OPTION : OPTION}
            >
              <Show
                when={props.cards === true}
                fallback={
                  <span class={MARK}>
                    <span
                      aria-hidden="true"
                      class={`size-2 rounded-full bg-leaf ${
                        option.value === props.value ? '' : 'opacity-0'
                      }`}
                    />
                  </span>
                }
              >
                <span
                  aria-hidden="true"
                  class={`absolute top-2 right-2 flex size-5 items-center justify-center rounded-full
                    bg-leaf text-[11px] font-black text-on-accent ${
                      option.value === props.value ? '' : 'opacity-0'
                    }`}
                >
                  ✓
                </span>
              </Show>
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
