import { For, type JSX, Show, createEffect } from 'solid-js';
import type { QuerySuggestion } from '../../../core/query';

/**
 * What the bar is offering to finish the word with.
 *
 * It stands in the panel rather than being dropped over the page, as
 * the search box's does. A bar has nothing behind it worth reading, so
 * a list that grows the panel is simpler than one placed against the
 * window: nothing to measure, nothing to flip, and nothing to stack.
 */

/**
 * A row rather than a control: the keyboard never lands here, so these
 * are listbox options and not buttons
 */
const OPTION =
  'flex cursor-pointer items-baseline gap-2 rounded-lg px-2 py-1 text-sm' +
  ' font-semibold transition-colors hover:bg-tide-soft';

const ACTIVE = 'bg-tide-soft text-tide-dark';

export interface OffersProps {
  suggestions: QuerySuggestion[];
  /** Which one the arrows are on */
  active: number;
  onPick: (suggestion: QuerySuggestion) => void;
  /** Names the list to the bar that owns it */
  id: string;
  optionId: (at: number) => string;
}

export default function Offers(props: OffersProps): JSX.Element {
  let list: HTMLUListElement | undefined;

  /**
   * The arrows walk past the bottom of a list taller than its box, so
   * the row they are on is brought back into it
   */
  createEffect(() => {
    list
      ?.querySelector<HTMLElement>(`#${CSS.escape(props.optionId(props.active))}`)
      ?.scrollIntoView({ block: 'nearest' });
  });

  return (
    <ul
      ref={list}
      id={props.id}
      role="listbox"
      aria-label="Suggestions"
      class="m-0 flex max-h-64 list-none flex-col gap-0.5 overflow-y-auto p-0"
    >
      <For each={props.suggestions}>
        {(suggestion, at) => (
          <li
            id={props.optionId(at())}
            role="option"
            aria-selected={at() === props.active}
            class={`${OPTION} ${at() === props.active ? ACTIVE : ''}`}
            // Pressed rather than clicked: a click would have taken the
            // focus off the bar first
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
  );
}
