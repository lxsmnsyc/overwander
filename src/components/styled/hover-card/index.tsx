import { type JSX, type ParentProps, Show, createContext, createEffect, createSignal, createUniqueId, onCleanup, onMount, useContext } from 'solid-js';

import { Transition } from 'terracotta';
import closeWhenGone from '../gone';
import { TooltipLayer } from '../tooltip';
import { SHEER } from '../transition';
import { type HoverCardPlacement, type Point, apart, holds, place, within } from './placing';
import { GRACE, LINGER, type SafeShape, painting, showSafeAreas } from './safe-area';

export type { HoverCardPlacement };
export { showSafeAreas };

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

export type HoverCardWidth = 'narrow' | 'wide';

const WIDTHS: Record<HoverCardWidth, string> = {
  narrow: 'w-[min(88vw,17rem)]',
  wide: 'w-[min(92vw,24rem)]',
};

const CARD =
  'pointer-events-auto overflow-hidden rounded-panel border-4' +
  ' border-tide bg-paper text-left shadow-window';

/**
 * The box the card is placed in, which is **outside** the fade.
 *
 * A transform on an ancestor becomes the containing block for
 * anything fixed inside it, and the fade scales what it wraps — so a
 * card fixed under it was placed against the fade's own box instead
 * of the window, a whole viewport down the page
 */
const PLACED = 'pointer-events-none fixed top-0 left-0';

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

/**
 * What a card offers whatever is inside it: a way to shut itself, and
 * a way to keep it open.
 *
 * A card opened from inside another card is a portal of its own, so
 * moving the pointer into it *leaves* the card it came from — which
 * would take both down. The inner one holds the outer one open for as
 * long as it is up, and lets go when it closes
 */
interface CardHold {
  hold: () => void;
  release: () => void;
  close: () => void;
}

const Holding = createContext<CardHold>();

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
  /**
   * The quieter bar along the bottom — where it is, what it costs.
   * Written as a function where what stands there has to put the card
   * away, since a button inside a card is the one press that does not
   */
  footer?: JSX.Element | ((close: () => void) => JSX.Element);
  /**
   * Which side the card prefers. It goes to the other one when there
   * is no room on this one
   */
  placement?: HoverCardPlacement;
  width?: HoverCardWidth;
  /** Room for how the trigger sits in its row */
  class?: string;
  /**
   * Whether a press on the trigger leaves the card up. For a trigger
   * whose press acts in place (buying from a crate, claiming a gift)
   * rather than opening a window the card would then stand on top of
   */
  stayOnPress?: boolean;
}

