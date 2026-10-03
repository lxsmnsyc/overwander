/**
 * The tier above the league.
 *
 * A legend keeps no seat and answers to no badge case: they turn up
 * where a champion would have been, at full level, and anybody
 * standing there may fight them. Each is somebody the mainline puts
 * above its own league: the one at the top of a mountain, the one
 * who hands his region over and goes looking for stones, the one
 * who walks away from Unova's throne, the champion who gave that seat
 * up to wander it, and the king who ended Kalos's war.
 *
 * A title or a mark is recorded against the number, so one is appended
 * and never renumbered. Who each is lives in
 * `src/data/overworld/experts/legends.yaml`
 */
const enum Legend {
  Red = 0,
  Steven = 1,
  N = 2,
  Alder = 3,
  AZ = 4,
}

export { Legend };
export default Legend;
