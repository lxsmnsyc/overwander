/**
 * Interactive overworld points a chunk can host
 */
const enum Landmark {
  /**
   * A hidden item stash rolled from the item pool
   */
  ItemCache = 0,
  // 1 was the phenomenon, which is no longer a landmark: something
  // happening is rolled over the chunk's free ground by the hour
  // rather than pinned to a cell forever. The number is left unused
  // so the rest keep theirs
  /**
   * A legendary's lair: the place it lives rather than the pokemon
   * itself. Which lairs a chunk can hold comes from its biome, and
   * the lair decides which legendary is at home there
   */
  LegendaryLair = 2,
  /**
   * A lair with something wrong in it. It stages one of the biome's
   * own lairs where there is one, and otherwise a rare local species
   * standing in a lair of no particular name — always a shadow boss
   */
  ShadowLair = 3,
  /**
   * A patch of berries, ripe once per landmark window
   */
  BerryPatch = 4,
  /**
   * A nest: somewhere a species of the biome leaves an egg. It holds
   * one for half a day rather than a quarter hour, so finding one is
   * worth walking to
   */
  Nest = 5,
  /**
   * A spot people pass through: which of them is standing there
   * changes every 3 hours, and each has their own business with a
   * player who stops — including the Team Rocket grunt, who bars the
   * cell and fights whoever accepts
   */
  WanderingNpc = 6,
  /**
   * A way through to somewhere else. It does nothing on its own — a
   * Portal Key is what opens one — and where it goes is another portal
   * of the biome the traveller names, which is what makes the network
   * a network rather than a teleport
   */
  Portal = 7,
  /**
   * A Team Rocket stop: a grunt bars the cell for the window and
   * fights whoever accepts, with shadows of the biome's own. Once in
   * a long while it is Giovanni himself, and his six are another
   * matter entirely
   */
  TeamRocket = 8,
  /**
   * A trainer after a fair duel: the biome's own against whatever the
   * player brings, purse on a win, nothing dropped and nothing
   * shadowed. The challenge is the player's to accept
   */
  Trainer = 9,
  /**
   * A gym: one of the region's 8 leaders, fixed to the spot, with a
   * full 6 of their own type at level 50. Beating them earns their
   * signature badge, once, on top of the purse
   */
  GymLeader = 10,
  /**
   * One of the region's Elite Four, 6 of their type at level 75. They
   * take a challenger who holds all 8 of the region's badges
   */
  EliteFour = 11,
  /**
   * The region's Champion, 6 at level 100. They take a challenger who
   * has beaten all 4 of the Elite Four, and a win takes the title
   */
  Champion = 12,
  /**
   * A market stall: a vendor behind one of the trade's counters,
   * fixed to the spot. Which counter he set up turns over with the
   * window; that he is there at all does not, so a player short of
   * balls knows where to walk
   */
  Market = 13,
  /**
   * A seat a player leaves a team standing on for others to fight.
   * It belongs to whoever last took it rather than to the window, and
   * the fight is against their frozen party rather than against them
   */
  GymSeat = 14,
  /**
   * The board the region's lots are posted on: the only way to the
   * auctions. What is on it is global rather than local — every board
   * shows the same lots — so the walk is what it costs to trade, not
   * which board is walked to
   */
  AuctionBoard = 15,
  /**
   * A tree bearing one of Kurt's seven apricorns. A berry patch that
   * bears balls rather than fruit: what is picked off it does nothing
   * on its own, and Kurt is what turns it into something.
   *
   * **Not in `LANDMARKS` yet**, so nothing generates one. The trees
   * are drawn per colour the way berry plants are, under
   * `landmarks-apricorn/{colour}`, and that art has not been made: a
   * landmark in the roll with nothing to draw is a cell a player
   * walks up to and finds empty
   */
  ApricornTree = 16,
  /**
   * A Battle Frontier facility, with its house champion standing in
   * it. The rank above the Champion, and the first fight in the game
   * whose **rules** differ rather than its roster: three a side, and
   * whatever the house asks on top. It takes a challenger who holds
   * the crown of the region the house stands in
   */
  FrontierBrain = 17,
  /**
   * A Pokémon Center: Nurse Joy behind her own counter, fixed to the
   * spot. She used to be one of the faces a wandering cell drew, which
   * meant the one service a player cannot do without was a 3-hour roll
   * somewhere out in the country. Every town has exactly one of these
   * and the country has none, so being patched up is a reason to walk
   * back into town
   */
  PokemonCenter = 18,
  /**
   * A way into the caves, and back out of them. Not rolled like the
   * rest: a mouth is cut where the ground already has a hillside to
   * cut it into, so it stands at the same pair of cells for both
   * layers and a player who goes down can always come back up
   */
  CaveMouth = 19,
  /**
   * A tree in the forest that honey can be lathered on, once per
   * player per landmark window. Whatever the honey draws out is met on
   * the spot, and nothing in its pool spawns anywhere else
   */
  HoneyTree = 20,
}

