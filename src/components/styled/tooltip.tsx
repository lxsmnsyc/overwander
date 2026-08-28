import { type JSX, type ParentProps, Show, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { Transition } from 'terracotta';
import closeWhenGone from './gone';
import { usePortalHost } from './portal-host';
import { SHEER } from './transition';

/**
 * What a thing is, said where the pointer already is.
 *
 * An item or an ability is a name and one line about what it does, and
 * the line is the half worth reading — a bag showing thirty pictures
 * says nothing about any of them. The card is small on purpose: it
 * covers whatever it is over, so it should cover as little as it can.
 */

export interface TooltipProps {
  name: string;
  description: string;
  /**
   * One more box under the description, for a card whose subject has
   * a third thing worth saying. A thunk rather than markup: the card
   * is built when the pointer arrives, not when the trigger is drawn
   */
  extra?: () => JSX.Element;
  class?: string;
}

/**
 * How wide the card is allowed to be, in pixels. It also decides how
 * far from an edge the card can be placed, so it is a number rather
 * than a class
 */
const WIDTH = 240;

/**
 * How far above the thing it describes the card floats, and how much
 * room it needs up there before it gives up and drops below instead
 */
const GAP = 8;
const ROOM = 160;

/**
 * One labelled box: a word for what this is, and the thing itself in a
 * box of its own. Exported because a hover card says the same things
 * about an item in the same shape, only larger
 */
export function Detail(props: { label: string; children: JSX.Element }): JSX.Element {
  return (
    <div class="flex flex-col gap-0.5">
      <span class="text-[10px] font-bold tracking-wide text-muted uppercase">{props.label}</span>
      <span class="rounded-lg border border-line bg-paper px-1.5 py-0.5 text-xs text-ink">
        {props.children}
      </span>
    </div>
  );
}

/**
 * The card on its own, for a caller placing it itself
 */
export function Tooltip(props: TooltipProps): JSX.Element {
  return (
    <div
      role="tooltip"
      // The card's own transitions stay with it; the fade above ends on
      // the first one it hears
      style={{ 'max-width': `${WIDTH}px` }}
      class={`flex flex-col gap-1.5 rounded-panel border-2 border-line bg-line-soft p-1.5
        shadow-window ${props.class ?? ''}`}
    >
      <Detail label="Name">{props.name}</Detail>
      <Detail label="Description">{props.description}</Detail>
      {props.extra?.()}
    </div>
  );
}

/**
 * Anything else that floats over the page or over a dialog: a card
 * placed by its own caller rather than by `TooltipHost`
 */
export function TooltipLayer(props: ParentProps): JSX.Element {
  const host = usePortalHost();

  return <Portal mount={host()}>{props.children}</Portal>;
}

export interface TooltipHostProps extends ParentProps, TooltipProps {
  /**
   * What the wrapper itself is. It has to be a box of its own rather
   * than `display: contents`, since where the card goes is measured
   * from it
   */
  class?: string;
}

/**
 * Something with a card over it while the pointer or the keyboard is
 * on it. The card is portalled out because the things that carry one —
 * a square in the bag, a row in a dialog — sit in panels that scroll
 * and clip
 */
export function TooltipHost(props: TooltipHostProps): JSX.Element {
  let host: HTMLSpanElement | undefined;
  const drawnIn = usePortalHost();
  const [at, setAt] = createSignal<{ x: number; y: number; below: boolean } | null>(null);
  /**
   * Whether the card is wanted, which is not the same as whether it is
   * on screen: it is still there, fading, for a moment after the
   * pointer has gone. Where it goes is forgotten only once that is over
   */
  const [wanted, setWanted] = createSignal(false);

  const show = (): void => {
    const bounds = host?.getBoundingClientRect();

    if (bounds == null) {
      return;
    }

    const below = bounds.top < ROOM;
    // Kept off both edges, so a square in the first column does not
    // hang the card half off the screen
    const x = Math.min(
      Math.max(bounds.left + bounds.width / 2, WIDTH / 2 + GAP),
      globalThis.innerWidth - WIDTH / 2 - GAP,
    );

    setAt({ x, y: below ? bounds.bottom + GAP : bounds.top - GAP, below });
    setWanted(true);
  };

  const hide = (): void => {
    setWanted(false);
  };

  // The label goes with what it labels, the same as a hover card does
  closeWhenGone(() => host, wanted, hide);

  return (
    <span
      ref={host}
      class={props.class ?? 'inline-flex'}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusIn={show}
      onFocusOut={hide}
    >
      {props.children}
      {/* The portal stands outside the fade rather than inside it: the
          card is drawn somewhere else in the document, where an opacity
          set on an ancestor here would never reach it */}
      <Show when={at()} keyed>
        {(spot) => (
          <Portal mount={drawnIn()}>
            <Transition
              show={wanted()}
              {...SHEER}
              // Once it has faded out there is nowhere for it to be
              afterLeave={() => {
                setAt(null);
              }}
              // Read out only while it is wanted: one fading out and
              // the next arriving are two labels for one thing
              aria-hidden={wanted() ? undefined : 'true'}
              // Nothing to click: the card is a label, and a pointer
              // that landed on it would leave whatever it describes
              class={`pointer-events-none fixed z-50 -translate-x-1/2 ${
                spot.below ? '' : '-translate-y-full'
              }`}
              style={{ left: `${spot.x}px`, top: `${spot.y}px` }}
            >
              <Tooltip name={props.name} description={props.description} extra={props.extra} />
            </Transition>
          </Portal>
        )}
      </Show>
    </span>
  );
}
