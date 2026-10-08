/**
 * The counters a vendor may be standing behind. Which one he set up
 * is the window's roll, like the coat he turned up in
 */
const enum VendorKind {
  Medicine = 0,
  Vitamins = 1,
  Incenses = 2,
  BattleItems = 3,
  /**
   * Split off the medicine counter, which carried thirty kinds where
   * the others carry eight or nine. Six drawn out of thirty showed a
   * fifth of the shelf, so a player after a Dusk Ball and a player
   * after a Revive were both told to come back later
   */
  Balls = 4,
  /**
   * The machines, which nothing else sells: a gym hands one over, and
   * until now that was the whole of how a player came by them. His
   * crate is twice everybody else's, since the shelf holds one machine
   * per teachable move in the game and six off a shelf that long is
   * too thin a slice to plan a walk around
   */
  Moves = 5,
}

export { VendorKind };
export default VendorKind;
