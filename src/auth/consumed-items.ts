import type { Items } from '../data/ids/items';

/**
 * What one catch lost over the course of a battle. A berry eaten in a
 * raid is gone afterwards, the way it is in the mainline games, so the
 * fight reports what it ate and the server takes those items off the
 * catch record.
 *
 * It lives in its own module because both the battle side (which
 * collects it) and the privileged server (which acts on it) name the
 * shape, and neither should have to import the other.
 */
export default interface ConsumedItems {
  /**
   * The caught/{catchId} the unit was built from; a unit standing for
   * no record — the raid boss — never appears here
   */
  caught: string;
  /**
   * The items it lost, at most one copy of each
   */
  items: Items[];
}
