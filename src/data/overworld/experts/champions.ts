import Awards, { HOENN_HONORS, JOHTO_HONORS, KANTO_HONORS } from '../../ids/awards';
import { Species } from '../../ids/species';

/**
 * The champions, one to a league. Giovanni runs Kanto's eighth gym
 * here, so the seat at the top of that league is Blue's; Johto's is
 * Lance, who also keeps a seat in Kanto's Elite Four and is drawn in
 * his Heart Gold coat when he is standing at the top
 */
const enum Champion {
  Blue = 0,
  Lance = 1,
  Wallace = 2,
}

export { Champion };

export const CHAMPIONS: Champion[] = [Champion.Blue, Champion.Lance, Champion.Wallace];

export const CHAMPION_NAMES: Record<Champion, string> = {
  [Champion.Blue]: 'Blue',
  [Champion.Lance]: 'Lance',
  [Champion.Wallace]: 'Wallace',
};

export const CHAMPION_CHARSETS: Record<Champion, string[]> = {
  [Champion.Blue]: ['characters/frlg/blue'],
  [Champion.Lance]: ['characters/hgss/lance', 'characters/hgss/lance-2'],
  // Sootopolis' gym is Juan's here, so Wallace is only ever the man
  // at the top, in both coats he is drawn in
  [Champion.Wallace]: ['characters/rse/wallace', 'characters/oras/wallace'],
};

/** The title a champion's seat is worth */
export const CHAMPION_TITLES: Record<Champion, Awards> = {
  [Champion.Blue]: Awards.KantoChampion,
  [Champion.Lance]: Awards.JohtoChampion,
  [Champion.Wallace]: Awards.HoennChampion,
};

/**
 * And the coats a champion's title unlocks besides the one they are
 * seen in. Blue's Let's Go look is his own; his Heart Gold one asks
 * for Johto's crown as well, since that is the era he is drawn in
 * there, and it is listed with the crossed unlocks in `charsets.ts`
 */
export const CHAMPION_PRIZE_CHARSETS: Partial<Record<Champion, string[]>> = {
  [Champion.Blue]: ['characters/lgpe/blue'],
};

/** The Elite Four a champion asks to see beaten first */
export const CHAMPION_HONORS: Record<Champion, Awards[]> = {
  [Champion.Blue]: KANTO_HONORS,
  [Champion.Lance]: JOHTO_HONORS,
  [Champion.Wallace]: HOENN_HONORS,
};

/**
 * The champion's own six.
 *
 * A champion is the one expert who does not draw from a pool: the
 * team is the character, and a player who has walked the whole league
 * to reach them should meet the party they are known for. Blue's is
 * the one he takes the Indigo Plateau with in Fire Red, the Blastoise
 * line-up of the three he has; Lance's is the one he defends it with,
 * three Dragonite and all
 */
export const CHAMPION_PARTIES: Record<Champion, Species[]> = {
  [Champion.Blue]: [
    Species.Pidgeot,
    Species.Alakazam,
    Species.Rhydon,
    Species.Arcanine,
    Species.Exeggutor,
    Species.Blastoise,
  ],
  [Champion.Lance]: [
    Species.Gyarados,
    Species.Charizard,
    Species.Aerodactyl,
    Species.Dragonite,
    Species.Dragonite,
    Species.Dragonite,
  ],
  // The six he defends Ever Grande with in Emerald, Milotic last
  [Champion.Wallace]: [
    Species.Wailord,
    Species.Tentacruel,
    Species.Ludicolo,
    Species.Whiscash,
    Species.Gyarados,
    Species.Milotic,
  ],
};
