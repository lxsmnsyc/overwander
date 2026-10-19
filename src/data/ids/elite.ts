/**
 * The leagues' Elite Four, numbered Kanto's, Johto's, Hoenn's,
 * Sinnoh's, Unova's then Kalos's. Bruno is here twice because he keeps
 * a seat in each of the first two: two fights, two marks, and a
 * challenger who has only walked one region's gyms is taken by the
 * Bruno of that region alone. Unova's four keep their seats in both
 * of its leagues, so they are one seat each.
 *
 * A mark is recorded against the number, so a seat is appended and
 * never renumbered. What each fields, pays and wears is
 * `src/data/overworld/experts/elite.yaml`, and which seats each country
 * holds is `biome-elite.yaml` beside it
 */
const enum EliteMember {
  Lorelei = 0,
  Bruno = 1,
  Agatha = 2,
  Lance = 3,
  Will = 4,
  Koga = 5,
  Karen = 6,
  JohtoBruno = 7,
  Sidney = 8,
  Phoebe = 9,
  Glacia = 10,
  Drake = 11,
  Aaron = 12,
  Bertha = 13,
  Flint = 14,
  Lucian = 15,
  Shauntal = 16,
  Marshal = 17,
  Grimsley = 18,
  Caitlin = 19,
  Malva = 20,
  Siebold = 21,
  Wikstrom = 22,
  Drasna = 23,
}

export { EliteMember };
export default EliteMember;
