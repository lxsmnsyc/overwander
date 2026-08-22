import {
  type JSX,
  type ParentProps,
  Suspense,
  children,
  createEffect,
  createSignal,
} from 'solid-js';
import { Portal, isServer } from 'solid-js/web';
import {
  DialogOverlay,
  DialogPanel,
  Dialog as HeadlessDialog,
  DialogDescription as HeadlessDialogDescription,
  DialogTitle as HeadlessDialogTitle,
  Transition,
  TransitionChild,
} from 'terracotta';
import FADE, { SHEER } from './transition';

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
 * The same trick split in two, for the top of the panel: the row
 * reaches past the panel's padding, and each thing inside it pays the
 * padding back for itself.
 *
 * It is two rows now rather than one — the heading, and the bar of
 * things that can be done under it — and only the heading is painted.
 * A single bleeding element cannot do that: the blue would either stop
 * short of the panel's edge or run under the transparent row below it
 */
const BLEED_OUT = '-mx-4 sm:-mx-5';
const PAD_IN = 'px-4 sm:px-5';

/**
 * The heading, held at the top while the rest of the dialog scrolls
 * under it. The catch sheet is several screens long, and its name and
 * the menu of things that can be done to the pokemon are what a player
 * scrolls back up for
 */
const STUCK_TOP = `sticky top-0 z-20 -mt-4 sm:-mt-5 ${BLEED_OUT}`;

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
   * Something to put beside the title, on the right.
   *
   * It is taken out of the flow rather than laid out next to the
   * heading, so the heading stays in the middle of the panel whatever
   * is standing to the right of it
   */
  aside?: JSX.Element;
  /**
   * And the same on the left. The pair of them is what a sheet showing
   * one of a run puts its "previous" and "next" in: they belong to the
   * panel rather than to anything in it, and the heading stays centred
   * between them
   */
  lead?: JSX.Element;
  /**
   * How the column under the heading is laid out, for a dialog that
   * wants something other than the default.
   *
   * It is one line of a stylesheet rather than a wrapper the caller
   * puts round its own children, because the sticky heading lives in
   * the same column: a dialog centring itself by wrapping what it
   * passes in would centre everything **except** its own title bar
   */
  class?: string;
  /**
   * A second bar under the heading, for what can be *done* to whatever
   * the dialog is showing.
   *
   * It is stuck to the top with the heading rather than scrolling
   * away, because the actions are what a long sheet is scrolled back
   * up for — and it carries no colour of its own, so it reads as a row
   * of buttons standing on the page rather than as a second header
   * competing with the first
   */
  bar?: JSX.Element;
}

/**
 * A dialog: the overlay behind it and the panel it is drawn on. It
 * opens with what it is and what it is for; the rest is the caller's
 */
