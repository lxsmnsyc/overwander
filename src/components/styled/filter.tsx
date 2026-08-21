import { For, type JSX, createSignal } from 'solid-js';
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
  Transition,
} from 'terracotta';
import { SHEER } from './transition';
import dismissOutside from './dismiss';

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
 * is written but not shown: the listbox names itself by one whether or
 * not there is one to name.
 */
export interface FilterOption<V> {
  value: V;
  label: string;
}

export interface FilterProps<V> {
  /**
   * What is being narrowed — "Category", "Kind". It is what the
   * listbox is announced by rather than anything drawn
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
  ' hover:bg-tide-soft aria-selected:bg-tide aria-selected:text-on-accent' +
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
  /**
   * Whether the list is down. Terracotta would keep this to itself,
   * but the fade has to be told when to run — and the options are kept
   * mounted for it, so the list is still there to fade out
   */
  const [open, setOpen] = createSignal(false);
  /** The whole control, for working out what is a press away from it */
  const [root, setRoot] = createSignal<HTMLElement>();

  dismissOutside(root, open, () => {
    setOpen(false);
  });

  return (
    <Listbox
      ref={(element: HTMLElement) => {
        setRoot(element);
      }}
      isOpen={open()}
      onDisclosureChange={(state) => {
        setOpen(state);
      }}
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
      {/* Written for the screen reader alone: the button already says
          which shelf is showing, and the word beside it was a second
          label for the same control */}
      <ListboxLabel class="sr-only">{props.label}</ListboxLabel>
      <ListboxButton
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border-2 border-line bg-paper px-3
          py-1 text-sm font-bold shadow-pop-sm transition-colors hover:border-tide
          hover:text-tide-dark focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-tide"
      >
        {showing()}
        <span aria-hidden="true">▾</span>
      </ListboxButton>
      {/* Over the list it filters rather than pushing it down the
          page: the rows underneath are what the choice is about. It
          hangs from the right edge, since the control itself sits in
          the right corner and a list wider than it would otherwise
          run off the screen */}
      <Transition
        show={open()}
        {...SHEER}
        class="absolute top-full right-0 z-20 mt-1.5 w-max min-w-full"
      >
        <ListboxOptions
          // Kept mounted, since the fade needs something to fade
          unmount={false}
          // A list that has been dismissed is not one to pick from,
          // however long it takes to go
          aria-hidden={open() ? undefined : 'true'}
          class="flex max-h-64 w-full list-none flex-col gap-0.5 overflow-y-auto rounded-xl
            border-2 border-tide bg-paper p-1 shadow-pop"
        >
          <For each={props.options}>
            {(option) => (
              <ListboxOption class={OPTION} value={option.value}>
                {option.label}
              </ListboxOption>
            )}
          </For>
        </ListboxOptions>
      </Transition>
    </Listbox>
  );
}
