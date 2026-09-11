import { Types } from '../../constants/types';
import Awards from '../../ids/awards';
import Biome from '../../ids/biome';
import { type Items, getMachineItem } from '../../ids/items';
import { getTeachableMoves } from '../../items/machines';
import { getMoveData } from '../../moves';

/**
 * The type experts who stand at the fighting landmarks above a plain
 * trainer: gym leaders, the Elite Four and the Champion. Who stands
 * at a given cell is a fixture of the chunk rather than the window's
 * roll — a gym does not change hands with the window — and what they
 * field turns over with the window like any other stop
 */

/**
 * The leaders of the three regions, numbered Kanto's eight, Johto's,
 * then Hoenn's. Which of them a country seats is the table below.
 *
 * Hoenn seats nine for eight gyms: Mossdeep is kept by two people,
 * so Tate and Liza are a leader each and share the one badge
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
}

export { GymLeader };

export const GYM_LEADERS: GymLeader[] = [
  GymLeader.Brock,
  GymLeader.Misty,
  GymLeader.LtSurge,
  GymLeader.Erika,
  GymLeader.Koga,
  GymLeader.Sabrina,
  GymLeader.Blaine,
  GymLeader.Giovanni,
  GymLeader.Falkner,
  GymLeader.Bugsy,
  GymLeader.Whitney,
  GymLeader.Morty,
  GymLeader.Chuck,
  GymLeader.Jasmine,
  GymLeader.Pryce,
  GymLeader.Clair,
  GymLeader.Roxanne,
  GymLeader.Brawly,
  GymLeader.Wattson,
  GymLeader.Flannery,
  GymLeader.Norman,
  GymLeader.Winona,
  GymLeader.Tate,
  GymLeader.Liza,
  GymLeader.Juan,
];

export const GYM_LEADER_NAMES: Record<GymLeader, string> = {
  [GymLeader.Brock]: 'Brock',
  [GymLeader.Misty]: 'Misty',
  [GymLeader.LtSurge]: 'Lt. Surge',
  [GymLeader.Erika]: 'Erika',
  [GymLeader.Koga]: 'Koga',
  [GymLeader.Sabrina]: 'Sabrina',
  [GymLeader.Blaine]: 'Blaine',
  [GymLeader.Giovanni]: 'Giovanni',
  [GymLeader.Falkner]: 'Falkner',
  [GymLeader.Bugsy]: 'Bugsy',
  [GymLeader.Whitney]: 'Whitney',
  [GymLeader.Morty]: 'Morty',
  [GymLeader.Chuck]: 'Chuck',
  [GymLeader.Jasmine]: 'Jasmine',
  [GymLeader.Pryce]: 'Pryce',
  [GymLeader.Clair]: 'Clair',
  [GymLeader.Roxanne]: 'Roxanne',
  [GymLeader.Brawly]: 'Brawly',
  [GymLeader.Wattson]: 'Wattson',
  [GymLeader.Flannery]: 'Flannery',
  [GymLeader.Norman]: 'Norman',
  [GymLeader.Winona]: 'Winona',
  [GymLeader.Tate]: 'Tate',
  [GymLeader.Liza]: 'Liza',
  [GymLeader.Juan]: 'Juan',
};

/** What each leader fields. */
export const GYM_LEADER_TYPES: Record<GymLeader, Types> = {
  [GymLeader.Brock]: Types.Rock,
  [GymLeader.Misty]: Types.Water,
  [GymLeader.LtSurge]: Types.Electric,
  [GymLeader.Erika]: Types.Grass,
  [GymLeader.Koga]: Types.Poison,
  [GymLeader.Sabrina]: Types.Psychic,
  [GymLeader.Blaine]: Types.Fire,
  [GymLeader.Giovanni]: Types.Ground,
  [GymLeader.Falkner]: Types.Flying,
  [GymLeader.Bugsy]: Types.Bug,
  [GymLeader.Whitney]: Types.Normal,
  [GymLeader.Morty]: Types.Ghost,
  [GymLeader.Chuck]: Types.Fighting,
  [GymLeader.Jasmine]: Types.Steel,
  [GymLeader.Pryce]: Types.Ice,
  [GymLeader.Clair]: Types.Dragon,
  [GymLeader.Roxanne]: Types.Rock,
  [GymLeader.Brawly]: Types.Fighting,
  [GymLeader.Wattson]: Types.Electric,
  [GymLeader.Flannery]: Types.Fire,
  [GymLeader.Norman]: Types.Normal,
  [GymLeader.Winona]: Types.Flying,
  [GymLeader.Tate]: Types.Psychic,
  [GymLeader.Liza]: Types.Psychic,
  [GymLeader.Juan]: Types.Water,
};

