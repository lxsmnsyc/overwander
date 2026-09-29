/** Which side of the anchor a card is put on */
export type HoverCardPlacement = 'top' | 'bottom';

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
 * Whether the focus landed inside a box. Focus leaving the trigger for
 * the card is not focus leaving the card
 */
export function holds(box: HTMLElement | undefined, target: EventTarget | null): boolean {
  return target instanceof Node && box?.contains(target) === true;
}
