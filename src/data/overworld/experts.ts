import { SpawnRarity, getSpawnRarity } from '../biome';
import { Types } from '../constants/types';
import Awards from '../ids/awards';
import Biome from '../ids/biome';
import EggGroups from '../ids/egg-groups';
import { type Items, getMachineItem } from '../ids/items';
import Regions from '../ids/regions';
import { Species } from '../ids/species';
import { getTeachableMoves } from '../items/machines';
import { getMoveData } from '../moves';
import { EVERY_LAIR, getLairResidents } from './lair';
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

/**
 * The machine a beaten leader hands over: one of the TMs of their own
 * type, rolled by the caller's draw. Blue, with no specialty, reaches
 * into the whole case. Null only if a type somehow teaches nothing
 */
export function rollGymMachine(leader: GymLeader, random: () => number): Items | null {
  const type = GYM_LEADER_TYPES[leader] ?? null;
  const moves = getTeachableMoves().filter(
    (move) => type == null || getMoveData(move).type === type,
  );
  const move = moves.at(Math.floor(random() * moves.length));

  return move == null ? null : getMachineItem(move);
}

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
 * The Champion's own six, by region.
 *
 * A champion is the one expert who does not draw from a pool: the
 * team is the character, and a player who has walked the whole league
 * to reach them should meet the party they are known for. Red's is
 * his Mt. Silver line-up from HeartGold and SoulSilver, which is the
 * version of it made entirely of Kanto species.
 *
 * A region with no entry has no champion to stand: nothing is
 * invented for it, and the seat stays empty until the team is known
 */
export const CHAMPION_PARTIES: Partial<Record<Regions, Species[]>> = {
  [Regions.Kanto]: [
    Species.Pikachu,
    Species.Lapras,
    Species.Snorlax,
    Species.Venusaur,
    Species.Charizard,
    Species.Blastoise,
  ],
};

export function getChampionParty(region: Regions): Species[] | null {
  return CHAMPION_PARTIES[region] ?? null;
}

/**
 * What counts as an expert's own.
 *
 * A type alone is too narrow for some of them: Kanto has one
 * fully-grown Ghost and one fully-grown Dragon, so Agatha and Lance
 * would each field six of the same pokemon. The wideners are the ones
 * the mainline's own teams are built from. **Kinship** the type table
 * misses, since Lance's Gyarados is a dragon by breeding and nothing
 * else; and the odd pokemon that is simply **theirs**, since Bruno's
 * Onix answers to no rule at all.
 *
 * Every route is still held to the rare band, so `also` cannot smuggle
 * a Magikarp or a Mewtwo onto a team
 */
export interface ExpertPool {
  /** The types that count as theirs; empty for an expert with none */
  types: Types[];
  /** Egg groups that count as theirs besides */
  eggGroups?: EggGroups[];
  /** Named species no rule reaches */
  also?: Species[];
}

/**
 * What each of the Elite Four fields.
 *
 * Each widening is the one their mainline team actually shows. Bruno
 * brings hard ground along with the muscle, Agatha's ghosts keep the
 * company they keep, and Lance's dragons are read off the breeding
 * table rather than the type chart
 */
export const ELITE_MEMBER_POOLS: Record<EliteMember, ExpertPool> = {
  // Slowbro is hers in every game she appears in and there is nothing
  // icy about him, so he is named rather than derived
  [EliteMember.Lorelei]: { types: [Types.Ice], also: [Species.Slowbro] },
  // The Ground half is his two Onix, and it brings the rest of the
  // heavy ground with it. It overlaps Brock's rock at Golem, Onix and
  // Rhydon, which is right: they are the same three pokemon a
  // fighting specialist and a rock specialist would both want
  [EliteMember.Bruno]: { types: [Types.Fighting, Types.Ground] },
  // Not the Poison **type**, which in Kanto is Koga's pool exactly
  // and would make her a second Koga. The Amorphous group is what her
  // ghosts have in common, and her Golbat and Arbok are named
  [EliteMember.Agatha]: {
    types: [Types.Ghost],
    eggGroups: [EggGroups.Amorphous],
    also: [Species.Golbat, Species.Arbok],
  },
  // The Dragon egg group is the whole point: it is why a Gyarados
  // stands on a dragon master's team. Aerodactyl is a dragon by
  // neither rule and by every eye, so he is named
  [EliteMember.Lance]: {
    types: [Types.Dragon],
    eggGroups: [EggGroups.Dragon],
    also: [Species.Aerodactyl],
  },
};

/**
 * And what a gym leader fields: their own type and nothing more, read
 * off the table above rather than kept twice. Blue, with no specialty,
 * takes the whole band
 */
export function getGymLeaderPool(leader: GymLeader): ExpertPool {
  const type = GYM_LEADER_TYPES[leader];

  return { types: type == null ? [] : [type] };
}

/**
 * The species an expert may field: the **rare** band of their own
 * region, which is the fully-evolved and single-line species, narrowed
 * to what their pool counts as theirs.
 *
 * The band is the whole of what separates them from a duelling
 * trainer: a leader fielding the same Bellsprout a player meets in the
 * grass is a leader nobody remembers beating. It leaves the babies and
 * the legendaries out with the half-grown, which is right for both.
 * A legendary belongs to its raid, and the egg to nothing at all
 */
const LAIR_SPECIES = new Set(EVERY_LAIR.flatMap(getLairResidents));

export function getExpertPool(region: Regions, pool: ExpertPool): Species[] {
  const types = new Set(pool.types);
  const groups = new Set(pool.eggGroups);
  const named = new Set(pool.also);

  return getSpeciesByRegion(region).filter((species) => {
    if (species === Species.Egg || LAIR_SPECIES.has(species) || !isBaseForm(species)) {
      return false;
    }
    if (getSpawnRarity(species) !== SpawnRarity.Rare) {
      return false;
    }
    // An expert with no specialty takes the band whole
    if (types.size === 0 || named.has(species)) {
      return true;
    }

    const data = getSpeciesData(species);

    return (
      data.types.some((type) => types.has(type)) ||
      data.eggGroups.some((group) => groups.has(group))
    );
  });
}
