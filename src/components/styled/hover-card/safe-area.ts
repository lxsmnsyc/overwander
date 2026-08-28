import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import type { Point } from './placing';

/**
 * Where the answer to "why did the card close" is remembered. Chasing
 * a triangle takes more than one reload, so the choice outlives the page
 */
export const SAFE_AREA_KEY = 'hover-card:safe-area';

/**
 * How long a triangle that has just failed stays on screen. The card goes
 * with the failure, so without this the one drawing worth seeing is
 * the one that is never seen
 */
export const LINGER = 1200;

/**
 * A triangle as it is drawn: green while the pointer is still inside it,
 * red where it left, with `at` marking the point that failed
 */
export interface SafeShape {
  corners: Point[];
  live: boolean;
  at: Point | null;
}

/**
 * Whether the safe triangles are painted. It is a development tool: every
 * use of it is behind `import.meta.env.DEV`, so the build drops the
 * drawing along with this signal
 */
export const [painting, setPainting] = createSignal(false);

/**
 * Dev-only: paint each card's safe triangle while the pointer is crossing
 * to it, so a card that closes too early shows why. Also on `window`
 * as `hoverCardSafeAreas()`, which is where it is actually reached
 * from — a triangle is something to look at rather than something to
 * write a call for
 */
export function showSafeAreas(on = true): void {
  if (!import.meta.env.DEV) {
    return;
  }
  setPainting(on);
  try {
    localStorage.setItem(SAFE_AREA_KEY, on ? '1' : '');
  } catch {
    // A browser refusing storage still gets the triangles this session
  }
}

if (import.meta.env.DEV && !isServer) {
  try {
    setPainting(localStorage.getItem(SAFE_AREA_KEY) === '1');
  } catch {
    // Nothing remembered means nothing painted
  }
  window.hoverCardSafeAreas = showSafeAreas;
}
