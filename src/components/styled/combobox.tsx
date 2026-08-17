import { For, type JSX, Show, createSignal } from 'solid-js';
import {
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Combobox as HeadlessCombobox,
  Transition,
} from 'terracotta';
import { FieldFrame } from './form';
import FADE, { holdFade } from './transition';

/**
 * A choice out of a list nobody would scroll: a species, an account, an
 * item. The typing narrows it and the arrow keys pick from what is
 * left.
 *
 * The rule for reaching for this over `Select` is the length of the
 * list, not the kind of value: past a screenful, reading is slower than
 * typing three letters.
 */

export interface ComboboxOptionData<V> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps<V> {
  label: string;
  value: V | null;
  options: ComboboxOptionData<V>[];
  onChange: (value: V) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
}

const OPTION =
  'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors' +
  ' hover:bg-tide-soft aria-selected:bg-tide aria-selected:text-on-accent' +
  ' aria-selected:hover:bg-tide-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-50' +
  ' [&[tc-active]]:bg-tide-soft [&[tc-active]]:text-tide-dark';

export default function Combobox<V>(props: ComboboxProps<V>): JSX.Element {
  const [open, setOpen] = createSignal(false);
  /** What has been typed, which narrows the list without choosing from it */
  const [typed, setTyped] = createSignal('');

  const named = (value: V | null): string =>
    props.options.find((option) => option.value === value)?.label ?? '';

  /**
   * What is left after the typing. An empty box is the whole list
   * rather than nothing, since the box opens empty
   */
  const showing = (): ComboboxOptionData<V>[] => {
    const query = typed().trim().toLowerCase();

    return query === ''
      ? props.options
      : props.options.filter((option) => option.label.toLowerCase().includes(query));
  };

  return (
    <FieldFrame
      label={props.label}
      hint={props.hint}
      error={props.error}
      required={props.required}
      class={props.class}
    >
      {(parts) => (
        <HeadlessCombobox
          isOpen={open()}
          onDisclosureChange={(state) => {
            setOpen(state);
            // Back to the name of what is chosen once the list is shut:
            // a box left holding half a search says the wrong value
            if (!state) {
              setTyped('');
            }
          }}
          disabled={props.disabled}
          value={props.value}
          matchBy={(value, query) => named(value).toLowerCase().includes(query.toLowerCase())}
          onSelectChange={(value) => {
            if (value != null) {
              props.onChange(value);
            }
          }}
          class="relative"
        >
          <ComboboxInput
            id={parts.id}
            value={open() ? typed() : named(props.value)}
            placeholder={props.placeholder ?? 'Search…'}
            disabled={props.disabled}
            aria-describedby={parts.describedBy}
            aria-invalid={props.error == null ? undefined : true}
            aria-required={props.required}
            class={`w-full ${props.error == null ? '' : 'border-ember'}`}
            onInput={(event: InputEvent) => {
              const box = event.currentTarget;

              setOpen(true);
              if (box instanceof HTMLInputElement) {
                setTyped(box.value);
              }
            }}
          />
          <Transition show={open()} {...FADE} class="absolute top-full left-0 z-20 mt-1.5 w-full">
            <ComboboxOptions
              unmount={false}
              onTransitionEnd={holdFade}
              inert={!open()}
              class="flex max-h-64 w-full list-none flex-col gap-0.5 overflow-y-auto rounded-xl
                border-2 border-tide bg-paper p-1 shadow-pop"
            >
              <For each={showing()}>
                {(option) => (
                  <ComboboxOption class={OPTION} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </ComboboxOption>
                )}
              </For>
              <Show when={showing().length === 0}>
                <li class="px-2 py-1 text-sm text-muted">Nothing matches that.</li>
              </Show>
            </ComboboxOptions>
          </Transition>
        </HeadlessCombobox>
      )}
    </FieldFrame>
  );
}