export const GYM_LEADER_BADGES: Record<GymLeader, Awards> = {
  [GymLeader.Brock]: Awards.BoulderBadge,
  [GymLeader.Misty]: Awards.CascadeBadge,
  [GymLeader.LtSurge]: Awards.ThunderBadge,
  [GymLeader.Erika]: Awards.RainbowBadge,
  [GymLeader.Koga]: Awards.SoulBadge,
  [GymLeader.Sabrina]: Awards.MarshBadge,
  [GymLeader.Blaine]: Awards.VolcanoBadge,
  [GymLeader.Giovanni]: Awards.EarthBadge,
  [GymLeader.Falkner]: Awards.ZephyrBadge,
  [GymLeader.Bugsy]: Awards.HiveBadge,
  [GymLeader.Whitney]: Awards.PlainBadge,
  [GymLeader.Morty]: Awards.FogBadge,
  [GymLeader.Chuck]: Awards.StormBadge,
  [GymLeader.Jasmine]: Awards.MineralBadge,
  [GymLeader.Pryce]: Awards.GlacierBadge,
  [GymLeader.Clair]: Awards.RisingBadge,
  [GymLeader.Roxanne]: Awards.StoneBadge,
  [GymLeader.Brawly]: Awards.KnuckleBadge,
  [GymLeader.Wattson]: Awards.DynamoBadge,
  [GymLeader.Flannery]: Awards.HeatBadge,
  [GymLeader.Norman]: Awards.BalanceBadge,
  [GymLeader.Winona]: Awards.FeatherBadge,
  // One gym, two people: whichever of them a chunk seats, the badge
  // that gym pays is the same one
  [GymLeader.Tate]: Awards.MindBadge,
  [GymLeader.Liza]: Awards.MindBadge,
  [GymLeader.Juan]: Awards.RainBadge,
};

export const GYM_LEADER_CHARSETS: Record<GymLeader, string[]> = {
  [GymLeader.Brock]: ['characters/frlg/brock', 'characters/lgpe/brock'],
  [GymLeader.Misty]: ['characters/frlg/misty', 'characters/lgpe/misty'],
  [GymLeader.LtSurge]: ['characters/frlg/surge', 'characters/lgpe/surge'],
  [GymLeader.Erika]: ['characters/frlg/erika', 'characters/lgpe/erika'],
  [GymLeader.Koga]: ['characters/frlg/koga', 'characters/lgpe/koga'],
  [GymLeader.Sabrina]: ['characters/frlg/sabrina', 'characters/lgpe/sabrina'],
  [GymLeader.Blaine]: ['characters/frlg/blaine', 'characters/lgpe/blaine'],
  [GymLeader.Giovanni]: ['characters/frlg/giovanni'],
  [GymLeader.Falkner]: ['characters/hgss/falkner'],
  [GymLeader.Bugsy]: ['characters/hgss/bugsy'],
  [GymLeader.Whitney]: ['characters/hgss/whitney'],
  [GymLeader.Morty]: ['characters/hgss/morty'],
  [GymLeader.Chuck]: ['characters/hgss/chuck'],
  [GymLeader.Jasmine]: ['characters/hgss/jasmine'],
  [GymLeader.Pryce]: ['characters/hgss/pryce'],
  [GymLeader.Clair]: ['characters/hgss/clair'],
  [GymLeader.Roxanne]: ['characters/rse/roxanne', 'characters/oras/roxanne'],
  [GymLeader.Brawly]: ['characters/rse/brawly'],
  [GymLeader.Wattson]: ['characters/rse/wattson'],
  [GymLeader.Flannery]: ['characters/rse/flannery', 'characters/oras/flannery'],
  [GymLeader.Norman]: ['characters/rse/norman'],
  [GymLeader.Winona]: ['characters/rse/winona'],
  [GymLeader.Tate]: ['characters/rse/tate', 'characters/oras/tate'],
  [GymLeader.Liza]: ['characters/rse/liza', 'characters/oras/liza'],
  [GymLeader.Juan]: ['characters/rse/juan'],
};

