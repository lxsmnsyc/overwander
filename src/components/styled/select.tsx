import { For, type JSX, Show, createSignal } from 'solid-js';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from 'terracotta';
import { FieldFrame } from './form';
import { SHEER, holdFade } from './transition';
import dismissOutside from './dismiss';

/**
 * One choice out of a list that is too long to show at once.
 *
 * `Filter` is the same control put to a different use — it narrows a
 * list that is already on screen and never holds an empty value. This
 * one is a form field: it can start with nothing chosen, it can be
 * refused, and it says so the way the other fields do.
 */

export interface SelectOption<V> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<V> {
  label: string;
  /** What is chosen, or nothing at all until somebody chooses */
  value: V | null;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  /** What the button says while nothing is chosen */
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
}

const BUTTON =
  'inline-flex w-full items-center justify-between gap-2 rounded-xl border-2 border-line' +
  ' bg-paper px-3 py-1 text-left text-sm font-bold shadow-pop-sm transition-colors' +
  ' hover:border-tide hover:text-tide-dark focus-visible:outline-2' +
  ' focus-visible:outline-offset-2 focus-visible:outline-tide aria-disabled:cursor-not-allowed' +
  ' aria-disabled:bg-line-soft aria-disabled:text-muted aria-disabled:hover:border-line';

const OPTION =
  'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors' +
  ' hover:bg-tide-soft aria-selected:bg-tide aria-selected:text-on-accent' +
  ' aria-selected:hover:bg-tide-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-50' +
  ' aria-disabled:hover:bg-transparent [&[tc-active]]:bg-tide-soft' +
  ' [&[tc-active]]:text-tide-dark';

export default function Select<V>(props: SelectProps<V>): JSX.Element {
  const [open, setOpen] = createSignal(false);
  /** The whole control, for working out what is a press away from it */
  const [root, setRoot] = createSignal<HTMLElement>();

  dismissOutside(root, open, () => {
    setOpen(false);
  });
  /** The name of what is chosen, or the placeholder standing in for it */
  const showing = (): string =>
    props.options.find((option) => option.value === props.value)?.label ??
    props.placeholder ??
    'Choose…';

  return (
    <FieldFrame
      label={props.label}
      hint={props.hint}
      error={props.error}
      required={props.required}
      class={props.class}
    >
      {(parts) => (
        <Listbox
          ref={(element: HTMLElement) => {
            setRoot(element);
          }}
          isOpen={open()}
          onDisclosureChange={(state) => {
            setOpen(state);
          }}
          toggleable={false}
          disabled={props.disabled}
          value={props.value}
          onSelectChange={(value) => {
            if (value != null) {
              props.onChange(value);
            }
          }}
          class="relative"
        >
          <ListboxButton
            id={parts.id}
            aria-describedby={parts.describedBy}
            aria-invalid={props.error == null ? undefined : true}
            aria-required={props.required}
            class={`${BUTTON} ${props.error == null ? '' : 'border-ember'} ${
              props.value == null ? 'text-muted' : ''
            }`}
          >
            {showing()}
            <span aria-hidden="true">▾</span>
          </ListboxButton>
          <Transition show={open()} {...SHEER} class="absolute top-full left-0 z-20 mt-1.5 w-full">
            <ListboxOptions
              unmount={false}
              onTransitionEnd={holdFade}
              inert={!open()}
              class="flex max-h-64 w-full list-none flex-col gap-0.5 overflow-y-auto rounded-xl
                border-2 border-tide bg-paper p-1 shadow-pop"
            >
              <For each={props.options}>
                {(option) => (
                  <ListboxOption class={OPTION} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </ListboxOption>
                )}
              </For>
              <Show when={props.options.length === 0}>
                <li class="px-2 py-1 text-sm text-muted">Nothing to choose from.</li>
              </Show>
            </ListboxOptions>
          </Transition>
        </Listbox>
      )}
    </FieldFrame>
  );
}
