import Awards from '../../ids/awards';
import { Species } from '../../ids/species';

/**
 * The tier above the league.
 *
 * A legend keeps no seat and answers to no badge case: they turn up
 * where a champion would have been, at full level, and anybody
 * standing there may fight them. There is one so far, which is the
 * one the mainline puts at the top of a mountain and says nothing
 * about
 */
const enum Legend {
  Red = 0,
  Steven = 1,
}

export { Legend };

export const LEGENDS: Legend[] = [Legend.Red, Legend.Steven];

export const LEGEND_NAMES: Record<Legend, string> = {
  [Legend.Red]: 'Red',
  [Legend.Steven]: 'Steven',
};

export const LEGEND_CHARSETS: Record<Legend, string[]> = {
  [Legend.Red]: ['characters/frlg/red'],
  [Legend.Steven]: ['characters/oras/steven'],
};

/** The mark beating one is worth, which is the only thing they pay */
export const LEGEND_HONORS: Record<Legend, Awards> = {
  [Legend.Red]: Awards.RedDefeated,
  [Legend.Steven]: Awards.StevenDefeated,
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
};