export default function HoverCard(props: HoverCardProps): JSX.Element {
  /** What the card is named by, since the title may be any markup */
  const titleId = createUniqueId();
  /** The card this one was opened from, if it was opened from one */
  const outer = useContext(Holding);
  /** How many cards opened from inside this one are still up */
  let inner = 0;
  const [open, setOpen] = createSignal(false);
  /**
   * Where the card is, once it has been measured. Until then it is
   * rendered but not shown — a card cannot be placed before it has a
   * size, and a card placed at the corner first is a card that jumps
   */
  const [spot, setSpot] = createSignal<Point | null>(null);
  /**
   * Whether the card is on screen at all, which lasts past `open` by
   * the length of the fade. The portal is what it gates: a portal
   * inside the fade is content drawn somewhere else, where an opacity
   * set out here never reaches it
   */
  const [present, setPresent] = createSignal(false);
  /** Dev-only: the triangle on screen, if one is being drawn */
  const [shape, setShape] = createSignal<SafeShape | null>(null);
  let fading: ReturnType<typeof setTimeout> | undefined;

  /**
   * Dev-only: put a triangle on screen, or take the last one down. A
   * failed triangle is held for a moment — the card it belonged to has
   * already gone, and it is the drawing worth reading
   */
  const drawSafeArea = (drawn: SafeShape | null): void => {
    if (!import.meta.env.DEV) {
      return;
    }
    if (fading != null) {
      clearTimeout(fading);
      fading = undefined;
    }
    setShape(drawn);
    if (drawn != null && !drawn.live) {
      fading = setTimeout(() => {
        setShape(null);
      }, LINGER);
    }
  };

  let trigger: HTMLSpanElement | undefined;
  /**
   * The card element, as a signal rather than a plain ref: it is what
   * the placement is measured from, and a signal is what lets the
   * measuring wait for the element to exist instead of guessing when
   * it does
   */
  const [card, setCard] = createSignal<HTMLDivElement>();
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
      // A card with one of its own open stays: the pointer is in the
      // card it opened, which is not this one's box but is this one's
      // business
      if (inner === 0) {
        setOpen(false);
      }
    }, delay);
  };

  /**
   * What to do once the last card opened from inside this one has
   * gone. Closing on the spot is wrong — a card usually goes because
   * what it was about has just been acted on, and the pointer is still
   * on the card that offered it — so this waits for the pointer to say
   * where it is and closes only if the answer is somewhere else
   */
  const settle = (): void => {
    const check = (event: PointerEvent): void => {
      if (holds(card(), event.target) || holds(trigger, event.target)) {
        return;
      }
      document.removeEventListener('pointermove', check);
      hide(0);
    };

    document.addEventListener('pointermove', check);
    onCleanup(() => {
      document.removeEventListener('pointermove', check);
    });
  };

  const holding: CardHold = {
    hold: () => {
      inner += 1;
      cancel();
    },
    release: () => {
      inner = Math.max(0, inner - 1);
      if (inner === 0) {
        settle();
      }
    },
    close: () => {
      cancel();
      setOpen(false);
    },
  };

  /**
   * The safe triangle: the pointer's last spot on the trigger and the
   * two corners of the card's near edge. While the pointer stays
   * inside it the pointer is on its way to the card, so the card waits
   * — leaving a trigger diagonally is the one move a plain
   * mouse-leave gets wrong.
   *
   * The apex is exactly where the pointer left, and `GRACE` around it
   * is what keeps the first reported move — which lands beside the way
   * out rather than along it — from reading as having left
   */
  const cross = (from: Point): void => {
    const box = card();

    if (box == null) {
      hide();
      return;
    }

    const rect = box.getBoundingClientRect();
    const above = rect.bottom <= from.y;
    const edge = above ? rect.bottom : rect.top;
    const safe: Point[] = [from, { x: rect.right, y: edge }, { x: rect.left, y: edge }];

    drawSafeArea({ corners: safe, live: true, at: null });

    // Declared empty and filled in below: each of the watches ends the
    // others, so whichever is written first has to be able to name a
    // teardown that does not exist yet
    let stop = (): void => {};

    /**
     * Nothing hurries the pointer along: the card waits for as long as
     * it stays inside the triangle, however slowly it crosses or however
     * long it rests there. It is only leaving the triangle that closes it
     */
    const onMove = (event: PointerEvent): void => {
      const at = { x: event.clientX, y: event.clientY };

      if (!within(at, safe) && apart(at, from) > GRACE) {
        stop();
        // Drawn again after the teardown cleared it, this time as the
        // triangle that failed and the point it failed at
        drawSafeArea({ corners: safe, live: false, at });
        hide(0);
      }
    };

    /**
     * A pointer that has left the window is not on its way anywhere.
     * Without this the triangle is held by the last place the pointer was
     * seen, and the card sits there until something else takes it down
     */
    const onOut = (event: PointerEvent): void => {
      if (event.relatedTarget == null) {
        stop();
        drawSafeArea({ corners: safe, live: false, at: null });
        hide(0);
      }
    };

    stop = (): void => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onOut);
      crossing = undefined;
      drawSafeArea(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerout', onOut);
    crossing = stop;
  };

  /**
   * A press anywhere else puts the card away. Whatever was pressed is
   * about to take over the screen — a dialog, usually — and a card
   * floating above the dialogs would sit on top of it and swallow the
   * next click. A press inside the card is the card's own business
   */
  const away = (event: PointerEvent): void => {
    // A press inside a card this one opened is that card's business —
    // the Take button on a held item is a press in another portal
    // entirely, and reading it as "elsewhere" shut both windows
    if (inner > 0 || holds(card(), event.target)) {
      return;
    }
    // A press on the trigger itself acts in place where the caller
    // says so, and the card is how the next press is decided
    if (props.stayOnPress === true && holds(trigger, event.target)) {
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
    const box = card();

    // Where it is stands until the card has finished fading out —
    // cleared on the way in, it would vanish instead of fading
    if (!open() || box == null) {
      return;
    }

    const put = (): void => {
      if (trigger != null) {
        // The card's laid-out size rather than its drawn one: it is
        // scaled while the fade runs, and a box measured mid-fade is
        // half the box it is about to be
        setSpot(
          place(
            trigger.getBoundingClientRect(),
            { width: box.offsetWidth, height: box.offsetHeight },
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

  // The card goes with what it is about: a trigger taken out of the
  // page sends no mouse-leave
  closeWhenGone(
    () => trigger,
    open,
    () => {
      cancel();
      setOpen(false);
    },
  );

  /**
   * What the bottom bar comes to. A caller that needs to put the card
   * away writes a function and is handed the way to do it
   */
  const standing = (foot: NonNullable<HoverCardProps['footer']>): JSX.Element =>
    typeof foot === 'function' ? foot(holding.close) : foot;

  /**
   * While this card is up, the card it was opened from stays up: the
   * pointer being in here is the reason that one is still wanted
   */
  createEffect(() => {
    if (!open() || outer == null) {
      return;
    }
    outer.hold();
    onCleanup(outer.release);
  });

  /** Opening puts the card on screen; the fade decides when it leaves */
  createEffect(() => {
    if (open()) {
      setPresent(true);
    }
  });

  onCleanup(() => {
    cancel();
    drawSafeArea(null);
  });

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
          // The pointer outranks the focus: a dialog opening moves the
          // focus off whatever the pointer is resting on, and a card
          // that read that as "the pointer left" never opened at all
          if (holds(card(), event.relatedTarget) || trigger?.matches(':hover') === true) {
            return;
          }
          hide(0);
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
      <Show when={present()}>
        {/* Drawn in the tooltip layer, which stands after the dialogs:
            a card opened from a row inside a dialog has to clear it */}
        <TooltipLayer>
          <div
            class={PLACED}
            style={{
              transform: `translate(${spot()?.x ?? 0}px, ${spot()?.y ?? 0}px)`,
              visibility: spot() == null ? 'hidden' : 'visible',
            }}
          >
            <Transition
              show={open()}
              {...SHEER}
              afterLeave={() => {
                setPresent(false);
                setSpot(null);
              }}
            >
              <div
                ref={(element) => {
                  setCard(element);
                }}
                role="dialog"
                aria-labelledby={titleId}
                // Nothing to press or read while it fades: a card on its
                // way out would otherwise swallow the click that follows
                aria-hidden={open() ? undefined : 'true'}
                class={`${CARD} ${WIDTHS[props.width ?? 'narrow']} ${
                  open() ? '' : 'pointer-events-none'
                }`}
                onMouseEnter={cancel}
                onMouseLeave={() => {
                  hide();
                }}
                onFocusOut={(event) => {
                  // The pointer outranks the focus here too: a button
                  // that spends (Buy, Use) disables itself while the
                  // trade runs, which drops the focus to the body. The
                  // pointer is still resting on the card, so it stays
                  if (
                    !holds(card(), event.relatedTarget) &&
                    !holds(trigger, event.relatedTarget) &&
                    card()?.matches(':hover') !== true
                  ) {
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
                <Holding.Provider value={holding}>
                  <div class={BODY}>{props.children}</div>
                  <Show when={props.footer}>
                    {(foot) => <footer class={FOOT}>{standing(foot())}</footer>}
                  </Show>
                </Holding.Provider>
              </div>
            </Transition>
          </div>
        </TooltipLayer>
      </Show>
      {/* Dev-only: the triangle the pointer is being measured against,
          drawn in window coordinates because that is what it is in. It
          stands outside the card's own branch so that a triangle which
          has just failed is still there once the card has gone.
          `import.meta.env.DEV` is what keeps all of it out of a build */}
      <Show when={import.meta.env.DEV && painting() ? shape() : null}>
        {(drawn) => (
          <TooltipLayer>
            <svg
              aria-hidden="true"
              class="pointer-events-none fixed inset-0 h-full w-full overflow-visible"
            >
              <polygon
                points={drawn()
                  .corners.map((corner) => `${corner.x},${corner.y}`)
                  .join(' ')}
                class={drawn().live ? 'fill-leaf/15 stroke-leaf' : 'fill-ember/20 stroke-ember'}
                stroke-width="2"
                stroke-dasharray="6 4"
              />
              {/* The apex — where the pointer actually left — and the
                  grace around it, which is the rest of what counts as
                  still being on the way */}
              <circle
                cx={drawn().corners[0].x}
                cy={drawn().corners[0].y}
                r={GRACE}
                class={drawn().live ? 'fill-leaf/15 stroke-leaf' : 'fill-ember/20 stroke-ember'}
                stroke-width="1"
                stroke-dasharray="3 3"
              />
              <circle
                cx={drawn().corners[0].x}
                cy={drawn().corners[0].y}
                r="3"
                class={drawn().live ? 'fill-leaf' : 'fill-ember'}
              />
              <Show when={drawn().at}>
                {(at) => (
                  <circle
                    cx={at().x}
                    cy={at().y}
                    r="5"
                    class="fill-ember stroke-on-accent"
                    stroke-width="2"
                  />
                )}
              </Show>
            </svg>
          </TooltipLayer>
        )}
      </Show>
    </>
  );
}
