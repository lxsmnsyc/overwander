/**
 * The parts of the player's own profile, named so somebody else can
 * open it at one.
 *
 * They live here rather than in the panel because a notice about a
 * trade has to say *trades* without importing the panel that draws
 * them, which imports the game context the notice is read from
 */
const enum ProfileSection {
  Battles = 0,
  Friends = 1,
  Requests = 2,
  Bids = 3,
  Trades = 4,
  Awards = 5,
  Selling = 6,
}

export default ProfileSection;
