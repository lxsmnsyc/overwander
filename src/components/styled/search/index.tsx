import {
  For,
  type JSX,
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  untrack,
} from 'solid-js';
import {
  type QueryCompletion,
  type QuerySuggestion,
  type QueryVocabulary,
  completeQuery,
  isControlField,
  scanQuery,
  sharedPrefix,
  splitTerms,
  typedTerms,
} from '../../../core/query';
import { SearchIcon } from '../../icons';
import { Badge, BadgeDismiss, type BadgeTone } from '../feedback';
import SearchGuide from './guide';
import Suggestions, { type SearchDrop } from './suggestions';

/**
 * Finding one row in a list of them.
 *
 * This is a plain search field rather than one of terracotta's
 * components on purpose: a combobox is for choosing a value out of a
 * list and putting it in the box, and none of these lists work that
 * way — the rows keep their own buttons and the typing only decides
 * which of them are shown.
 *
 * Given a vocabulary it also finishes what is being typed and keeps
 * the terms already asked for as badges inside the box, each of which
 * can be taken off. Both are the same idea: the grammar is precise and
 * nobody remembers it, so the box says what it knows rather than
 * waiting to be guessed at.
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

/** How far under the box its suggestions hang */
const DROP = 4;

/**
 * How much room the list wants under the box before it stops dropping
 * upward instead, how narrow it may be reckoned when it is pulled back
 * onto the screen, and how close to an edge it may sit
 */
const LIST_ROOM = 160;
const MIN_LIST = 240;
const EDGE = 8;

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
  /**
   * What this box can be asked. Given one it finishes field names and
   * their values as they are typed, keeps the finished ones as badges,
   * and carries the guide beside itself. A box over a plain list of
   * names has no grammar to explain and is left as it was
   */
  vocabulary?: QueryVocabulary;
  /** One whole term to open the guide with, from the list being searched */
  example?: string;
  /**
   * How long the box waits before handing the letters on. The default
   * suits a list already in hand; a search the **server** answers is
   * worth waiting longer for, since every settled keystroke there is a
   * scan rather than a filter
   */
  wait?: number;
  class?: string;
}

/**
 * What a term is doing, which is what decides the badge it wears: most
 * narrow the list, a refused one takes rows away, the two arranging
 * terms only reorder what is left, and a field nobody has a reading
 * for narrows the list to nothing
 */
type TermRole = 'narrows' | 'refuses' | 'arranges' | 'unknown';

const TERM_TONES: Record<TermRole, BadgeTone> = {
  narrows: 'tide',
  refuses: 'gold',
  arranges: 'neutral',
  unknown: 'ember',
};

function roleOf(term: string, vocabulary: QueryVocabulary): TermRole {
  const [token] = scanQuery(term);

  if (!vocabulary.fields.some((one) => one.name === token.field)) {
    return 'unknown';
  }
  if (isControlField(token.field)) {
    return 'arranges';
  }
  return token.negated ? 'refuses' : 'narrows';
}