export default Landmark;

/**
 * Every landmark, which is the list the country rolls from once its
 * biome has taken out what cannot be there
 */
export const LANDMARKS: Landmark[] = [
  Landmark.ItemCache,
  Landmark.LegendaryLair,
  Landmark.ShadowLair,
  Landmark.BerryPatch,
  Landmark.Nest,
  Landmark.WanderingNpc,
  Landmark.Portal,
  Landmark.TeamRocket,
  Landmark.Trainer,
  Landmark.GymLeader,
  Landmark.EliteFour,
  Landmark.Champion,
  Landmark.Market,
  Landmark.GymSeat,
  Landmark.AuctionBoard,
  Landmark.ApricornTree,
  Landmark.FrontierBrain,
  Landmark.PokemonCenter,
  Landmark.CaveMouth,
  Landmark.HoneyTree,
];

/**
 * How often each is rolled out in the country, as a weight against
 * the rest of its biome's pool.
 *
 * Everyday things outweigh the things a player goes looking for: a
 * cache, a bush and a tree are what a walk turns up, a duel or a
 * grunt is an afternoon, and a raid is a reason to travel. A flat
 * roll made a legendary's lair as common as a berry patch, which is
 * the whole of why this table exists.
 *
 * A landmark a town lays out, and the two the ground itself decides,
 * carry no weight here: they are placed rather than rolled
 */
export const LANDMARK_WEIGHTS: Record<Landmark, number> = {
  [Landmark.ItemCache]: 15,
  [Landmark.BerryPatch]: 15,
  [Landmark.ApricornTree]: 15,
  [Landmark.HoneyTree]: 15,
  [Landmark.Trainer]: 10,
  [Landmark.TeamRocket]: 10,
  [Landmark.ShadowLair]: 6,
  [Landmark.Nest]: 6,
  [Landmark.LegendaryLair]: 2,
  [Landmark.FrontierBrain]: 1,
  // Chartered by a town or cut into the ground, so never rolled
  [Landmark.WanderingNpc]: 0,
  [Landmark.Portal]: 0,
  [Landmark.GymLeader]: 0,
  [Landmark.EliteFour]: 0,
  [Landmark.Champion]: 0,
  [Landmark.Market]: 0,
  [Landmark.GymSeat]: 0,
  [Landmark.AuctionBoard]: 0,
  [Landmark.PokemonCenter]: 0,
  [Landmark.CaveMouth]: 0,
};

/**
 * Display names for the landmarks
 */
export const LANDMARK_NAMES: Record<Landmark, string> = {
  [Landmark.ItemCache]: 'Item Cache',
  [Landmark.LegendaryLair]: 'Legendary Raid',
  [Landmark.ShadowLair]: 'Shadow Raid',
  [Landmark.BerryPatch]: 'Berry Patch',
  [Landmark.Nest]: 'Nest',
  [Landmark.WanderingNpc]: 'Wandering NPC',
  [Landmark.Portal]: 'Portal',
  [Landmark.TeamRocket]: 'Team Rocket',
  [Landmark.Trainer]: 'Trainer',
  [Landmark.GymLeader]: 'Gym Leader',
  [Landmark.EliteFour]: 'Elite Four',
  [Landmark.Champion]: 'Champion',
  [Landmark.Market]: 'Market',
  [Landmark.GymSeat]: 'Gym Seat',
  [Landmark.AuctionBoard]: 'Auction Board',
  [Landmark.ApricornTree]: 'Apricorn Tree',
  [Landmark.FrontierBrain]: 'Frontier Brain',
  [Landmark.PokemonCenter]: 'Pokémon Center',
  [Landmark.CaveMouth]: 'Cave',
  [Landmark.HoneyTree]: 'Honey Tree',
};
