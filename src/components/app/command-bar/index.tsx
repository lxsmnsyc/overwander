import { type JSX, Show, createEffect, createSignal, createUniqueId, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
  DialogOverlay,
  DialogPanel,
  Dialog as HeadlessDialog,
  DialogDescription as HeadlessDialogDescription,
  DialogTitle as HeadlessDialogTitle,
  Transition,
  TransitionChild,
} from 'terracotta';
import type { QueryCompletion, QuerySuggestion } from '../../../core/query';
import { Status, usePortalHost } from '../../styled';
import COMMAND_VOCABULARY from './commands';
import FADE, { SHEER } from '../../styled/transition';
import Offers from './offers';
import type { Origin } from './locate';
import { COMMAND_MARK, completeCommand } from '../../../core/command';
import { getPosition } from '../../../auth/positions';
import { forTheGame } from '../keys';
import type { CommandResult } from './run';
import runCommand from './run';
import { sharedPrefix } from '../../../core/query';
import { useGame } from '../game-context';

/**
 * The bar staff type at, opened with a slash.
 *
 * It is the search box's grammar with a command in front of it, and
 * it finishes both halves the same way. What differs is that a search
 * box narrows a list somebody is already looking at and this does
 * something, so there are no badges and no debounce: a line is typed,
 * read back once, and run on Enter.
 *
 * What a command did is printed under the box and the box stays
 * open, so a line can be read, corrected and run again without
 * reaching for the bar a second time. `/view` is the exception: its
 * whole answer is the profile it opens, so the bar gets out of the
 * way of it.
 */

export interface CommandBarProps {
  /**
   * Whether this account may open it at all. The bar is hidden from
   * everybody else, and every command behind it is refused again on
   * the server, where a browser's opinion of its own role counts for
   * nothing
   */
  allowed: boolean;
  /** Whoever is typing, which is where `/locate` counts from */
  player: string;
}

/** Where a walk starts when nobody has walked yet */
const ORIGIN: Origin = { chunkX: 0, chunkY: 0 };

