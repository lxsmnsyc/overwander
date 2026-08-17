import {
  type JSX,
  type ParentProps,
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  onCleanup,
  onMount,
} from 'solid-js';
import { TooltipLayer } from './tooltip';

/**
 * A card that opens on hover: what a row is about, without opening it.
 *
 * It is the dialog's window shrunk to a card — the same blue bar, the
 * same frame — where `Tooltip` is a label. Reach for that one for a
 * name and a line; reach for this when the answer is a small screen of
 * its own, and keep anything that has to be pressed in the dialog the
 * row opens.
 *
 * Hand-rolled rather than built on terracotta: none of its components
 * is a hover card, and what makes one work is pointer geometry rather
 * than keyboard behaviour.
 */

/**
 * How long the pointer has to rest on the trigger before the card
 * opens, and how long it may be off both before the card goes. The
 * open wait keeps a card from firing at every row a pointer crosses
 */
const OPEN_DELAY = 180;
const CLOSE_DELAY = 140;

/**
 * How long the pointer may spend crossing the gap to the card before
 * the card gives up on it. Without this a pointer parked inside the
 * triangle holds the card open for as long as it sits there
 */
const CROSSING = 500;

/** The gap between the trigger and the card, and from the card to the
 * edge of the window */
const GAP = 8;
const MARGIN = 8;

/**
 * How much room the safe wedge is given around the pointer's way out.
 * It is what makes leaving the trigger sideways survivable
 */
const SLACK = 12;

export type HoverCardPlacement = 'top' | 'bottom';

export type HoverCardWidth = 'narrow' | 'wide';

const WIDTHS: Record<HoverCardWidth, string> = {
  narrow: 'w-[min(88vw,17rem)]',
  wide: 'w-[min(92vw,24rem)]',
};

const CARD =
  'pointer-events-auto fixed top-0 left-0 overflow-hidden rounded-panel border-4' +
  ' border-tide bg-paper text-left shadow-window';

/**
 * The two bars read as the window's own furniture rather than as rows
 * of the card, so both are centred — the same way the dialog titles
 * they are shrunk from are
 */
const BAR =
  'flex flex-col items-center gap-0.5 border-b-2 border-tide-dark bg-tide px-3 py-2' +
  ' text-center text-on-accent';

const BODY = 'flex flex-col gap-2 px-3 py-2.5 text-sm';

const FOOT =
  'flex flex-wrap items-center justify-center gap-2 border-t-2 border-line-soft' +
  ' bg-line-soft/60 px-3 py-2 text-center text-xs text-muted';

interface Point {
  x: number;
  y: number;
}

/**
 * Whether a point is inside a convex shape, by the sign of the
 * cross-product against each edge: inside means they all agree
 */
function within(point: Point, corners: Point[]): boolean {
  let negative = false;
  let positive = false;

  for (const [index, a] of corners.entries()) {
    const b = corners[(index + 1) % corners.length];
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);

    negative ||= cross < 0;
    positive ||= cross > 0;
  }
  return !(negative && positive);
}

/**
 * Where the card goes: centred on the trigger, on the asked-for side
 * unless there is no room for it there, and never off the window
 */
function place(anchor: DOMRect, card: DOMRect, wanted: HoverCardPlacement): Point {
  const above = anchor.top - card.height - GAP;
  const below = anchor.bottom + GAP;
  const fitsAbove = above >= MARGIN;
  const fitsBelow = below + card.height <= window.innerHeight - MARGIN;
  const room = window.innerWidth - card.width - MARGIN;
  const centred = anchor.left + anchor.width / 2 - card.width / 2;
  const x = Math.min(Math.max(centred, MARGIN), Math.max(room, MARGIN));

  // The side it asked for, unless that is the side with no room —
  // and if neither side has room, the side it asked for anyway
  if (wanted === 'top') {
    return { x, y: fitsAbove || !fitsBelow ? above : below };
  }
  return { x, y: fitsBelow || !fitsAbove ? below : above };
}

