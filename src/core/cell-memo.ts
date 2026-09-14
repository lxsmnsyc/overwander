/**
 * Answers per world cell, kept for roughly the cells a walk has just crossed.
 *
 * Two generations rather than one capped map: when the young one fills it
 * becomes the old one, so the board in view survives the turnover instead of
 * every cell under it being worked out again in the same step.
 */

/** How many cells one generation holds before it is set aside */
const GENERATION = 1 << 16;

/** Wider than the world is in cells either way, so no two cells share a key */
const SPAN = 1 << 22;

export default class CellMemo<V> {
  private young = new Map<number, V>();
  private old = new Map<number, V>();

  get(x: number, y: number): V | undefined {
    const key = x * SPAN + y;
    const known = this.young.get(key);

    if (known !== undefined) {
      return known;
    }

    const aged = this.old.get(key);

    // Still in use, so it is carried into the generation that stays
    if (aged !== undefined) {
      this.keep(key, aged);
    }
    return aged;
  }

  set(x: number, y: number, value: V): void {
    this.keep(x * SPAN + y, value);
  }

  private keep(key: number, value: V): void {
    if (this.young.size >= GENERATION) {
      this.old = this.young;
      this.young = new Map();
    }
    this.young.set(key, value);
  }
}
