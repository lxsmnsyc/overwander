/**
 * The Frontier Brains: the house champion of a facility, and the
 * rank above the league.
 *
 * What sets them apart from every seat below is not the party but the
 * **rule**. A gym is a type, an elite is a type with a widener, a
 * champion is a fixed six; a Brain is a fight held under the house's
 * own terms, and the party is only what those terms are demonstrated
 * with. All seven are open.
 *
 * A symbol or a print is recorded against the number, so a Brain is
 * appended and never renumbered. Who each is lives in
 * `src/data/overworld/experts/frontier.yaml`
 */
const enum FrontierBrain {
  Brandon = 0,
  Greta = 1,
  Lucy = 2,
  Noland = 3,
  Anabel = 4,
  Spenser = 5,
  Tucker = 6,
  Palmer = 7,
  Thorton = 8,
  Dahlia = 9,
  // The Castle is kept by two: the lady who owns it and the valet who
  // fights for her, and either of them pays the one print
  Darach = 10,
  Caitlin = 11,
  Argenta = 12,
}

/**
 * The house rules, one per facility.
 *
 * A rule is stored on the battle it was fought under, the way the
 * limits and the sky are, so a fight replays as the fight it was
 */
const enum FrontierRule {
  /** No rule at all: the fight is the ordinary one */
  None = 0,
  /**
   * The Pyramid, walked with nothing in hand. Neither side holds an
   * item, so a Focus Sash and a bag of berries are worth nothing and
   * the three pokemon are the whole of what was brought
   */
  Bare = 1,
  /**
   * The Arena, judged. The fight is stopped on the clock, and the
   * side with the greater share of its health still standing takes
   * it, which is the closest a real-time fight comes to being scored
   */
  Timed = 2,
  /**
   * The Pike, walked through a curtain. What is behind it is rolled
   * when the challenge is taken and it lands on the challenger's
   * party alone: the house is not walking through its own rooms
   */
  Curtained = 3,
  /**
   * The Factory, fought with three the house lends. Neither side
   * brings its own, so nothing of the challenger's is on the field
   * and nothing of theirs comes off it: no health lost, no item
   * spent, no candy earned. What is being tested is what they can do
   * with three pokemon they have never met
   */
  Rented = 4,
  /**
   * The Palace, fought on temperament. Every pokemon on the field
   * picks by its own nature rather than on the merits of the move,
   * so which three are brought is a question of who they are and not
   * of what they cover
   */
  Natured = 5,
  /**
   * The Dome, answered. The house names nobody until the challenger
   * has: its three are drawn once the party is frozen, one apiece
   * against what was brought, so a team that covers everything covers
   * nothing here
   */
  Countered = 6,
  /**
   * The Arcade, rolled. One panel is drawn when the challenge is
   * taken and lands on **both** sides as the fight opens: a sky for
   * the whole fight, every held item on the field shut off, everybody
   * poisoned, or everybody mended. Stored with the fight the way the
   * curtain is, so a replay is the fight that happened
   */
  Rolled = 7,
  /**
   * The Castle, where the service is the house's. Nothing puts health
   * back on the challenger's three: no potion, no berry, no drain and
   * no held item, for the whole fight. The house's own heal normally,
   * which is the point of it
   */
  Unhealed = 8,
  /**
   * The Hall, one against one. A single pokemon a side, and the
   * house's is drawn against whatever walked in, so nothing can cover
   * for anything else
   */
  Singled = 9,
}

export { FrontierBrain, FrontierRule };
export default FrontierBrain;