/**
 * Whether the focus landed inside a box. Focus leaving the trigger for
 * the card is not focus leaving the card
 */
function holds(box: HTMLElement | undefined, target: EventTarget | null): boolean {
  return target instanceof Node && box?.contains(target) === true;
}

export interface HoverCardProps extends ParentProps {
  /**
   * What is hovered. It is wrapped in a focusable span, so the card
   * opens to a keyboard as well as to a pointer
   */
  trigger: JSX.Element;
  /**
   * What the card is about, in the bar across the top. It names the
   * card to a screen reader
   */
  title: JSX.Element;
  /** A line under the title, still in the bar */
  description?: JSX.Element;
  /** The quieter bar along the bottom — where it is, what it costs */
  footer?: JSX.Element;
  /**
   * Which side the card prefers. It goes to the other one when there
   * is no room on this one
   */
  placement?: HoverCardPlacement;
  width?: HoverCardWidth;
  /** Room for how the trigger sits in its row */
  class?: string;
}

export default function HoverCard(props: HoverCardProps): JSX.Element {
  /** What the card is named by, since the title may be any markup */
  const titleId = createUniqueId();
  const [open, setOpen] = createSignal(false);
  /**
   * Where the card is, once it has been measured. Until then it is
   * rendered but not shown — a card cannot be placed before it has a
   * size, and a card placed at the corner first is a card that jumps
   */
  const [spot, setSpot] = createSignal<Point | null>(null);

  let trigger: HTMLSpanElement | undefined;
  let card: HTMLDivElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** The pointer's way in, while it is crossing the gap to the card */
  let crossing: (() => void) | undefined;

  const cancel = (): void => {
    if (timer != null) {
      clearTimeout(timer);
      timer = undefined;
    }
    crossing?.();
  };

  const show = (): void => {
    cancel();
    timer = setTimeout(() => {
      setOpen(true);
    }, OPEN_DELAY);
  };

  const hide = (delay = CLOSE_DELAY): void => {
    cancel();
    timer = setTimeout(() => {
      setOpen(false);
    }, delay);
  };

  /**
   * The safe triangle: the pointer's last spot on the trigger and the
   * two corners of the card's near edge. While the pointer stays
   * inside that wedge it is on its way to the card, so the card waits
   * — leaving a trigger diagonally is the one move a plain
   * mouse-leave gets wrong.
   *
   * A wedge rather than a true triangle: the apex is widened by
   * `SLACK` and set back behind the pointer, because at the apex
   * itself a triangle is one point wide and the first move sideways
   * would fall outside it
   */
  const cross = (from: Point): void => {
    if (card == null) {
      hide();
      return;
    }

    const rect = card.getBoundingClientRect();
    const above = rect.bottom <= from.y;
    const edge = above ? rect.bottom : rect.top;
    const back = above ? from.y + SLACK : from.y - SLACK;
    const safe: Point[] = [
      { x: from.x - SLACK, y: back },
      { x: from.x + SLACK, y: back },
      { x: rect.right, y: edge },
      { x: rect.left, y: edge },
    ];

    // Declared empty and filled in below: the watch and its deadline
    // each end the other, so whichever is written first has to be able
    // to name a teardown that does not exist yet
    let stop = (): void => {};

    const onMove = (event: PointerEvent): void => {
      if (!within({ x: event.clientX, y: event.clientY }, safe)) {
        stop();
        hide(0);
      }
    };
    const giveUp = setTimeout(() => {
      stop();
      hide(0);
    }, CROSSING);

    stop = (): void => {
      document.removeEventListener('pointermove', onMove);
      clearTimeout(giveUp);
      crossing = undefined;
    };

    document.addEventListener('pointermove', onMove);
    crossing = stop;
  };

  /**
   * A press anywhere else puts the card away. Whatever was pressed is
   * about to take over the screen — a dialog, usually — and a card
   * floating above the dialogs would sit on top of it and swallow the
   * next click. A press inside the card is the card's own business
   */
  const away = (event: PointerEvent): void => {
    if (holds(card, event.target)) {
      return;
    }
    cancel();
    setOpen(false);
  };

  onMount(() => {
    // Listened for whether or not the card is open: a press on the
    // trigger lands inside the wait before it opens, and a card that
    // arrived after the dialog it opened would be sitting on top of it
    document.addEventListener('pointerdown', away, true);
    onCleanup(() => {
      document.removeEventListener('pointerdown', away, true);
    });
  });

  /**
   * Placed once it is open, and again whenever the page moves under
   * it: the trigger is usually a row in a list that scrolls
   */
  createEffect(() => {
    if (!open()) {
      setSpot(null);
      return;
    }

    const put = (): void => {
      if (trigger != null && card != null) {
        setSpot(
          place(
            trigger.getBoundingClientRect(),
            card.getBoundingClientRect(),
            props.placement ?? 'top',
          ),
        );
      }
    };

    put();
    // Captured, so a scroll inside a dialog counts as well as the
    // window's own
    window.addEventListener('scroll', put, true);
    window.addEventListener('resize', put);
    onCleanup(() => {
      window.removeEventListener('scroll', put, true);
      window.removeEventListener('resize', put);
    });
  });

  onCleanup(cancel);

  return (
    <>
      <span
        ref={trigger}
        // Focusable, so the card is reachable without a pointer, and
        // described rather than labelled: the trigger already says
        // what it is
        tabIndex={0}
        // The caller's classes *replace* the default rather than
        // joining it: a trigger filling a grid cell has to say so, and
        // two display utilities in one list are settled by the order
        // Tailwind emits them in rather than by the order written here
        class={props.class ?? 'inline-flex'}
        onMouseEnter={show}
        onMouseLeave={(event) => {
          if (open()) {
            cross({ x: event.clientX, y: event.clientY });
          } else {
            hide();
          }
        }}
        onFocusIn={() => {
          // Only when the focus came from the keyboard. A press focuses
          // the trigger too, and that press has usually just opened
          // something the card would then be standing on top of
          if (trigger?.matches(':focus-visible') !== true) {
            return;
          }
          cancel();
          setOpen(true);
        }}
        onFocusOut={(event) => {
          if (!holds(card, event.relatedTarget)) {
            hide(0);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open()) {
            event.stopPropagation();
            cancel();
            setOpen(false);
          }
        }}
      >
        {props.trigger}
      </span>
      <Show when={open()}>
        {/* Drawn in the tooltip layer, which stands after the dialogs:
            a card opened from a row inside a dialog has to clear it */}
        <TooltipLayer>
          <div
            ref={card}
            role="dialog"
            aria-labelledby={titleId}
            class={`${CARD} ${WIDTHS[props.width ?? 'narrow']}`}
            style={{
              transform: `translate(${spot()?.x ?? 0}px, ${spot()?.y ?? 0}px)`,
              visibility: spot() == null ? 'hidden' : 'visible',
            }}
            onMouseEnter={cancel}
            onMouseLeave={() => {
              hide();
            }}
            onFocusOut={(event) => {
              if (!holds(card, event.relatedTarget) && !holds(trigger, event.relatedTarget)) {
                hide(0);
              }
            }}
          >
            <header class={BAR}>
              <strong id={titleId} class="text-sm font-extrabold tracking-tight">
                {props.title}
              </strong>
              <Show when={props.description}>
                {(said) => <span class="text-xs text-on-accent/85">{said()}</span>}
              </Show>
            </header>
            <div class={BODY}>{props.children}</div>
            <Show when={props.footer}>{(foot) => <footer class={FOOT}>{foot()}</footer>}</Show>
          </div>
        </TooltipLayer>
      </Show>
    </>
  );
}
