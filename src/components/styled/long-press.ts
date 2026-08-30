import { onCleanup } from 'solid-js';

/**
 * What something is, asked with a finger.
 *
 * A touch screen has no hover. The browser sends a mouse-enter after a
 * tap anyway, so a card that opens on hover opens on every press and
 * then sits over whatever the press was for. Holding is how a touch
 * asks about a thing rather than acting on it, and it is the gesture
 * both cards answer.
 */

/** How long a finger rests before it is asking rather than pressing */
export const LONG_PRESS = 500;

/**
 * How far it may drift while it rests, in pixels. A finger is never
 * still, and a scroll begins as a press that has not moved yet
 */
const SLOP = 10;

export interface LongPress {
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  onPointerCancel: (event: PointerEvent) => void;
  onContextMenu: (event: MouseEvent) => void;
}

/**
 * Swallow the click the lift is about to send. The hold was for the
 * card, so the row under it must not open as well
 */
function swallowPress(): void {
  const eat = (event: Event): void => {
    event.stopPropagation();
    event.preventDefault();
  };

  document.addEventListener('click', eat, { capture: true, once: true });
  // A finger that stays down sends no click, so the one-shot listener
  // has to be taken off again rather than waiting for a press elsewhere
  setTimeout(() => {
    document.removeEventListener('click', eat, true);
  }, LONG_PRESS);
}

/**
 * Handlers for a trigger that opens its card on a hold. Spread them
 * beside the hover handlers: the two never both fire, since these
 * ignore every pointer that is not a finger.
 */
export default function createLongPress(open: () => void): LongPress {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let from: { x: number; y: number } | null = null;
  /** Whether the pointer on it now is a finger, for the menu below */
  let touching = false;

  const cancel = (): void => {
    if (timer != null) {
      clearTimeout(timer);
      timer = undefined;
    }
    from = null;
  };

  onCleanup(cancel);

  return {
    onPointerDown: (event) => {
      touching = event.pointerType === 'touch';
      // A mouse has hover and a pen has its own reach; this is the
      // finger's way in and nobody else's
      if (!touching) {
        return;
      }
      cancel();
      from = { x: event.clientX, y: event.clientY };
      timer = setTimeout(() => {
        timer = undefined;
        open();
        swallowPress();
      }, LONG_PRESS);
    },
    onPointerMove: (event) => {
      if (from != null && Math.hypot(event.clientX - from.x, event.clientY - from.y) > SLOP) {
        cancel();
      }
    },
    onPointerUp: () => {
      cancel();
    },
    onPointerCancel: () => {
      cancel();
    },
    // Android raises its own menu on a hold, over the card the hold
    // was for. A right-click on a desktop still gets the browser's
    onContextMenu: (event) => {
      if (touching) {
        event.preventDefault();
      }
    },
  };
}
