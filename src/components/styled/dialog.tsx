import { type JSX, type ParentProps, onCleanup, onMount } from 'solid-js';
import { Portal, isServer } from 'solid-js/web';
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

/**
 * The window itself: a thick blue frame around white, standing off the
 * page on a hard shadow. It is the series' message box rather than a
 * card — what the game has to say has always arrived in a frame
 */
const PANEL =
  'fixed left-1/2 top-[8%] max-h-[84vh] -translate-x-1/2 overflow-y-auto rounded-panel' +
  ' border-4 border-tide bg-paper px-4 text-left shadow-window sm:px-5';

/**
 * The panel's vertical padding, which lives on the **content** rather
 * than on the panel.
 *
 * A sticky element is bounded by its containing block, and the panel's
 * own padding is outside the flex column the children are in — so a
 * bar stuck to the bottom stopped at the end of the content and left a
 * strip of panel below it with the list scrolling through the gap. Put
 * the padding inside the column and the bars can cover it, which is
 * what makes them read as the edges of the panel rather than as
 * something floating near them
 */
const INSET = 'py-4 sm:py-5';

/**
 * The panel's side padding, undone and put back on a child.
 *
 * A bar stuck to the top or the bottom of a scrolling panel has to
 * reach the sides of it, or the content slides through the strip of
 * padding beside it. Pulling the margin out and paying it back as
 * padding does that, and leaves the element where it was
 */
const BLEED = '-mx-4 px-4 sm:-mx-5 sm:px-5';

/**
 * The heading, held at the top while the rest of the dialog scrolls
 * under it. The catch sheet is several screens long, and its name and
 * the menu of things that can be done to the pokemon are what a player
 * scrolls back up for
 */
const STUCK_TOP = `sticky top-0 z-20 -mt-4 bg-tide pt-4 text-on-accent sm:-mt-5 sm:pt-5 ${BLEED}`;

/**
 * And the buttons, held at the bottom for the same reason: the way out
 * of a long dialog should not be somewhere a player has to travel to
 */
const STUCK_BOTTOM = `sticky bottom-0 z-20 -mb-4 bg-paper pb-4 sm:-mb-5 sm:pb-5 ${BLEED}`;

/**
 * Where the dialogs are drawn: a container of their own, standing
 * beside the app root rather than inside it.
 *
 * A dialog rendered where it was written is a fixed-position panel
 * inside whatever the page had built around it, and it inherits every
 * accident of that — a stacking context from a transform, a clip from
 * an `overflow-hidden`, a `z-index` race with the floating bar. Drawn
 * into a container that is a sibling of the app, a dialog is over
 * everything by construction, and the order they appear in that
 * container is the order they were opened in
 */
function portalHost(): HTMLElement | undefined {
  if (isServer) {
    return undefined;
  }
  return document.getElementById('portals') ?? undefined;
}

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
  /**
   * The panel's contents — **our** element, not terracotta's.
   *
   * The obvious thing is a `ref` on `DialogPanel`, and it is the thing
   * that broke this: terracotta does not forward one, so the variable
   * stayed null, the test below could never pass, and the handler
   * never fired once. Escape only ever worked when terracotta answered
   * it itself, which it does only while the focus is still inside the
   * panel — and the focus is exactly what does not stay there when the
   * page behind redraws.
   *
   * A ref on a plain `div` is a ref the compiler writes itself, and
   * the dialog it belongs to is whatever `[tc-dialog]` it sits inside
   */
  let inside: HTMLDivElement | undefined;

  onMount(() => {
    const onKey = (event: KeyboardEvent): void => {
      const dialogs = [...document.querySelectorAll('[tc-dialog]')];

      if (
        !props.isOpen ||
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        inside == null ||
        dialogs.at(-1)?.contains(inside) !== true
      ) {
        return;
      }
      event.preventDefault();
      props.onClose();
    };

    document.addEventListener('keydown', onKey);
    onCleanup(() => {
      document.removeEventListener('keydown', onKey);
    });
  });

  return (
    <Portal mount={portalHost()}>
      <HeadlessDialog isOpen={props.isOpen} onClose={props.onClose}>
        <DialogOverlay class="fixed inset-0 bg-ink/55 backdrop-blur-[1px]" />
        <DialogPanel class={`${PANEL} ${WIDTHS[props.width ?? 'narrow']}`}>
          <div ref={inside} class={`flex flex-col gap-3 ${INSET}`}>
            <header
              class={
                props.quiet === true
                  ? 'sr-only'
                  : `flex flex-col gap-1 border-b-2 border-tide-dark pb-3 sm:pb-4 ${STUCK_TOP}`
              }
            >
              {/* A heading rather than bold text: it is what a screen
                  reader announces the dialog by. It sits in the middle
                  of the panel, and anything standing beside it is
                  pinned to the edge rather than allowed to push it off
                  centre */}
              <div class="relative flex min-h-8 items-center justify-center">
                <HeadlessDialogTitle class="text-center text-lg font-extrabold tracking-tight">
                  {props.title}
                </HeadlessDialogTitle>
                {/* Back to ink: the bar is blue and its text is white,
                    which a button standing on it would otherwise
                    inherit — a white label on a white button */}
                {props.aside == null ? null : (
                  <div class="absolute right-0 text-ink">{props.aside}</div>
                )}
              </div>
              <HeadlessDialogDescription
                class={props.terse === true ? 'sr-only' : 'text-center text-sm text-on-accent/85'}
              >
                {props.description}
              </HeadlessDialogDescription>
            </header>
            {props.children}
          </div>
        </DialogPanel>
      </HeadlessDialog>
    </Portal>
  );
}

/**
 * A run of related things inside a dialog — a list and the sentence
 * above it — set apart from the run before it
 */
export function DialogSection(
  props: ParentProps & { title?: string; class?: string },
): JSX.Element {
  return (
    <section class={`flex flex-col gap-2 ${props.class ?? ''}`}>
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
      class={`flex flex-wrap items-center gap-2 border-t-2 border-line-soft pt-4 sm:pt-5 ${STUCK_BOTTOM} ${
        props.center === true ? 'justify-center' : 'justify-end'
      }`}
    >
      {props.children}
    </div>
  );
}
