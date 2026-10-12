/**
 * Who keeps the crime landmark here.
 *
 * One landmark, five organisations: the cell, the ranks, the shadows
 * and the purse are the same wherever it stands, and which team is
 * standing there is the biome's answer rather than the roll's. Team
 * Magma wants the land raised and holds the volcanoes and the dry
 * country; Team Aqua wants it drowned and holds the water; Team
 * Galactic wants it unmade and holds the cold and the thin places;
 * Team Plasma wants every pokemon let go and holds the woods, which
 * is where a released one would end up; Team Flare wants a beautiful
 * world kept for the few and holds the flower meadows; Team Rocket has
 * no ambition beyond the money and holds everywhere else.
 *
 * It is a fixture, not a window roll: a player who learns that the
 * coast is Aqua's has learned something about the world.
 *
 * A mark is recorded against the number, so a team is appended and
 * never renumbered. Who each is lives in
 * `src/data/overworld/syndicates.yaml`
 */
const enum Syndicate {
  Rocket = 0,
  Magma = 1,
  Aqua = 2,
  Galactic = 3,
  Plasma = 4,
  Flare = 5,
}

export { Syndicate };
export default Syndicate;