export default function CommandBar(props: CommandBarProps): JSX.Element {
  const host = usePortalHost();
  const game = useGame();
  const [open, setOpen] = createSignal(false);
  const [line, setLine] = createSignal('');
  const [caret, setCaret] = createSignal(0);
  const [active, setActive] = createSignal(0);
  /**
   * Whether the arrows have been used since the last keystroke. Tab
   * takes what somebody has picked out; it only fills in shared
   * letters where nobody has picked anything
   */
  const [arrowed, setArrowed] = createSignal(false);
  const [running, setRunning] = createSignal(false);
  /**
   * What the last line did, kept under the box until the next
   * keystroke. It stands in the offers' place rather than beside
   * them: a list of what could be typed next is no use while the
   * answer to what was typed is the thing being read
   */
  const [result, setResult] = createSignal<CommandResult | null>(null);
  /**
   * Where the caller is standing, read as the bar opens rather than
   * followed: `/locate` counts from where somebody was when they asked
   */
  const [origin, setOrigin] = createSignal<Origin>(ORIGIN);

  let box: HTMLInputElement | undefined;

  const listId = createUniqueId();
  const optionId = (index: number): string => `${listId}-${index}`;

  /**
   * A slash, the way a chat window opens a command.
   *
   * Listened for at the window rather than on anything drawn, since
   * the bar is not on screen until it is asked for, and only while
   * nothing on the page has the keyboard: a slash typed into a search
   * box is a slash
   */
  createEffect(() => {
    if (!props.allowed) {
      return;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== '/' || !forTheGame(event)) {
        return;
      }
      event.preventDefault();
      setLine('');
      setCaret(0);
      setActive(0);
      setArrowed(false);
      setResult(null);
      setOpen(true);
      getPosition(props.player)
        .then((standing) => {
          setOrigin(standing ?? ORIGIN);
        })
        .catch(() => undefined);
    };

    window.addEventListener('keydown', onKey);
    onCleanup(() => {
      window.removeEventListener('keydown', onKey);
    });
  });

  /** What the bar is offering, or nothing where it has nothing to offer */
  const offering = (): QueryCompletion | null =>
    completeCommand(line(), caret(), COMMAND_VOCABULARY);

  const suggestions = (): QuerySuggestion[] => offering()?.suggestions ?? [];

  /** What is in the bar, and the caret with it */
  const put = (text: string, landing: number): void => {
    setLine(text);
    setCaret(landing);
    if (box != null) {
      box.value = text;
      box.setSelectionRange(landing, landing);
    }
  };

  /**
   * The word under the caret becomes `word`, and the caret lands after
   * it and whatever `tail` follows
   */
  const write = (word: string, tail: string): void => {
    const span = offering();

    if (span == null) {
      return;
    }
    box?.focus();
    setActive(0);
    setArrowed(false);
    put(
      `${line().slice(0, span.start)}${word}${tail}${line().slice(span.end)}`,
      span.start + word.length + tail.length,
    );
  };

  /**
   * Take one suggestion. A parameter name is half a term, so the bar
   * stays on the values it takes; everything else finishes a word and
   * the space that follows starts the next
   */
  const pick = (suggestion: QuerySuggestion): void => {
    write(suggestion.word, suggestion.partial ? '' : ' ');
  };

  /**
   * What Tab does: take the highlighted offer. Where nobody has
   * highlighted anything and every offer agrees on more letters than
   * have been typed, those letters are filled in instead
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

  const close = (): void => {
    setOpen(false);
  };

  /** Run what was typed, and print what it did under the box */
  const run = (): void => {
    if (running()) {
      return;
    }
    const typed = line().trim();

    if (typed === '') {
      close();
      return;
    }
    setRunning(true);
    runCommand(typed, { origin: origin() })
      .then((answer) => {
        // `/view` answers with a screen rather than a line, and the
        // profile it opens is the one the game already mounts. The
        // bar closes for it: two panels over each other, one of them
        // holding nothing but the line that opened the other
        if (answer.viewing != null) {
          game.setVisiting(answer.viewing);
          close();
          return;
        }
        // A teleport of the caller moves this screen with it. The row
        // is about to arrive around the subscription, and a screen
        // that had not already stood there would read it as somebody
        // else walking off with the player
        if (answer.moved?.player === props.player) {
          game.standHere(answer.moved);
        }
        setResult(answer);
      })
      .catch(() => {
        setResult({ tone: 'refusal', message: 'It did not go through.' });
      })
      .finally(() => {
        setRunning(false);
      });
  };

  const follow = (): void => {
    setCaret(box?.selectionStart ?? 0);
  };

  return (
    <Show when={props.allowed}>
      <Portal mount={host()}>
        <Transition appear unmount show={open()}>
          <HeadlessDialog isOpen unmount={false} onClose={close} class="relative z-50">
            <TransitionChild {...SHEER} class="fixed inset-0">
              <DialogOverlay class="size-full bg-shade/70 backdrop-blur-[1px]" />
            </TransitionChild>
            {/* Near the top rather than in the middle: a bar is typed
                at and then read under, and the list it drops wants the
                room below it */}
            <TransitionChild
              {...FADE}
              class="fixed top-[12%] left-1/2 w-[min(92vw,34rem)] -translate-x-1/2"
            >
              <DialogPanel
                class="flex flex-col gap-2 rounded-panel border-4 border-tide bg-paper
              px-4 py-3 text-left shadow-window"
              >
                <HeadlessDialogTitle class="sr-only">Command bar</HeadlessDialogTitle>
                <HeadlessDialogDescription class="sr-only">
                  Type a command and run it with Enter.
                </HeadlessDialogDescription>
                {/* Above the box rather than under it: what is offered
                    to finish the word sits under the box, and an answer
                    that took its place would be gone the moment
                    somebody typed the next line */}
                <Show when={result()}>
                  {(answer) => (
                    <Status
                      message={answer().message}
                      tone={answer().tone === 'refusal' ? 'alert' : 'status'}
                    />
                  )}
                </Show>
                <span
                  class="flex min-w-0 items-center gap-2 rounded-xl border-2 border-line bg-paper
                  px-2.5 py-1.5 focus-within:border-tide"
                >
                  {/* The mark is the label. The bar wears it so that
                      nobody has to type it, and so a box that is
                      plainly for commands needs nothing else said */}
                  <span aria-hidden="true" class="font-extrabold text-muted">
                    {COMMAND_MARK}
                  </span>
                  <input
                    type="text"
                    value={line()}
                    placeholder="tp player:self x:100"
                    class="w-full min-w-0 grow rounded-none border-0 bg-transparent p-0 text-sm
                    focus-visible:outline-none"
                    autocomplete="off"
                    role="combobox"
                    aria-label="Command"
                    aria-autocomplete="list"
                    aria-expanded={suggestions().length > 0}
                    aria-controls={listId}
                    aria-activedescendant={
                      suggestions().length > 0 ? optionId(active()) : undefined
                    }
                    // Focused as it arrives: the bar exists to be typed
                    // at, and it was opened by a key rather than a press
                    ref={(element: HTMLInputElement) => {
                      box = element;
                      requestAnimationFrame(() => {
                        element.focus();
                      });
                    }}
                    onInput={(event) => {
                      setActive(0);
                      setArrowed(false);
                      put(event.currentTarget.value, event.currentTarget.selectionStart ?? 0);
                    }}
                    onClick={follow}
                    onFocus={follow}
                    // A listener of its own rather than Solid's
                    // delegated one, which is answered at the document:
                    // the dialog panel takes Tab and Escape on the way
                    // there and traps the focus with them
                    on:keydown={(event) => {
                      const offered = suggestions();

                      if (
                        offered.length > 0 &&
                        (event.key === 'ArrowDown' || event.key === 'ArrowUp')
                      ) {
                        event.preventDefault();
                        event.stopPropagation();
                        setActive(
                          (active() + (event.key === 'ArrowDown' ? 1 : offered.length - 1)) %
                            offered.length,
                        );
                        setArrowed(true);
                        return;
                      }
                      if (offered.length > 0 && event.key === 'Tab' && !event.shiftKey) {
                        event.preventDefault();
                        event.stopPropagation();
                        complete(offered);
                        return;
                      }
                      // Tab finishes a word and Enter runs the line.
                      // The list is open on nearly every keystroke,
                      // since an empty word offers everything, so an
                      // Enter that took the highlighted offer would
                      // never reach a command. Arrowing into the list
                      // is how somebody says they are choosing from it
                      // Closed here rather than left to the dialog:
                      // the game keeps several mounted at once, and
                      // the one that answers Escape is not this one
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        close();
                        return;
                      }
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                        if (arrowed() && offered.length > 0) {
                          pick(offered[active()]);
                          return;
                        }
                        run();
                      }
                    }}
                  />
                </span>
                {/* Under the bar and inside the panel, so the panel
                    grows around it and nothing has to be placed */}
                <Show when={!running() && suggestions().length > 0}>
                  <Offers
                    suggestions={suggestions()}
                    active={active()}
                    id={listId}
                    optionId={optionId}
                    onPick={pick}
                  />
                </Show>
              </DialogPanel>
            </TransitionChild>
          </HeadlessDialog>
        </Transition>
      </Portal>
    </Show>
  );
}