export default function Search(props: SearchProps): JSX.Element {
  const seeded = splitTerms(props.value);
  /**
   * The terms already asked for, as they were typed. They are the
   * badges in the box, and are the query with whatever is still being
   * typed added to the end of them
   */
  const [terms, setTerms] = createSignal(props.vocabulary == null ? [] : seeded.terms);
  /**
   * What is in the box, which is not the same thing as what is being
   * searched for. The letters land here at once — a field that lagged
   * behind the keyboard would feel broken — and are handed on when the
   * typing stops
   */
  const [typed, setTyped] = createSignal(props.vocabulary == null ? props.value : seeded.rest);
  /** Where the caret is, which is what decides the word being finished */
  const [caret, setCaret] = createSignal(0);
  const [open, setOpen] = createSignal(false);
  const [active, setActive] = createSignal(0);
  /**
   * Whether the arrows have been used since the last keystroke. Tab
   * takes what somebody has picked out; it only fills in shared
   * letters where nobody has picked anything
   */
  const [arrowed, setArrowed] = createSignal(false);
  const [at, setAt] = createSignal<SearchDrop | null>(null);

  let box: HTMLInputElement | undefined;
  let field: HTMLElement | undefined;
  /** The guide in the corner, which is the one part of the field that is not the box */
  let guide: HTMLElement | undefined;
  let waiting: ReturnType<typeof setTimeout> | undefined;

  const listId = createUniqueId();
  const optionId = (index: number): string => `${listId}-${index}`;

  /** The badges and the box read back as one query */
  const query = (): string =>
    [...terms(), typed()]
      .map((part) => part.trim())
      .filter((part) => part !== '')
      .join(' ');

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

    if (settled !== untrack(query)) {
      cancel();
      if (props.vocabulary == null) {
        setTyped(settled);
      } else {
        const parts = splitTerms(settled);

        setTerms(parts.terms);
        setTyped(parts.rest);
      }
      setOpen(false);
    }
  });

  /** What the box is offering, or nothing where it has nothing to offer */
  const offering = (): QueryCompletion | null => {
    const vocabulary = props.vocabulary;

    return vocabulary == null ? null : completeQuery(typed(), caret(), vocabulary);
  };

  const suggestions = (): QuerySuggestion[] => offering()?.suggestions ?? [];

  /**
   * Where the list hangs. A box near the foot of the window drops its
   * list upward instead, and a box near the right edge pulls its list
   * back onto the screen
   */
  const measure = (): void => {
    const bounds = field?.getBoundingClientRect();

    if (bounds == null) {
      return;
    }
    const under = window.innerHeight - bounds.bottom - DROP;
    const flip = under < LIST_ROOM && bounds.top > under;
    const wide = Math.max(bounds.width, MIN_LIST);

    setAt({
      x: Math.max(EDGE, Math.min(bounds.left, window.innerWidth - wide - EDGE)),
      y: flip ? bounds.top - DROP : bounds.bottom + DROP,
      width: bounds.width,
      flip,
    });
  };

  /**
   * The list is fixed to the window, so anything that moves the box
   * under it moves it too
   */
  createEffect(() => {
    if (!open()) {
      return;
    }
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    onCleanup(() => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    });
  });

  const settle = (): void => {
    cancel();
    props.onChange(query());
  };

  const hand = (): void => {
    cancel();
    waiting = setTimeout(() => {
      waiting = undefined;
      props.onChange(query());
    }, props.wait ?? SEARCH_DEBOUNCE);
  };

  /** What is in the box, and the caret with it */
  const put = (text: string, landing: number): void => {
    setTyped(text);
    setCaret(landing);
    if (box != null) {
      box.value = text;
      box.setSelectionRange(landing, landing);
    }
  };

  /**
   * Whatever has been finished leaves the box and becomes a badge. It
   * is what a space does, and taking a value out of the list types the
   * space itself
   */
  const collect = (text: string, landing: number): void => {
    const taken = props.vocabulary == null ? { terms: [], rest: text } : typedTerms(text);

    if (taken.terms.length > 0) {
      setTerms([...terms(), ...taken.terms]);
      put(taken.rest, Math.max(0, landing - (text.length - taken.rest.length)));
    } else {
      put(text, landing);
    }
    hand();
  };

  /**
   * The word under the caret becomes `word`, and the caret lands after
   * it and whatever `tail` follows
   */
  const write = (word: string, tail: string): void => {
    const span = offering();

    if (span == null || box == null) {
      return;
    }
    const text = `${typed().slice(0, span.start)}${word}${tail}${typed().slice(span.end)}`;

    box.focus();
    setActive(0);
    setArrowed(false);
    setOpen(true);
    collect(text, span.start + word.length + tail.length);
  };

  /**
   * Take one suggestion. A field is half a term, so the box stays open
   * on the values it takes; a value finishes one, and the space that
   * follows is what turns it into a badge
   */
  const pick = (suggestion: QuerySuggestion): void => {
    write(suggestion.word, suggestion.partial ? '' : ' ');
  };

  /**
   * What Tab does: take the highlighted offer. Where nobody has
   * highlighted anything and every offer agrees on more letters than
   * have been typed, those letters are filled in instead and the list
   * is left open on what is still being chosen between
   */
  const complete = (offered: QuerySuggestion[]): void => {
    const span = offering();
    const shared = sharedPrefix(offered.map((one) => one.word));

    if (!arrowed() && span != null && offered.length > 1 && shared.length > span.end - span.start) {
      write(shared, '');
      return;
    }
    pick(offered[active()]);
  };

  /** Taking a badge off asks the shorter question at once */
  const drop = (index: number): void => {
    setTerms(terms().filter((_, one) => one !== index));
    settle();
  };

  /**
   * Backspace at the head of the box takes the last badge back apart
   * to be edited, which is the only way to change a term without
   * typing it again
   */
  const reopen = (): void => {
    const held = terms();

    if (held.length === 0) {
      return;
    }
    const last = held[held.length - 1];

    setTerms(held.slice(0, -1));
    put(typed() === '' ? last : `${last} ${typed()}`, last.length);
    setOpen(false);
    hand();
  };

  const follow = (): void => {
    setCaret(box?.selectionStart ?? 0);
  };

  return (
    <span class={`flex min-w-0 grow items-center gap-2 text-sm ${props.class ?? ''}`}>
      {/* The word is an icon, and the terms already asked for stand in
          the box beside what is still being typed. The label is a
          label rather than a placeholder, which is gone the moment
          anything is typed */}
      <label class="flex min-w-0 grow items-center">
        <span class="sr-only">Search</span>
        <span
          ref={(element: HTMLElement) => {
            field = element;
          }}
          class="relative flex min-w-0 grow flex-wrap items-center gap-1 rounded-xl border-2
          border-line bg-paper py-1 pr-9 pl-2.5 focus-within:border-tide
          [&:has(:focus-visible)]:outline-2 [&:has(:focus-visible)]:outline-offset-2
          [&:has(:focus-visible)]:outline-tide"
          // The whole field is the box: a press anywhere but the
          // letters themselves lands in the box, which is also what
          // keeps the keyboard here while a badge is taken off
          onPointerDown={(event) => {
            const pressed = event.target as Node;

            if (pressed !== box && guide?.contains(pressed) !== true) {
              event.preventDefault();
              box?.focus();
            }
          }}
        >
          <SearchIcon class="size-4 shrink-0 text-muted" aria-hidden="true" />
          <Show when={props.vocabulary}>
            {(vocabulary) => (
              <For each={terms()}>
                {(term, index) => (
                  <Badge
                    tone={TERM_TONES[roleOf(term, vocabulary())]}
                    class="py-0.5 pr-1 pl-2 text-xs"
                  >
                    {term}
                    <BadgeDismiss
                      tone={TERM_TONES[roleOf(term, vocabulary())]}
                      label={`Remove ${term}`}
                      onDismiss={() => {
                        drop(index());
                      }}
                    />
                  </Badge>
                )}
              </For>
            )}
          </Show>
          <input
            ref={box}
            type="search"
            value={typed()}
            placeholder={terms().length > 0 ? undefined : props.placeholder}
            // The browser's own clear is drawn at the inner right
            // edge, which is where the guide now stands: two marks in
            // one corner, one of them unlabelled. The badges carry
            // their own crosses and the box empties as they go
            class="w-24 min-w-0 grow rounded-none border-0 bg-transparent p-0
            focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none"
            autocomplete="off"
            role={props.vocabulary == null ? undefined : 'combobox'}
            aria-autocomplete={props.vocabulary == null ? undefined : 'list'}
            aria-expanded={props.vocabulary == null ? undefined : open()}
            aria-controls={props.vocabulary == null ? undefined : listId}
            aria-activedescendant={
              open() && suggestions().length > 0 ? optionId(active()) : undefined
            }
            onInput={(event) => {
              setActive(0);
              setArrowed(false);
              measure();
              setOpen(true);
              collect(event.currentTarget.value, event.currentTarget.selectionStart ?? 0);
            }}
            onClick={follow}
            onFocus={() => {
              follow();
              measure();
            }}
            onBlur={() => {
              setOpen(false);
            }}
            // A listener of its own rather than Solid's delegated
            // `onKeyDown`, which is answered at the document: a dialog
            // panel takes Tab and Escape on its way there, traps the
            // focus with them and stops them, so the box never heard
            // either while it stood in one
            on:keydown={(event) => {
              const offered = suggestions();
              const showing = open() && offered.length > 0;

              if (showing && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                event.preventDefault();
                event.stopPropagation();
                setActive(
                  (active() + (event.key === 'ArrowDown' ? 1 : offered.length - 1)) %
                    offered.length,
                );
                setArrowed(true);
                return;
              }
              // Shift and Tab is somebody leaving the box, not somebody
              // finishing a word
              if (showing && event.key === 'Tab' && !event.shiftKey) {
                // Stopped as well as refused: a dialog panel moves the
                // focus itself rather than leaving it to the browser,
                // so refusing the key is not enough to keep it here
                event.preventDefault();
                event.stopPropagation();
                complete(offered);
                return;
              }
              if (showing && event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                pick(offered[active()]);
                return;
              }
              if (event.key === 'Escape' && open()) {
                // The list first: somebody closing the suggestions has
                // not asked to clear what they typed
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                return;
              }
              if (event.key === 'Backspace' && caret() === 0 && box?.selectionEnd === 0) {
                event.preventDefault();
                reopen();
                return;
              }
              // Somebody who has finished typing and pressed Enter has
              // said so; there is nothing left to wait for
              if (event.key === 'Enter') {
                event.preventDefault();
                settle();
              }
            }}
          />
          {/* The guide stands in the box, opposite the magnifier: the
              two are what the box *is* and what it can be asked, and
              an icon loose beside the field read as a third control on
              the row. Held to the right edge rather than laid out with
              the badges, so a field that has wrapped to two lines
              keeps it where a reader last saw it */}
          <Show when={props.vocabulary}>
            {(vocabulary) => (
              <span
                ref={(element: HTMLElement) => {
                  guide = element;
                }}
                class="absolute top-1/2 right-2 -translate-y-1/2"
              >
                <SearchGuide vocabulary={vocabulary()} example={props.example} />
              </span>
            )}
          </Show>
        </span>
      </label>
      <Show when={props.vocabulary != null}>
        <Suggestions
          open={open()}
          suggestions={suggestions()}
          active={active()}
          at={at()}
          id={listId}
          optionId={optionId}
          onPick={pick}
        />
      </Show>
    </span>
  );
}
