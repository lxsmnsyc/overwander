/**
 * The champions, one to a league. Giovanni runs Kanto's eighth gym
 * here, so the seat at the top of that league is Blue's; Johto's is
 * Lance, who also keeps a seat in Kanto's Elite Four and is drawn in
 * his Heart Gold coat when he is standing at the top. Unova's is
 * Iris, which is why Opelucid's gym is Drayden's.
 *
 * A title or a mark is recorded against the number, so one is appended
 * and never renumbered. Who each is lives in
 * `src/data/overworld/experts/champions.yaml`
 */
const enum Champion {
  Blue = 0,
  Lance = 1,
  Wallace = 2,
  Cynthia = 3,
  Iris = 4,
  Diantha = 5,
}

export { Champion };
export default Champion;
