/**
 * Interactive overworld points a chunk can host
 */
const enum Landmark {
  /**
   * A hidden item stash rolled from the item pool
   */
  ItemCache = 0,
  /**
   * Something happening rather than something buried: a grotto, a
   * dust cloud, water rippling, a shadow overhead. Which of them the
   * cell is showing depends on the biome and turns over every hour,
   * and any of them may be a pokemon
   */
  Phenomenon = 1,
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
}

export default Landmark;

/**
 * Every landmark, for uniform rolls over the variants
 */
export const LANDMARKS: Landmark[] = [
  Landmark.ItemCache,
  Landmark.Phenomenon,
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
];

/**
 * Display names for the landmarks
 */
export const LANDMARK_NAMES: Record<Landmark, string> = {
  [Landmark.ItemCache]: 'Item Cache',
  [Landmark.Phenomenon]: 'Phenomenon',
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
};
