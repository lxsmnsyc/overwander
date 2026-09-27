import {
  type JSX,
  type ParentProps,
  Show,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import { arrow, autoUpdate, flip, offset, shift, useFloating } from 'solid-floating-ui';
import { Transition } from 'terracotta';
import closeWhenGone from './gone';
import { holds } from './hover-card/placing';
import { CLOSE_DELAY, OPEN_DELAY } from './hover-delay';
import createLongPress from './long-press';
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

/** What kind of thing a tooltip names, which picks the chip beside the name */
export type TooltipKind = 'item' | 'candy' | 'type' | 'weather' | 'ability' | 'status';

const KIND_CHIPS: Record<TooltipKind, { label: string; tone: string }> = {
  item: { label: 'Item', tone: 'bg-leaf-soft text-leaf-dark' },
  candy: { label: 'Candy', tone: 'bg-leaf-soft text-leaf-dark' },
  type: { label: 'Type', tone: 'bg-ember-soft text-ember-dark' },
  weather: { label: 'Weather', tone: 'bg-gold-soft text-gold' },
  ability: { label: 'Ability', tone: 'bg-tide-soft text-tide-dark' },
  status: { label: 'Status', tone: 'bg-line-soft text-arcane' },
};

export interface TooltipProps {
  name: string;
  kind?: TooltipKind;
  /**
   * The line worth reading, where the subject has one. A picture whose
   * card is entirely made of other pictures leaves it out
   */
  description?: string;
  /**
   * One more box under the description, for a card whose subject has
   * a third thing worth saying. A thunk rather than markup: the card
   * is built when the pointer arrives, not when the trigger is drawn
   */
  extra?: () => JSX.Element;
  class?: string;
}

/**
 * How wide the card is allowed to be, in pixels
 */
const WIDTH = 240;

/** How far the card keeps from the screen's edges, for Floating UI's flip and shift */
const GAP = 8;

/**
 * How far the notch's tip stands from the pointer: close above it, and
 * further below, where the cursor itself hangs
 */
const ABOVE_POINTER = 10;
const BELOW_POINTER = 26;

/** How far the notch keeps from the card's rounded corners, for Floating UI's arrow */
const NOTCH_INSET = 16;

/**
 * Inside a tooltip a detail is a row, label left and value right; in a
 * hover card it keeps its labelled box
 */
const DetailRows = createContext(false);

/** Draws every `Detail` inside it as a row */
export function DetailRowsProvider(props: ParentProps): JSX.Element {
  return <DetailRows.Provider value>{props.children}</DetailRows.Provider>;
}

/**
 * One labelled fact. Exported because a hover card says the same things
 * about an item, and the same extras are drawn in both
 */
export function Detail(props: { label: string; children: JSX.Element }): JSX.Element {
  const rows = useContext(DetailRows);

  return (
    <Show
      when={rows}
      fallback={
        <div class="flex flex-col gap-0.5">
          <span class="text-[10px] font-bold tracking-wide text-muted uppercase">
            {props.label}
          </span>
          <span class="rounded-lg border border-line bg-paper px-1.5 py-0.5 text-xs text-ink">
            {props.children}
          </span>
        </div>
      }
    >
      <div class="flex items-center justify-between gap-3">
        <span class="shrink-0 font-semibold text-muted">{props.label}</span>
        <span class="flex min-w-0 justify-end text-right font-bold text-ink tabular-nums">
          {props.children}
        </span>
      </div>
    </Show>
  );
}

/** Which way the notch points, where Floating UI put it, and its element */
export interface TooltipNotch {
  below: boolean;
  x: number | undefined;
  ref: (element: HTMLSpanElement) => void;
}

/**
 * The card on its own, for a caller placing it itself. The notch is
 * drawn only when the caller says where the thing it points at is
 */
export function Tooltip(props: TooltipProps & { notch?: TooltipNotch }): JSX.Element {
  const chip = (): { label: string; tone: string } | null =>
    props.kind == null ? null : KIND_CHIPS[props.kind];

  return (
    <div
      role="tooltip"
      style={{ 'max-width': `${WIDTH}px` }}
      class={`relative flex w-max flex-col gap-1.5 rounded-xl border-2 border-line bg-paper px-3
        pt-2 pb-2.5 text-ink shadow-[0_3px_0_0_var(--drop),0_16px_28px_-14px_var(--drop-cast)] ${
          props.class ?? ''
        }`}
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-extrabold">{props.name}</span>
        <Show when={chip()}>
          {(shown) => (
            <span
              class={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold
                tracking-wide uppercase ${shown().tone}`}
            >
              {shown().label}
            </span>
          )}
        </Show>
      </div>
      <Show when={props.description}>
        {(line) => <p class="m-0 text-xs leading-snug text-muted">{line()}</p>}
      </Show>
      <Show when={props.extra}>
        {(extra) => (
          <DetailRows.Provider value>
            {/* Emptied by an extra with nothing to say, so the panel goes with it */}
            <div class="grid gap-1 rounded-lg bg-line-soft px-2 py-1.5 text-xs empty:hidden">
              {extra()()}
            </div>
          </DetailRows.Provider>
        )}
      </Show>
      <Show when={props.notch}>
        {(notch) => (
          <span
            ref={notch().ref}
            aria-hidden="true"
            class={`absolute size-3 rotate-45 border-line bg-paper ${
              notch().below
                ? '-top-[7px] border-t-2 border-l-2'
                : '-bottom-[7px] border-r-2 border-b-2'
            }`}
            style={{ left: notch().x == null ? 'calc(50% - 6px)' : `${notch().x}px` }}
          />
        )}
      </Show>
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
  /**
   * Whether the card is wanted, which is not the same as whether it is
   * on screen: it is still there, fading, for a moment after the
   * pointer has gone
   */
  const [wanted, setWanted] = createSignal(false);
  /** Whether the card is mounted, which lasts past `wanted` by the fade */
  const [present, setPresent] = createSignal(false);
  const [notch, setNotch] = createSignal<HTMLSpanElement | null>(null);
  const floating = useFloating({
    get open() {
      return wanted();
    },
    placement: 'top',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      // Below the pointer it has to clear the cursor hanging off it
      offset(({ placement }) => (placement.startsWith('bottom') ? BELOW_POINTER : ABOVE_POINTER)),
      flip({ padding: GAP }),
      shift({ padding: GAP }),
      arrow({ element: notch, padding: NOTCH_INSET }),
    ],
  });
  /**
   * The wait, whichever way it is going. One handle for both, since a
   * pointer that comes back before the card has gone is cancelling a
   * close rather than queueing an open behind it
   */
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = (): void => {
    if (timer != null) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  onCleanup(cancel);

  /**
   * Point the card at the mouse, or back at the trigger for a keyboard
   * or a finger. The point is a zero-size box, which is all Floating UI
   * needs to aim at
   */
  const aimAt = (point: { x: number; y: number } | null): void => {
    floating.refs.setPositionReference(
      point == null
        ? null
        : {
            getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0),
          },
    );
  };

  const open = (): void => {
    setPresent(true);
    setWanted(true);
  };

  const show = (): void => {
    cancel();
    timer = setTimeout(open, OPEN_DELAY);
  };

  const hide = (delay = CLOSE_DELAY): void => {
    cancel();
    timer = setTimeout(() => {
      setWanted(false);
    }, delay);
  };

  /**
   * A finger has nowhere to move the card off to, so the next press
   * somewhere else is what takes it down. Listened for only while the
   * card is up: a bag of thirty squares is thirty of these
   */
  createEffect(() => {
    if (!wanted()) {
      return;
    }

    const away = (event: PointerEvent): void => {
      if (!holds(host, event.target)) {
        hide(0);
      }
    };

    document.addEventListener('pointerdown', away, true);
    onCleanup(() => {
      document.removeEventListener('pointerdown', away, true);
    });
  });

  /** The touch's way in: hold to ask, rather than hover to ask */
  const held = createLongPress(() => {
    cancel();
    aimAt(null);
    open();
  });

  // The label goes with what it labels, the same as a hover card does,
  // and a label whose subject has left the page goes at once
  closeWhenGone(
    () => host,
    wanted,
    () => {
      hide(0);
    },
  );

  return (
    <span
      ref={(element) => {
        host = element;
        floating.refs.setReference(element);
      }}
      // Nothing to select: a hold on the trigger is asking about it,
      // and a phone that answers by selecting the word instead has
      // put a text caret over the card
      class={`select-none ${props.class ?? 'inline-flex'}`}
      {...held}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') {
          aimAt({ x: event.clientX, y: event.clientY });
          show();
        }
      }}
      // The card follows the mouse for as long as it is over the trigger
      onPointerMove={(event) => {
        if (event.pointerType !== 'touch') {
          aimAt({ x: event.clientX, y: event.clientY });
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') {
          hide();
        }
      }}
      // A keyboard waits for neither: tabbing to something is
      // deliberate in a way that crossing it with a pointer is not.
      // Only the keyboard, though: a press focuses what is inside too,
      // and on a touch screen that press was for the button rather
      // than for the label over it
      onFocusIn={(event) => {
        if (!(event.target instanceof Element) || !event.target.matches(':focus-visible')) {
          return;
        }
        cancel();
        aimAt(null);
        open();
      }}
      onFocusOut={() => {
        hide(0);
      }}
    >
      {props.children}
      {/* The portal stands outside the fade rather than inside it: the
          card is drawn somewhere else in the document, where an opacity
          set on an ancestor here would never reach it */}
      <Show when={present()}>
        <Portal mount={drawnIn()}>
          {/* Placed outside the fade, so the fade never moves what is placed */}
          <div
            ref={(element) => {
              floating.refs.setFloating(element);
            }}
            // Nothing to click: the card is a label, and a pointer that
            // landed on it would leave whatever it describes
            class="pointer-events-none z-50"
            style={floating.floatingStyles}
          >
            <Transition
              show={wanted()}
              {...SHEER}
              // Once it has faded out there is nowhere for it to be
              afterLeave={() => {
                setPresent(false);
              }}
              // Read out only while it is wanted: one fading out and
              // the next arriving are two labels for one thing
              aria-hidden={wanted() ? undefined : 'true'}
            >
              <Tooltip
                name={props.name}
                kind={props.kind}
                description={props.description}
                extra={props.extra}
                notch={{
                  below: floating.placement.startsWith('bottom'),
                  x: floating.middlewareData.arrow?.x,
                  ref: (element) => {
                    setNotch(element);
                  },
                }}
              />
            </Transition>
          </div>
        </Portal>
      </Show>
    </span>
  );
}
