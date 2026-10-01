/**
 * The people who stand at the world's people landmarks, by role. What
 * each one is called, says and wears is in
 * [`npc-data.ts`](../overworld/npc-data.ts)
 */
const enum Npc {
  /**
   * Takes two compatible pokemon and a fee, and hands back an egg
   */
  Breeder = 0,
  /**
   * Takes an egg and a fee, and warms it half a walk's worth further
   * along than it already was
   */
  DaycareLady = 1,
  /**
   * Looks a party over and hands it back whole: health, statuses and,
   * for a shadow, the shadow itself. She charges nothing and turns
   * nobody away, however often they come back. She does not wander:
   * her counter is the Pokémon Center, one to a town
   */
  NurseJoy = 2,
  /**
   * Takes one pokemon and a fee, and hands it back thinking half
   * again as well of its owner as it did. The daycare lady's trade,
   * done on the pokemon rather than on the egg
   */
  Groomer = 3,
  /**
   * Keeps the market stall: a crate off one of the trade's counters —
   * balls and medicine, vitamins, incenses, or the X items — and a
   * purse. He does not wander. His stall is a landmark of its own, so
   * a player short of balls knows where to walk; which counter he set
   * up is still the window's roll. He deals as often as the purse
   * holds, and buys anything the market puts a price on
   */
  Vendor = 4,
  /**
   * Takes a Heart Scale and puts back a move the pokemon learned by
   * levelling and has since lost. He is the only way a forgotten
   * level-up move ever comes back, gold is no use to him, and he
   * serves as often as a player has scales
   */
  MoveReminder = 5,
  /**
   * Bars the cell and fights whoever accepts, with shadows of the
   * biome's own. Beaten, they pay a purse and leave one of their
   * party behind. Not a wanderer any more: Team Rocket stands at a
   * landmark of its own, and once in a long while it is Giovanni
   */
  RocketGrunt = 6,
  /**
   * Carries two of the three fossils and will part with one for
   * gold. He is the only place a fossil can be bought, and he sells
   * a player one while he is standing there
   */
  FossilManiac = 7,
  /**
   * Takes a fossil and hands back what was in it. He charges nothing
   * but the rock, and — alone among the people who do something to a
   * pokemon — he will do it as often as a player has fossils
   */
  FossilScientist = 8,
  /**
   * Takes a Heart Scale and puts a move on a pokemon that its species
   * can be taught but never grows into. The reminder's counter run the
   * other way: he deals in what a machine would teach, not in what was
   * lost, and the scale paces him the same way
   */
  MoveTutor = 9,
  /**
   * Offers a fair duel: three of the biome's own against whatever the
   * player brings, purse on a win. The grunt's fight without the
   * ambush — nothing fielded is a shadow. Like Team Rocket, a
   * landmark of their own rather than a wanderer
   */
  Trainer = 10,
  /**
   * Carries a larder of drinks and treats: the vendor's trade with
   * the one shelf no vendor stocks. Like the vendor, he serves as
   * often as the purse holds
   */
  Chef = 11,
  /**
   * Takes a Heart Scale and draws out a second thing the pokemon was
   * always able to do: one more ability slot, filled at once from
   * what its line is capable of. The only way a pokemon ever gains an
   * ability, since every other one it has was rolled before the
   * player met it
   */
  Channeler = 12,
  /**
   * Takes apricorns and carves them into the balls their colours
   * make: one apricorn, one ball, and he works through as many as a
   * player is carrying. He charges nothing, since the picking is the
   * price, and his seven balls are sold nowhere else at all
   */
  Kurt = 13,
  /**
   * Carries a crate of stones: the evolution stones, the gems and the
   * rocks a holder is built around. He is the only one who sells any
   * of them, and like the chef he serves as often as the purse holds
   */
  Geologist = 14,
  /**
   * Takes a Heart Scale and trains a pokemon to hold one more move, up
   * to the most any pokemon can. The Skill Book's work done for a
   * scale, and like the Move Reminder he serves as often as a player
   * has scales
   */
  DojoMaster = 15,
  /**
   * Brings six pokemon from other biomes and swaps one of them for any
   * of the player's own from the same spawn band. Once a window, and
   * what he hands over arrives traded, so a trade evolution opens
   */
  Trader = 16,
  /**
   * Trains one of a pokemon's values all the way up, for gold by the
   * point. Dear on purpose: this is for players who already have the
   * pokemon they want and the purse to finish it. Once a window
   */
  HyperTrainer = 17,
}

export default Npc;
