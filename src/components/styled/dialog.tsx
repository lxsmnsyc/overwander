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
          <header class="flex flex-col gap-1 border-b border-line-soft pb-2">
            {/* A heading rather than bold text: it is what a screen
                reader announces the dialog by */}
            <HeadlessDialogTitle class="text-lg font-semibold">{props.title}</HeadlessDialogTitle>
            <HeadlessDialogDescription class="text-sm text-muted">
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
 * order they are written, with the way out last
 */
export function DialogActions(props: ParentProps): JSX.Element {
  return (
    <div class="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft pt-3">
      {props.children}
    </div>
  );
}
