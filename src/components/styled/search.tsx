import { type JSX, createEffect, createSignal, onCleanup, untrack } from 'solid-js';

/**
 * Finding one row in a list of them.
 *
 * This is a plain search field rather than one of terracotta's
 * components on purpose: a combobox is for choosing a value out of a
 * list and putting it in the box, and none of these lists work that
 * way — the rows keep their own buttons and the typing only decides
 * which of them are shown. `type="search"` is already a searchbox to a
 * screen reader and already carries the browser's own way of clearing
 * it, so there is no behaviour left to borrow.
 */

/**
 * How many rows a list needs before it is worth searching. Under this
 * the box is more to read than the list is
 */
export const SEARCH_FROM = 6;

/**
 * How long the box waits after the last keystroke before the list is
 * narrowed.
 *
 * Long enough that a word typed at speed rebuilds the list once rather
 * than once per letter, and short enough that it still reads as the
 * list answering the typing. It matters most where a keystroke costs
 * more than a filter — the auction board re-derives what every lot is
 * called, and the catch lists re-describe every pokemon they hold
 */
export const SEARCH_DEBOUNCE = 200;

export interface SearchProps {
  /**
   * What is being searched for now — the settled value, which lags the
   * box by the debounce while somebody is typing
   */
  value: string;
  onChange: (value: string) => void;
  /**
   * What is being searched, in the placeholder — "Search the bag",
   * "Search your pokemon". The label itself is always the same word,
   * since the box is always doing the same thing
   */
  placeholder?: string;
  class?: string;
}

export default function Search(props: SearchProps): JSX.Element {
  /**
   * What is in the box, which is not the same thing as what is being
   * searched for. The letters land here at once — a field that lagged
   * behind the keyboard would feel broken — and are handed on when the
   * typing stops
   */
  const [typed, setTyped] = createSignal(props.value);

  let waiting: ReturnType<typeof setTimeout> | undefined;

  const cancel = (): void => {
    if (waiting != null) {
      clearTimeout(waiting);
      waiting = undefined;
    }
  };

  // A pending keystroke on a list that has gone away has nothing left
  // to narrow
  onCleanup(cancel);

  /**
   * The caller changing the value out from under the box — clearing it
   * when a picker reopens — puts that in the box too. Once the wait is
   * over the two agree, so this does nothing while somebody types
   */
  createEffect(() => {
    const settled = props.value;

    if (settled !== untrack(typed)) {
      cancel();
      setTyped(settled);
    }
  });

  return (
    <label class={`inline-flex items-center gap-2 text-sm ${props.class ?? ''}`}>
      <span class="text-muted">Search</span>
      <input
        type="search"
        value={typed()}
        placeholder={props.placeholder}
        class="w-44 max-w-full"
        onInput={(event) => {
          const value = event.currentTarget.value;

          setTyped(value);
          cancel();
          waiting = setTimeout(() => {
            waiting = undefined;
            props.onChange(value);
          }, SEARCH_DEBOUNCE);
        }}
        onKeyDown={(event) => {
          // Somebody who has finished typing and pressed Enter has
          // said so; there is nothing left to wait for
          if (event.key === 'Enter') {
            event.preventDefault();
            cancel();
            props.onChange(untrack(typed));
          }
        }}
      />
    </label>
  );
}