export function Dialog(props: DialogProps): JSX.Element {
  /**
   * Whether the dialog is showing, which is the caller's answer until
   * something asks to close: then it goes false here first, the fade
   * runs, and `onClose` is what the end of the fade reports
   */
  const [showing, setShowing] = createSignal(props.isOpen);

  createEffect(() => {
    setShowing(props.isOpen);
  });

  /**
   * Whether the closing was this dialog's own doing — Escape, the
   * overlay, a button in it — rather than the caller having already
   * put it away
   */
  let asked = false;

  const close = (): void => {
    asked = true;
    setShowing(false);
  };

  /**
   * The caller hears about it once the fade is over, and only about a
   * close this dialog asked for. Dialogs on one screen share a single
   * "which is open" between them, so reporting a close the caller had
   * already made would put away whatever it opened instead
   */
  const reportClose = (): void => {
    if (asked) {
      asked = false;
      props.onClose();
    }
  };

  /**
   * The panel itself, held in a component of its own so that the
   * slots and the children resolve under the boundary below rather
   * than above it. A heading or an action bar that reads something
   * still loading would otherwise suspend the screen the dialog was
   * opened from
   */
  const Frame = (): JSX.Element => {
    /**
     * Each slot resolved **once**.
     *
     * A prop holding JSX is a getter, and every read of it builds what
     * it describes again: `props.bar == null ? null : <div>{props.bar}</div>`
     * reads it twice, which is two live components where the markup says
     * one. The second is what lands in the page and the first is left
     * running beside it — two sprite canvases on their own frame clocks,
     * two menus with their own idea of whether they are open, and a
     * button in the page whose component is the copy that was thrown
     * away. `children` keeps one of each
     */
    const lead = children(() => props.lead);
    const aside = children(() => props.aside);
    const bar = children(() => props.bar);

    return (
      <div class={`flex flex-col gap-3 ${INSET} ${props.class ?? ''}`}>
        {/* Both stuck rows travel together: a second `sticky` under
          the first would have to be told how tall the first is,
          and the heading is a line taller when it carries its
          sentence than when it does not */}
        <div class={props.quiet === true && bar() == null ? 'sr-only' : STUCK_TOP}>
          <header
            class={
              props.quiet === true
                ? 'sr-only'
                : `flex flex-col gap-1 border-b-2 border-tide-dark bg-tide pt-4 pb-3
                text-on-accent sm:pt-5 sm:pb-4 ${PAD_IN}`
            }
          >
            {/* A heading rather than bold text: it is what a screen
              reader announces the dialog by. It sits in the middle
              of the panel, and anything standing beside it is
              pinned to an edge rather than allowed to push it off
              centre */}
            <div class="relative flex min-h-8 items-center justify-center">
              {/* Back to ink: the bar is blue and its text is white,
                which a button standing on it would otherwise
                inherit — a white label on a white button */}
              {lead() == null ? null : <div class="absolute left-0 text-ink">{lead()}</div>}
              <HeadlessDialogTitle class="text-center text-lg font-extrabold tracking-tight">
                {props.title}
              </HeadlessDialogTitle>
              {aside() == null ? null : <div class="absolute right-0 text-ink">{aside()}</div>}
            </div>
            <HeadlessDialogDescription
              class={props.terse === true ? 'sr-only' : 'text-center text-sm text-on-accent/85'}
            >
              {props.description}
            </HeadlessDialogDescription>
          </header>
          {/* What can be done to whatever the dialog is showing,
            under the heading and stuck with it. It carries no
            fill of its own: it is a row of buttons standing on
            the page rather than a second header competing with
            the first */}
          {bar() == null ? null : (
            <div
              // To the right, where the rest of the game keeps what
              // it can do to a thing: the menu at the foot of a
              // dialog ends there too
              class={`flex flex-wrap items-center justify-end gap-2 bg-transparent pt-2
              ${PAD_IN}`}
            >
              {bar()}
            </div>
          )}
        </div>
        {props.children}
      </div>
    );
  };

  return (
    <Portal mount={portalHost()}>
      {/* This says *when* the dialog is there and nothing about how it
          looks getting there: the two `TransitionChild` wrappers below
          carry the fades. An animated wrapper here would multiply its
          opacity into theirs and unmount them the moment its own
          transition ended */}
      <Transition appear unmount show={showing()} afterLeave={reportClose}>
        <HeadlessDialog
          isOpen
          unmount={false}
          onClose={close}
          // A dialog on its way out is still in the page for as long
          // as the fade lasts. This is what tells the two apart, and
          // what the Escape handler counts dialogs by
          data-open={showing() ? '' : undefined}
          // And out of the way of the pointer: a dialog fading out
          // still covers the screen, and the page underneath has to
          // answer a hover the moment the dialog stops being one
          class={showing() ? undefined : 'pointer-events-none'}
        >
          {/* Dark in both themes, and dark enough to read as a page put
            away rather than a page tinted: the panel is white by day
            and needs the ground behind it to fall back */}
          <TransitionChild {...SHEER} class="fixed inset-0">
            <DialogOverlay class="size-full bg-shade/70 backdrop-blur-[1px]" />
          </TransitionChild>
          {/* This element is to trick the browser into centering the modal contents. */}
          <span class="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>
          {/* The wrapper is the panel: it is what is placed and what
              grows, and `DialogPanel` inside it is boxless, so the
              scale has nothing of its own to fight over.

              The boundary is here rather than around the dialog so a
              panel waiting on a read holds the overlay and the frame
              it was opened in. No fallback: the panel arrives when it
              has something to show */}
          <Suspense>
            <TransitionChild {...FADE} class={`${PANEL} ${WIDTHS[props.width ?? 'narrow']}`}>
              <DialogPanel class="contents">
                <Frame />
              </DialogPanel>
            </TransitionChild>
          </Suspense>
        </HeadlessDialog>
      </Transition>
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
      // One line, whatever is on it. Wrapped, a dialog with three
      // buttons dropped the last one — usually the way out — onto a
      // row of its own the moment the panel was a little narrow, which
      // reads as two bars rather than one and moves the button a
      // player reaches for without looking. It scrolls sideways
      // instead, the way the grunt's roster does
      class={`flex flex-nowrap items-center gap-2 overflow-x-auto border-t-2 border-line-soft pt-4
        sm:pt-5 ${STUCK_BOTTOM} ${props.center === true ? 'justify-center' : 'justify-end'}`}
    >
      {props.children}
    </div>
  );
}
