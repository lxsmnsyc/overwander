import { Types } from '../constants/types';
import Awards from '../ids/awards';
import Biome from '../ids/biome';
import type Regions from '../ids/regions';
import { Species } from '../ids/species';
import { EVERY_LAIR, getLairSpecies } from './lair';
import { getSpeciesByRegion, getSpeciesData, isBaseForm } from '../species';

/**
 * The type experts who stand at the fighting landmarks above a plain
 * trainer: gym leaders, the Elite Four and the Champion. Who stands
 * at a given cell is a fixture of the chunk rather than the window's
 * roll — a gym does not change hands with the window — and what they
 * field turns over with the window like any other stop
 */

/**
 * Every expert fields a full 6, whatever their rank; the rank sets
 * the level instead
 */
export const EXPERT_PARTY_SIZE = 6;

const enum GymLeader {
  Brock = 0,
  Misty = 1,
  LtSurge = 2,
  Erika = 3,
  Koga = 4,
  Sabrina = 5,
  Blaine = 6,
  Blue = 7,
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
  GymLeader.Blue,
];

export const GYM_LEADER_NAMES: Record<GymLeader, string> = {
  [GymLeader.Brock]: 'Brock',
  [GymLeader.Misty]: 'Misty',
  [GymLeader.LtSurge]: 'Lt. Surge',
  [GymLeader.Erika]: 'Erika',
  [GymLeader.Koga]: 'Koga',
  [GymLeader.Sabrina]: 'Sabrina',
  [GymLeader.Blaine]: 'Blaine',
  [GymLeader.Blue]: 'Blue',
};

/**
 * What each leader fields. Blue is the one leader with no specialty:
 * his gym takes all comers with a party drawn from everything
 */
export const GYM_LEADER_TYPES: Partial<Record<GymLeader, Types>> = {
  [GymLeader.Brock]: Types.Rock,
  [GymLeader.Misty]: Types.Water,
  [GymLeader.LtSurge]: Types.Electric,
  [GymLeader.Erika]: Types.Grass,
  [GymLeader.Koga]: Types.Poison,
  [GymLeader.Sabrina]: Types.Psychic,
  [GymLeader.Blaine]: Types.Fire,
};

export const GYM_LEADER_BADGES: Record<GymLeader, Awards> = {
  [GymLeader.Brock]: Awards.BoulderBadge,
  [GymLeader.Misty]: Awards.CascadeBadge,
  [GymLeader.LtSurge]: Awards.ThunderBadge,
  [GymLeader.Erika]: Awards.RainbowBadge,
  [GymLeader.Koga]: Awards.SoulBadge,
  [GymLeader.Sabrina]: Awards.MarshBadge,
  [GymLeader.Blaine]: Awards.VolcanoBadge,
  [GymLeader.Blue]: Awards.EarthBadge,
};

export const GYM_LEADER_CHARSETS: Record<GymLeader, string[]> = {
  [GymLeader.Brock]: ['characters/frlg/brock', 'characters/lgpe/brock'],
  [GymLeader.Misty]: ['characters/frlg/misty', 'characters/lgpe/misty'],
  [GymLeader.LtSurge]: ['characters/frlg/surge', 'characters/lgpe/surge'],
  [GymLeader.Erika]: ['characters/frlg/erika', 'characters/lgpe/erika'],
  [GymLeader.Koga]: ['characters/frlg/koga', 'characters/lgpe/koga'],
  [GymLeader.Sabrina]: ['characters/frlg/sabrina', 'characters/lgpe/sabrina'],
  [GymLeader.Blaine]: ['characters/frlg/blaine', 'characters/lgpe/blaine'],
  [GymLeader.Blue]: ['characters/frlg/blue', 'characters/lgpe/blue'],
};

/**
 * Which leaders keep the gyms of each biome. The country is the map
 * to the badges: a player hunting Blaine walks to fire country. A
 * list per biome, because later regions add leaders who share a
 * country — which gym is whose is then the chunk's own fixture roll
 * over the list. Biomes with no leader of their own type go to Blue,
 * whose gym takes all comers; the open seas never roll a people
 * landmark, and are mapped only so the table stays total
 */
export const BIOME_GYM_LEADERS: Record<Biome, GymLeader[]> = {
  [Biome.DeepOcean]: [GymLeader.Misty],
  [Biome.Ocean]: [GymLeader.Misty],
  [Biome.CoralReef]: [GymLeader.Misty],
  [Biome.Beach]: [GymLeader.Misty],
  [Biome.Mangrove]: [GymLeader.Misty],
  [Biome.KelpForest]: [GymLeader.Misty],
  [Biome.PolarOcean]: [GymLeader.Misty],
  [Biome.Glacier]: [GymLeader.Misty],
  [Biome.Tundra]: [GymLeader.Misty],
  [Biome.Swamp]: [GymLeader.Koga],
  [Biome.Bog]: [GymLeader.Koga],
  [Biome.TropicalSeasonalForest]: [GymLeader.Erika],
  [Biome.Grassland]: [GymLeader.Erika],
  [Biome.TemperateForest]: [GymLeader.Erika],
  [Biome.Woodland]: [GymLeader.Erika],
  [Biome.Savanna]: [GymLeader.LtSurge],
  [Biome.Steppe]: [GymLeader.LtSurge],
  [Biome.Desert]: [GymLeader.Blaine],
  [Biome.Volcano]: [GymLeader.Blaine],
  [Biome.ColdDesert]: [GymLeader.Brock],
  [Biome.Mountain]: [GymLeader.Brock],
  [Biome.AlpineTundra]: [GymLeader.Brock],
  [Biome.Badlands]: [GymLeader.Brock],
  [Biome.RockyCoast]: [GymLeader.Brock],
  [Biome.TemperateRainforest]: [GymLeader.Sabrina],
  [Biome.MontaneForest]: [GymLeader.Sabrina],
  [Biome.Beyond]: [GymLeader.Sabrina],
  [Biome.TropicalRainforest]: [GymLeader.Blue],
  [Biome.Shrubland]: [GymLeader.Blue],
  [Biome.Taiga]: [GymLeader.Blue],
};

