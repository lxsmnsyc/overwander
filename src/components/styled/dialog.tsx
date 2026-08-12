import type { JSX, ParentProps } from 'solid-js';
import {
  DialogOverlay,
  DialogPanel,
  Dialog as HeadlessDialog,
  DialogDescription as HeadlessDialogDescription,
  DialogTitle as HeadlessDialogTitle,
} from 'terracotta';

/**
 * The game's dialogs, as a set rather than as a habit.
 *
 * Terracotta gives the behaviour — the overlay, the focus trap, the
 * escape key — and says nothing about how any of it looks, so every
 * dialog in the game had been carrying its own copy of the same
 * styles. Six copies is six chances to disagree, and they had already
 * started to: one panel opened at 10% from the top and another at 20%,
 * one scrolled and another did not.
 *
 * These are that panel, once. A dialog written against them says what
 * is in it and nothing about how tall it is.
 */

/**
 * How wide a panel opens. Most dialogs are a list of things to press;
 * a few — the catch sheet, the world map — are a page of detail, and
 * asking for room is better than every one of them being that wide
 */
export type DialogWidth = 'narrow' | 'wide';

const WIDTHS: Record<DialogWidth, string> = {
  narrow: 'w-[min(92vw,26rem)]',
  wide: 'w-[min(92vw,44rem)]',
};

const PANEL =
  'fixed left-1/2 top-[8%] max-h-[84vh] -translate-x-1/2 overflow-y-auto rounded-panel' +
  ' border border-line bg-paper p-4 text-left shadow-2xl shadow-ink/25 sm:p-5';

export interface DialogProps extends ParentProps {
  isOpen: boolean;
  onClose: () => void;
  width?: DialogWidth;
  /**
   * What the dialog is called
   */
  title: JSX.Element;
  /**
   * What this dialog is for, in a sentence.
   *
   * Both of these are props rather than components the caller places,
   * because terracotta points the dialog's `aria-labelledby` and
   * `aria-describedby` at a title and a description whether or not
   * either one is written. A dialog that names itself by an id
   * belonging to nothing is announced as an unnamed dialog, and a
   * title written inside a `<Show>` is exactly that for as long as it
   * is loading. Asking for both here is what makes them impossible to
   * forget — and the sentence is worth writing anyway, since it is the
   * line that says what the screen is asking and what it costs
   */
  description: JSX.Element;
  /**
   * Whether the heading is for the screen reader alone.
   *
   * A dialog that *is* one picture — the world map — has nothing to
   * caption: a title and a sentence above it are two lines of prose
   * on top of the thing they describe. The two are still written and
   * still announced, since terracotta names and describes the dialog
   * by them and a dialog with neither is announced as an unnamed one;
   * they are only taken out of sight
   */
  quiet?: boolean;
  /**
   * Whether the sentence under the title is for the screen reader
   * alone.
   *
   * Between a dialog that captions itself and one that says nothing:
   * the encounter names what is standing there — species, level,
   * gender, whether it sparkles — which is the whole of what a player
   * needs, while the sentence beneath it explains a game they are
   * already playing
   */
  terse?: boolean;
  /**
   * Something to put beside the title — the menu of things that can be
   * done to whatever the dialog is about.
   *
   * It is taken out of the flow rather than laid out next to the
   * heading, so the heading stays in the middle of the panel whatever
   * is standing to the right of it
   */
  aside?: JSX.Element;
}

/**
 * A dialog: the overlay behind it and the panel it is drawn on. It
 * opens with what it is and what it is for; the rest is the caller's
 */
export function Dialog(props: DialogProps): JSX.Element {
  return (
    <HeadlessDialog isOpen={props.isOpen} onClose={props.onClose}>
      <DialogOverlay class="fixed inset-0 bg-ink/55 backdrop-blur-[1px]" />
      <DialogPanel class={`${PANEL} ${WIDTHS[props.width ?? 'narrow']}`}>
        <div class="flex flex-col gap-3">
          <header
            class={
              props.quiet === true
                ? 'sr-only'
                : 'flex flex-col gap-1 border-b border-line-soft pb-2'
            }
          >
            {/* A heading rather than bold text: it is what a screen
                reader announces the dialog by. It sits in the middle
                of the panel, and anything standing beside it is pinned
                to the edge rather than allowed to push it off centre */}
            <div class="relative flex min-h-8 items-center justify-center">
              <HeadlessDialogTitle class="text-center text-lg font-semibold">
                {props.title}
              </HeadlessDialogTitle>
              {props.aside == null ? null : <div class="absolute right-0">{props.aside}</div>}
            </div>
            <HeadlessDialogDescription
              class={props.terse === true ? 'sr-only' : 'text-center text-sm text-muted'}
            >
              {props.description}
            </HeadlessDialogDescription>
          </header>
          {props.children}
        </div>
      </DialogPanel>
    </HeadlessDialog>
  );
}

/**
 * A run of related things inside a dialog — a list and the sentence
 * above it — set apart from the run before it
 */
export function DialogSection(props: ParentProps & { title?: string }): JSX.Element {
  return (
    <section class="flex flex-col gap-2">
      {props.title == null ? null : <h3>{props.title}</h3>}
      {props.children}
    </section>
  );
}

/**
 * The row a dialog ends on. Buttons sit to the right of it, in the
 * order they are written, with the way out last — or in the middle,
 * for a dialog that is one thing shown down the centre and would
 * look lopsided ending anywhere else
 */
export function DialogActions(props: ParentProps<{ center?: boolean }>): JSX.Element {
  return (
    <div
      class={`flex flex-wrap items-center gap-2 border-t border-line-soft pt-3 ${
        props.center === true ? 'justify-center' : 'justify-end'
      }`}
    >
      {props.children}
    </div>
  );
}
