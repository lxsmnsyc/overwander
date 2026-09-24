import Awards from '../../ids/awards';
import { Species } from '../../ids/species';

/**
 * The tier above the league.
 *
 * A legend keeps no seat and answers to no badge case: they turn up
 * where a champion would have been, at full level, and anybody
 * standing there may fight them. Each is somebody the mainline puts
 * above its own league: the one at the top of a mountain, the one who
 * hands his region over to look for stones, and the king who ended
 * Kalos's war
 */
const enum Legend {
  Red = 0,
  Steven = 1,
  // 2 is N, Unova's, on a branch of his own
  AZ = 3,
}

export { Legend };

export const LEGENDS: Legend[] = [Legend.Red, Legend.Steven, Legend.AZ];

export const LEGEND_NAMES: Record<Legend, string> = {
  [Legend.Red]: 'Red',
  [Legend.Steven]: 'Steven',
  [Legend.AZ]: 'AZ',
};

export const LEGEND_CHARSETS: Record<Legend, string[]> = {
  [Legend.Red]: ['characters/frlg/red'],
  [Legend.Steven]: ['characters/oras/steven'],
  [Legend.AZ]: ['characters/xy/az'],
};

/** The mark beating one is worth, which is the only thing they pay */
export const LEGEND_HONORS: Record<Legend, Awards> = {
  [Legend.Red]: Awards.RedDefeated,
  [Legend.Steven]: Awards.StevenDefeated,
  [Legend.AZ]: Awards.AZDefeated,
};

/**
 * And the coats that mark unlocks.
 *
 * Red's Fire Red sheet is left out because it is what the game starts
 * everybody as, so a mark that unlocked it would be worth nothing to
 * wear; what is left is the other two of him, the Mt. Silver coat
 * first. Steven's one coat is nobody's starting look, so his mark
 * pays the sheet he is standing there in
 */
export const LEGEND_PRIZE_CHARSETS: Record<Legend, string[]> = {
  [Legend.Red]: ['characters/hgss/red', 'characters/lgpe/red'],
  [Legend.Steven]: ['characters/oras/steven'],
  [Legend.AZ]: ['characters/xy/az'],
};

/** A legend's own six, the way a champion's is their own */
export const LEGEND_PARTIES: Record<Legend, Species[]> = {
  [Legend.Red]: [
    Species.Pikachu,
    Species.Lapras,
    Species.Snorlax,
    Species.Venusaur,
    Species.Charizard,
    Species.Blastoise,
  ],
  // The steel he is met with on the mountain in Omega Ruby, Metagross
  // last
  [Legend.Steven]: [
    Species.Skarmory,
    Species.Claydol,
    Species.Aggron,
    Species.Cradily,
    Species.Armaldo,
    Species.Metagross,
  ],
  // His three from the post-game fight, then the Floette he spent three
  // thousand years looking for, and both halves of the power his
  // weapon was built on
  [Legend.AZ]: [
    Species.Torkoal,
    Species.Golurk,
    Species.Sigilyph,
    Species.FloetteEternal,
    Species.Xerneas,
    Species.Yveltal,
  ],
};