const enum EliteMember {
  Lorelei = 0,
  Bruno = 1,
  Agatha = 2,
  Lance = 3,
}

export { EliteMember };

export const ELITE_MEMBERS: EliteMember[] = [
  EliteMember.Lorelei,
  EliteMember.Bruno,
  EliteMember.Agatha,
  EliteMember.Lance,
];

export const ELITE_MEMBER_NAMES: Record<EliteMember, string> = {
  [EliteMember.Lorelei]: 'Lorelei',
  [EliteMember.Bruno]: 'Bruno',
  [EliteMember.Agatha]: 'Agatha',
  [EliteMember.Lance]: 'Lance',
};

export const ELITE_MEMBER_TYPES: Record<EliteMember, Types> = {
  [EliteMember.Lorelei]: Types.Ice,
  [EliteMember.Bruno]: Types.Fighting,
  [EliteMember.Agatha]: Types.Ghost,
  [EliteMember.Lance]: Types.Dragon,
};

export const ELITE_MEMBER_HONORS: Record<EliteMember, Awards> = {
  [EliteMember.Lorelei]: Awards.LoreleiDefeated,
  [EliteMember.Bruno]: Awards.BrunoDefeated,
  [EliteMember.Agatha]: Awards.AgathaDefeated,
  [EliteMember.Lance]: Awards.LanceDefeated,
};

export const ELITE_MEMBER_CHARSETS: Record<EliteMember, string[]> = {
  [EliteMember.Lorelei]: ['characters/frlg/lorelei'],
  [EliteMember.Bruno]: ['characters/frlg/bruno', 'characters/lgpe/bruno'],
  [EliteMember.Agatha]: ['characters/frlg/agatha', 'characters/lgpe/agatha'],
  [EliteMember.Lance]: ['characters/frlg/lance', 'characters/lgpe/lance'],
};

/**
 * Which of the Elite Four hold each biome's seats, by the same rule
 * the gyms follow: ice country is Lorelei's, hard dry ground is
 * Bruno's, the dark and the damp are Agatha's, and everything green
 * or under water is Lance's. A list per biome for the same reason
 * the gyms keep one: later regions seat more elites
 */
export const BIOME_ELITE_MEMBERS: Record<Biome, EliteMember[]> = {
  [Biome.Glacier]: [EliteMember.Lorelei],
  [Biome.Tundra]: [EliteMember.Lorelei],
  [Biome.ColdDesert]: [EliteMember.Lorelei],
  [Biome.AlpineTundra]: [EliteMember.Lorelei],
  [Biome.Taiga]: [EliteMember.Lorelei],
  [Biome.PolarOcean]: [EliteMember.Lorelei],
  [Biome.Mountain]: [EliteMember.Bruno],
  [Biome.Badlands]: [EliteMember.Bruno],
  [Biome.Desert]: [EliteMember.Bruno],
  [Biome.Steppe]: [EliteMember.Bruno],
  [Biome.Shrubland]: [EliteMember.Bruno],
  [Biome.Savanna]: [EliteMember.Bruno],
  [Biome.RockyCoast]: [EliteMember.Bruno],
  [Biome.Swamp]: [EliteMember.Agatha],
  [Biome.Bog]: [EliteMember.Agatha],
  [Biome.Mangrove]: [EliteMember.Agatha],
  [Biome.TemperateRainforest]: [EliteMember.Agatha],
  [Biome.Beyond]: [EliteMember.Agatha],
  [Biome.DeepOcean]: [EliteMember.Lance],
  [Biome.Ocean]: [EliteMember.Lance],
  [Biome.CoralReef]: [EliteMember.Lance],
  [Biome.Beach]: [EliteMember.Lance],
  [Biome.KelpForest]: [EliteMember.Lance],
  [Biome.TropicalRainforest]: [EliteMember.Lance],
  [Biome.TropicalSeasonalForest]: [EliteMember.Lance],
  [Biome.Grassland]: [EliteMember.Lance],
  [Biome.TemperateForest]: [EliteMember.Lance],
  [Biome.Woodland]: [EliteMember.Lance],
  [Biome.MontaneForest]: [EliteMember.Lance],
  [Biome.Volcano]: [EliteMember.Lance],
};

/**
 * The Champion of Kanto. Blue runs the 8th gym here, so the seat at
 * the top is Red's
 */
export const CHAMPION_NAME = 'Red';

export const CHAMPION_CHARSETS: string[] = ['characters/frlg/red', 'characters/lgpe/red'];

/**
 * The species an expert may field: every base form of their own
 * region and their named type, or of any type for an expert with no
 * specialty. Lair species stay out (a legendary belongs to its raid),
 * and so does the egg
 */
const LAIR_SPECIES = new Set(EVERY_LAIR.map(getLairSpecies));

export function getExpertPool(region: Regions, type: Types | null): Species[] {
  return getSpeciesByRegion(region).filter((species) => {
    if (species === Species.Egg || LAIR_SPECIES.has(species) || !isBaseForm(species)) {
      return false;
    }
    return type == null || getSpeciesData(species).types.includes(type);
  });
}