/**
 * Coats a badge unlocks that its leader is never seen in.
 *
 * A leader wanders in the sheets above; these are the other looks of
 * the same person, worth wearing and worth nothing to the chunk.
 * Giovanni's Let's Go coat is here because the gym he keeps is drawn
 * in his Fire Red one
 */
export const GYM_LEADER_PRIZE_CHARSETS: Partial<Record<GymLeader, string[]>> = {
  [GymLeader.Giovanni]: ['characters/lgpe/giovanni'],
};

/**
 * The coat a Kanto leader is drawn in in Johto's era.
 *
 * It is the same gym years later, so it asks for the badge **and**
 * Johto's crown: a look from after that league means nothing to
 * somebody who has not taken it. Koga's gym has passed to his
 * daughter by then, so the Soul Badge pays Janine
 */
export const GYM_LEADER_LATER_CHARSETS: Partial<Record<GymLeader, string[]>> = {
  [GymLeader.Brock]: ['characters/hgss/brock'],
  [GymLeader.Misty]: ['characters/hgss/misty'],
  [GymLeader.LtSurge]: ['characters/hgss/surge'],
  [GymLeader.Erika]: ['characters/hgss/erika'],
  [GymLeader.Koga]: ['characters/hgss/janine'],
  [GymLeader.Sabrina]: ['characters/hgss/sabrina'],
  [GymLeader.Blaine]: ['characters/hgss/blaine'],
};

/**
 * Which leaders keep the gyms of each biome. The country is the map
 * to the badges: a player hunting Blaine walks to fire country. Two
 * regions of leaders now share those countries, so the list per biome
 * holds both and the chunk's own fixture roll says which gym is
 * whose. The open seas never roll a people landmark, and are mapped
 * only so the table stays total
 */
