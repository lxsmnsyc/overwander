import { For, type JSX } from 'solid-js';
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from 'terracotta';

/**
 * Narrowing a list down to one kind of thing.
 *
 * A bag of forty items and a history of forty battles are both lists
 * a player is reading to find one sort of entry, so both get the same
 * control: a word for what is being shown, and the kinds it could be
 * showing instead.
 *
 * Terracotta's listbox brings what a listbox is expected to do —
 * arrow keys, Home and End, type-ahead, Escape, closing when the focus
 * leaves — and the options are unmounted while it is shut. The label
 * is rendered rather than offered, because the listbox names itself by
 * one whether or not there is one to name.
 */
export interface FilterOption<V> {
  value: V;
  label: string;
}

export interface FilterProps<V> {
  /**
   * What is being narrowed — "Category", "Kind". It is the word beside
   * the control, and the one the listbox is announced by
   */
  label: string;
  value: V;
  options: FilterOption<V>[];
  onChange: (value: V) => void;
  class?: string;
}

/**
 * The option a keyboard is currently on. Terracotta marks it with a
 * bare `tc-active` attribute of its own rather than a `data-` one, so
 * the variant is written out
 */
const ACTIVE = '[&[tc-active]]:bg-tide-soft [&[tc-active]]:text-tide-dark';

const OPTION =
  'cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold transition-colors' +
  ' hover:bg-tide-soft aria-selected:bg-tide aria-selected:text-paper' +
  ' aria-selected:hover:bg-tide-dark ' +
  ACTIVE;

export default function Filter<V>(props: {
  label: string;
  value: V;
  options: FilterOption<V>[];
  onChange: (value: V) => void;
  class?: string;
}): JSX.Element {
  /**
   * What the button says: the option that is on, by the name the
   * caller gave it
   */
  const showing = (): string =>
    props.options.find((option) => option.value === props.value)?.label ?? props.label;

  return (
    <Listbox
      defaultOpen={false}
      toggleable={false}
      value={props.value}
      onSelectChange={(value) => {
        // A listbox that cannot be toggled off still reports the
        // selection as possibly nothing; nothing is not a filter
        if (value !== undefined) {
          props.onChange(value);
        }
      }}
      class={`relative inline-flex items-center gap-2 text-sm ${props.class ?? ''}`}
    >
      <ListboxLabel class="text-muted">{props.label}</ListboxLabel>
      <ListboxButton
        class="inline-flex items-center gap-1.5 rounded-xl border-2 border-line bg-paper px-3
          py-1 text-sm font-bold shadow-pop-sm transition-colors hover:border-tide
          hover:text-tide-dark focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-tide"
      >
        {showing()}
        <span aria-hidden="true">▾</span>
      </ListboxButton>
      {/* Over the list it filters rather than pushing it down the
          page: the rows underneath are what the choice is about */}
      <ListboxOptions
        class="absolute top-full left-0 z-20 mt-1.5 flex max-h-64 w-max min-w-full list-none
          flex-col gap-0.5 overflow-y-auto rounded-xl border-2 border-tide bg-paper p-1
          shadow-pop"
      >
        <For each={props.options}>
          {(option) => (
            <ListboxOption class={OPTION} value={option.value}>
              {option.label}
            </ListboxOption>
          )}
        </For>
      </ListboxOptions>
    </Listbox>
  );
}
