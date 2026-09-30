import { Species } from '../ids/species';

/** The Ultra Beasts, which a Beast Ball is made for */
export const ULTRA_BEASTS = new Set<Species>([
  Species.Nihilego,
  Species.Buzzwole,
  Species.Pheromosa,
  Species.Xurkitree,
  Species.Celesteela,
  Species.Kartana,
  Species.Guzzlord,
  Species.Poipole,
  Species.Naganadel,
  Species.Stakataka,
  Species.Blacephalon,
]);

export function isUltraBeast(species: Species): boolean {
  return ULTRA_BEASTS.has(species);
}
