import { For, type JSX, Show, createEffect, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Transition } from 'terracotta';
import type { QuerySuggestion } from '../../../core/query';
import { usePortalHost } from '../portal-host';
import { SHEER } from '../transition';

/**
 * What the box is offering to finish the word with.
 *
 * Not a combobox, for the reason the box itself is not one: terracotta
 * owns what is in the input, and here the input holds a whole query
 * that only one word of is being chosen. So this is the list and
 * nothing else, and the box above it keeps the keyboard.
 *
 * Portalled, because the boxes that carry one sit in panels that
 * scroll and clip.
 */

/**
 * A row rather than a control: the keyboard never lands here, so these
 * are the kit's listbox options and not buttons, which the base layer
 * would give a border and a shadow of their own
 */
const OPTION =
  'flex cursor-pointer items-baseline gap-2 rounded-lg px-2 py-1 text-sm' +
  ' font-semibold transition-colors hover:bg-tide-soft';

const ACTIVE = 'bg-tide-soft text-tide-dark';

/** Where the list hangs, and which way it grew from the box */
export interface SearchDrop {
  x: number;
  y: number;
  width: number;
  /** Dropped upward, so `y` is the list's foot rather than its head */
  flip: boolean;
}

export interface SuggestionsProps {
  open: boolean;
  suggestions: QuerySuggestion[];
  /** Which one the arrows are on */
  active: number;
  /** Where to hang the list, in page coordinates */
  at: SearchDrop | null;
  onPick: (suggestion: QuerySuggestion) => void;
  /** Names the list to the box that owns it */
  id: string;
  optionId: (at: number) => string;
}

export default function Suggestions(props: SuggestionsProps): JSX.Element {
  const host = usePortalHost();
  const [list, setList] = createSignal<HTMLElement>();

  /**
   * The arrows walk past the bottom of a list taller than its box, so
   * the row they are on is brought back into it
   */
  createEffect(() => {
    const panel = list();
    const row = panel?.querySelector<HTMLElement>(`#${CSS.escape(props.optionId(props.active))}`);

    if (props.open) {
      row?.scrollIntoView({ block: 'nearest' });
    }
  });

  return (
    <Portal mount={host()}>
      <Transition
        show={props.open && props.suggestions.length > 0}
        {...SHEER}
        class="fixed z-40"
        style={{
          left: `${props.at?.x ?? 0}px`,
          top: `${props.at?.y ?? 0}px`,
          'min-width': `${props.at?.width ?? 0}px`,
          'max-width': 'min(90vw, 22rem)',
          // A list dropped upward is placed by its foot, which is the
          // one measurement taken before it has been drawn
          transform: props.at?.flip === true ? 'translateY(-100%)' : undefined,
        }}
      >
        <ul
          ref={(element: HTMLElement) => {
            setList(element);
          }}
          id={props.id}
          role="listbox"
          aria-label="Suggestions"
          class="flex max-h-64 list-none flex-col gap-0.5 overflow-y-auto rounded-xl border-2
          border-tide bg-paper p-1 shadow-pop"
        >
          <For each={props.suggestions}>
            {(suggestion, at) => (
              <li
                id={props.optionId(at())}
                role="option"
                aria-selected={at() === props.active}
                class={`${OPTION} ${at() === props.active ? ACTIVE : ''}`}
                // Pressed rather than clicked: a click would have taken
                // the focus off the box first, and the box closing the
                // list on its way out would take the press with it
                onPointerDown={(event) => {
                  event.preventDefault();
                  props.onPick(suggestion);
                }}
              >
                <span class="truncate">{suggestion.label}</span>
                <Show when={suggestion.hint}>
                  {(hint) => (
                    <span class="ml-auto truncate text-xs font-normal text-muted">{hint()}</span>
                  )}
                </Show>
              </li>
            )}
          </For>
        </ul>
      </Transition>
    </Portal>
  );
}
