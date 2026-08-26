
/** Which side of the anchor a card is put on */
export type HoverCardPlacement = 'top' | 'bottom';

/** The gap between the trigger and the card, and from the card to the
 * edge of the window */
const GAP = 8;

const MARGIN = 8;

export interface Point {
  x: number;
  y: number;
}

/** How far apart two points are */
export function apart(one: Point, two: Point): number {
  return Math.hypot(one.x - two.x, one.y - two.y);
}

/**
 * Whether a point is inside a convex shape, by the sign of the
 * cross-product against each edge: inside means they all agree
 */
export function within(point: Point, corners: Point[]): boolean {
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
export function place(
  anchor: DOMRect,
  card: { width: number; height: number },
  wanted: HoverCardPlacement,
): Point {
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
export function holds(box: HTMLElement | undefined, target: EventTarget | null): boolean {
  return target instanceof Node && box?.contains(target) === true;
}
