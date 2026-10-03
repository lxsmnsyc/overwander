/**
 * The leaders of the regions, numbered Kanto's eight, Johto's,
 * Hoenn's, Sinnoh's, Unova's, then Kalos's. A badge and a win are
 * recorded against the number, so a leader is appended and never
 * renumbered. What each fields, pays and wears is
 * `src/data/overworld/experts/gym-leaders.yaml`, and which of them a
 * country seats is `biome-gym-leaders.yaml` beside it.
 *
 * Two regions seat more people than they have gyms. Mossdeep is kept
 * by two, so Tate and Liza are a leader each and share the one badge.
 * Unova seats thirteen over ten badges: Striaton is kept by three who
 * each fight a different type, and Nacrene's fight passes to Cheren
 * in Aspertia a league later, so the Basic Badge has two keepers as
 * well. Iris is left out, since Opelucid is Drayden's here
 */
const enum GymLeader {
  Brock = 0,
  Misty = 1,
  LtSurge = 2,
  Erika = 3,
  Koga = 4,
  Sabrina = 5,
  Blaine = 6,
  Giovanni = 7,
  Falkner = 8,
  Bugsy = 9,
  Whitney = 10,
  Morty = 11,
  Chuck = 12,
  Jasmine = 13,
  Pryce = 14,
  Clair = 15,
  Roxanne = 16,
  Brawly = 17,
  Wattson = 18,
  Flannery = 19,
  Norman = 20,
  Winona = 21,
  Tate = 22,
  Liza = 23,
  Juan = 24,
  Roark = 25,
  Gardenia = 26,
  Maylene = 27,
  CrasherWake = 28,
  Fantina = 29,
  Byron = 30,
  Candice = 31,
  Volkner = 32,
  Cilan = 33,
  Chili = 34,
  Cress = 35,
  Lenora = 36,
  Burgh = 37,
  Elesa = 38,
  Clay = 39,
  Skyla = 40,
  Brycen = 41,
  Drayden = 42,
  Cheren = 43,
  Roxie = 44,
  Marlon = 45,
  Viola = 46,
  Grant = 47,
  Korrina = 48,
  Ramos = 49,
  Clemont = 50,
  Valerie = 51,
  Olympia = 52,
  Wulfric = 53,
}

export { GymLeader };
export default GymLeader;