export const BIOME_GYM_LEADERS: Record<Biome, GymLeader[]> = {
  [Biome.DeepOcean]: [GymLeader.Misty, GymLeader.Falkner, GymLeader.Winona, GymLeader.Juan],
  [Biome.Ocean]: [GymLeader.Misty, GymLeader.Falkner, GymLeader.Winona, GymLeader.Juan],
  [Biome.CoralReef]: [GymLeader.Misty, GymLeader.Juan],
  [Biome.Beach]: [
    GymLeader.Misty,
    GymLeader.Falkner,
    GymLeader.Whitney,
    GymLeader.Juan,
    GymLeader.Winona,
    GymLeader.Norman,
    GymLeader.Brawly,
  ],
  [Biome.Mangrove]: [GymLeader.Koga, GymLeader.Bugsy, GymLeader.Norman],
  [Biome.KelpForest]: [GymLeader.Misty, GymLeader.Juan],
  [Biome.PolarOcean]: [
    GymLeader.Misty,
    GymLeader.Falkner,
    GymLeader.Pryce,
    GymLeader.Winona,
    GymLeader.Juan,
  ],
  [Biome.Glacier]: [GymLeader.Misty, GymLeader.Pryce, GymLeader.Juan],
  [Biome.Tundra]: [
    GymLeader.Misty,
    GymLeader.Pryce,
    GymLeader.Falkner,
    GymLeader.Whitney,
    GymLeader.Juan,
    GymLeader.Winona,
    GymLeader.Norman,
  ],
  [Biome.Swamp]: [GymLeader.Koga, GymLeader.Morty, GymLeader.Bugsy, GymLeader.Norman],
  [Biome.Bog]: [GymLeader.Koga, GymLeader.Morty, GymLeader.Norman],
  [Biome.TropicalSeasonalForest]: [
    GymLeader.Erika,
    GymLeader.Bugsy,
    GymLeader.Whitney,
    GymLeader.Falkner,
    GymLeader.Norman,
    GymLeader.Winona,
  ],
  [Biome.Grassland]: [
    GymLeader.Erika,
    GymLeader.Whitney,
    GymLeader.Bugsy,
    GymLeader.Falkner,
    GymLeader.Norman,
    GymLeader.Winona,
  ],
  [Biome.TemperateForest]: [
    GymLeader.Erika,
    GymLeader.Bugsy,
    GymLeader.Whitney,
    GymLeader.Morty,
    GymLeader.Norman,
  ],
  [Biome.Woodland]: [GymLeader.Erika, GymLeader.Bugsy, GymLeader.Whitney, GymLeader.Norman],
  [Biome.Savanna]: [
    GymLeader.LtSurge,
    GymLeader.Falkner,
    GymLeader.Chuck,
    GymLeader.Giovanni,
    GymLeader.Wattson,
    GymLeader.Winona,
    GymLeader.Brawly,
  ],
  [Biome.Steppe]: [
    GymLeader.LtSurge,
    GymLeader.Falkner,
    GymLeader.Giovanni,
    GymLeader.Wattson,
    GymLeader.Winona,
  ],
  [Biome.Desert]: [GymLeader.Blaine, GymLeader.Giovanni, GymLeader.Flannery],
  [Biome.Volcano]: [GymLeader.Blaine, GymLeader.Jasmine, GymLeader.Clair, GymLeader.Flannery],
  [Biome.ColdDesert]: [
    GymLeader.Brock,
    GymLeader.Pryce,
    GymLeader.Jasmine,
    GymLeader.Giovanni,
    GymLeader.Roxanne,
  ],
  [Biome.Mountain]: [
    GymLeader.Brock,
    GymLeader.Chuck,
    GymLeader.Jasmine,
    GymLeader.Clair,
    GymLeader.Giovanni,
    GymLeader.Roxanne,
    GymLeader.Brawly,
  ],
  [Biome.AlpineTundra]: [
    GymLeader.Brock,
    GymLeader.Pryce,
    GymLeader.Falkner,
    GymLeader.Clair,
    GymLeader.Roxanne,
    GymLeader.Winona,
  ],
  [Biome.Badlands]: [
    GymLeader.Brock,
    GymLeader.Chuck,
    GymLeader.Jasmine,
    GymLeader.Giovanni,
    GymLeader.Roxanne,
    GymLeader.Brawly,
  ],
  [Biome.RockyCoast]: [GymLeader.Brock, GymLeader.Falkner, GymLeader.Roxanne, GymLeader.Winona],
  [Biome.TemperateRainforest]: [
    GymLeader.Sabrina,
    GymLeader.Bugsy,
    GymLeader.Morty,
    GymLeader.Tate,
    GymLeader.Liza,
  ],
  [Biome.MontaneForest]: [GymLeader.Sabrina, GymLeader.Bugsy, GymLeader.Tate, GymLeader.Liza],
  [Biome.Beyond]: [
    GymLeader.Sabrina,
    GymLeader.Morty,
    GymLeader.Clair,
    GymLeader.Tate,
    GymLeader.Liza,
  ],
  [Biome.TropicalRainforest]: [GymLeader.Bugsy, GymLeader.Erika, GymLeader.Norman],
  [Biome.Shrubland]: [GymLeader.Whitney, GymLeader.Bugsy, GymLeader.Norman, GymLeader.Wattson],
  [Biome.Taiga]: [GymLeader.Bugsy, GymLeader.Falkner, GymLeader.Pryce, GymLeader.Winona],
};

/**
 * The machine a beaten leader hands over: one of the TMs of their own
 * type, rolled by the caller's draw. Null only if a type somehow
 * teaches nothing
 */
export function rollGymMachine(leader: GymLeader, random: () => number): Items | null {
  const type = GYM_LEADER_TYPES[leader];
  const moves = getTeachableMoves().filter((move) => getMoveData(move).type === type);
  const move = moves.at(Math.floor(random() * moves.length));

  return move == null ? null : getMachineItem(move);
}
