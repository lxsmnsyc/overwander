import { SpawnRarity, getSpawnRarity } from '../biome';
import { Types } from '../constants/types';
import Awards, { JOHTO_BADGES, JOHTO_HONORS, KANTO_BADGES, KANTO_HONORS } from '../ids/awards';
import Biome from '../ids/biome';
import EggGroups from '../ids/egg-groups';
import { type Items, getMachineItem } from '../ids/items';
import { Species } from '../ids/species';
import { getTeachableMoves } from '../items/machines';
import { getMoveData } from '../moves';
import { EVERY_LAIR, getLairResidents } from './lair';
import { getRegisteredSpecies, getSpeciesData, isBaseForm } from '../species';

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

/**
 * The sixteen leaders of the two regions, numbered Kanto's eight then
 * Johto's. Which of them a country seats is the table below
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
  [Biome.DeepOcean]: [GymLeader.Misty, GymLeader.Falkner],
  [Biome.Ocean]: [GymLeader.Misty, GymLeader.Falkner],
  [Biome.CoralReef]: [GymLeader.Misty],
  [Biome.Beach]: [GymLeader.Misty, GymLeader.Falkner, GymLeader.Whitney],
  [Biome.Mangrove]: [GymLeader.Koga, GymLeader.Bugsy],
  [Biome.KelpForest]: [GymLeader.Misty],
  [Biome.PolarOcean]: [GymLeader.Misty, GymLeader.Falkner, GymLeader.Pryce],
  [Biome.Glacier]: [GymLeader.Misty, GymLeader.Pryce],
  [Biome.Tundra]: [GymLeader.Misty, GymLeader.Pryce, GymLeader.Falkner, GymLeader.Whitney],
  [Biome.Swamp]: [GymLeader.Koga, GymLeader.Morty, GymLeader.Bugsy],
  [Biome.Bog]: [GymLeader.Koga, GymLeader.Morty],
  [Biome.TropicalSeasonalForest]: [
    GymLeader.Erika,
    GymLeader.Bugsy,
    GymLeader.Whitney,
    GymLeader.Falkner,
  ],
  [Biome.Grassland]: [GymLeader.Erika, GymLeader.Whitney, GymLeader.Bugsy, GymLeader.Falkner],
  [Biome.TemperateForest]: [GymLeader.Erika, GymLeader.Bugsy, GymLeader.Whitney, GymLeader.Morty],
  [Biome.Woodland]: [GymLeader.Erika, GymLeader.Bugsy, GymLeader.Whitney],
  [Biome.Savanna]: [GymLeader.LtSurge, GymLeader.Falkner, GymLeader.Chuck, GymLeader.Giovanni],
  [Biome.Steppe]: [GymLeader.LtSurge, GymLeader.Falkner, GymLeader.Giovanni],
  [Biome.Desert]: [GymLeader.Blaine, GymLeader.Giovanni],
  [Biome.Volcano]: [GymLeader.Blaine, GymLeader.Jasmine, GymLeader.Clair],
  [Biome.ColdDesert]: [GymLeader.Brock, GymLeader.Pryce, GymLeader.Jasmine, GymLeader.Giovanni],
  [Biome.Mountain]: [
    GymLeader.Brock,
    GymLeader.Chuck,
    GymLeader.Jasmine,
    GymLeader.Clair,
    GymLeader.Giovanni,
  ],
  [Biome.AlpineTundra]: [GymLeader.Brock, GymLeader.Pryce, GymLeader.Falkner, GymLeader.Clair],
  [Biome.Badlands]: [GymLeader.Brock, GymLeader.Chuck, GymLeader.Jasmine, GymLeader.Giovanni],
  [Biome.RockyCoast]: [GymLeader.Brock, GymLeader.Falkner],
  [Biome.TemperateRainforest]: [GymLeader.Sabrina, GymLeader.Bugsy, GymLeader.Morty],
  [Biome.MontaneForest]: [GymLeader.Sabrina, GymLeader.Bugsy],
  [Biome.Beyond]: [GymLeader.Sabrina, GymLeader.Morty, GymLeader.Clair],
  [Biome.TropicalRainforest]: [GymLeader.Bugsy, GymLeader.Erika],
  [Biome.Shrubland]: [GymLeader.Whitney, GymLeader.Bugsy],
  [Biome.Taiga]: [GymLeader.Bugsy, GymLeader.Falkner, GymLeader.Pryce],
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

/**
 * The two leagues' Elite Four, numbered Kanto's then Johto's. Bruno
 * is here twice because he keeps a seat in each: two fights, two
 * marks, and a challenger who has only walked one region's gyms is
 * taken by the Bruno of that region alone
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
}

export { EliteMember };

export const ELITE_MEMBERS: EliteMember[] = [
  EliteMember.Lorelei,
  EliteMember.Bruno,
  EliteMember.Agatha,
  EliteMember.Lance,
  EliteMember.Will,
  EliteMember.Koga,
  EliteMember.Karen,
  EliteMember.JohtoBruno,
];

export const ELITE_MEMBER_NAMES: Record<EliteMember, string> = {
  [EliteMember.Lorelei]: 'Lorelei',
  [EliteMember.Bruno]: 'Bruno',
  [EliteMember.Agatha]: 'Agatha',
  [EliteMember.Lance]: 'Lance',
  [EliteMember.Will]: 'Will',
  [EliteMember.Koga]: 'Koga',
  [EliteMember.Karen]: 'Karen',
  [EliteMember.JohtoBruno]: 'Bruno',
};

export const ELITE_MEMBER_TYPES: Record<EliteMember, Types> = {
  [EliteMember.Lorelei]: Types.Ice,
  [EliteMember.Bruno]: Types.Fighting,
  [EliteMember.Agatha]: Types.Ghost,
  [EliteMember.Lance]: Types.Dragon,
  [EliteMember.Will]: Types.Psychic,
  [EliteMember.Koga]: Types.Poison,
  [EliteMember.Karen]: Types.Dark,
  [EliteMember.JohtoBruno]: Types.Fighting,
};

export const ELITE_MEMBER_HONORS: Record<EliteMember, Awards> = {
  [EliteMember.Lorelei]: Awards.LoreleiDefeated,
  [EliteMember.Bruno]: Awards.BrunoDefeated,
  [EliteMember.Agatha]: Awards.AgathaDefeated,
  [EliteMember.Lance]: Awards.LanceDefeated,
  [EliteMember.Will]: Awards.WillDefeated,
  [EliteMember.Koga]: Awards.KogaDefeated,
  [EliteMember.Karen]: Awards.KarenDefeated,
  [EliteMember.JohtoBruno]: Awards.JohtoBrunoDefeated,
};

/**
 * The badge case an elite asks to see before they will fight: their
 * own league's. Bruno asks for both, because his one mark is counted
 * by both leagues, and a mark that opens two doors is worth two
 * regions of gyms
 */
export function getEliteBadges(member: EliteMember): Awards[] {
  const honor = ELITE_MEMBER_HONORS[member];

  return [
    ...(KANTO_HONORS.includes(honor) ? KANTO_BADGES : []),
    ...(JOHTO_HONORS.includes(honor) ? JOHTO_BADGES : []),
  ];
}

export const ELITE_MEMBER_CHARSETS: Record<EliteMember, string[]> = {
  [EliteMember.Lorelei]: ['characters/frlg/lorelei'],
  [EliteMember.Bruno]: ['characters/frlg/bruno', 'characters/lgpe/bruno'],
  [EliteMember.Agatha]: ['characters/frlg/agatha', 'characters/lgpe/agatha'],
  [EliteMember.Lance]: ['characters/frlg/lance', 'characters/lgpe/lance'],
  [EliteMember.Will]: ['characters/hgss/will'],
  // His Heart Gold sheet alone. The other two are the gym leader's,
  // and a sprite is unlocked by one deed: the Soul Badge is what he
  // is worn off in Kanto, his mark is what he is worn off in Johto
  [EliteMember.Koga]: ['characters/hgss/koga'],
  [EliteMember.Karen]: ['characters/hgss/karen'],
  // His Heart Gold sheet, the way the rest of Johto's league is
  // drawn. The Kanto seat above keeps the two he is drawn in there
  [EliteMember.JohtoBruno]: ['characters/hgss/bruno'],
};

/**
 * Which of the Elite Four hold each biome's seats, by the same rule
 * the gyms follow: ice country is Lorelei's, hard dry ground is
 * Bruno's, the damp is Agatha's, and everything green or under water
 * is Lance's. Johto's three take the countries their own kind
 * answers to, so a seat holds seven names between two leagues and the
 * chunk's fixture roll says whose it is
 */
export const BIOME_ELITE_MEMBERS: Record<Biome, EliteMember[]> = {
  [Biome.Glacier]: [EliteMember.Lorelei],
  [Biome.Tundra]: [EliteMember.Lorelei],
  [Biome.ColdDesert]: [EliteMember.Lorelei],
  [Biome.AlpineTundra]: [EliteMember.Lorelei],
  [Biome.Taiga]: [EliteMember.Lorelei, EliteMember.Karen],
  [Biome.PolarOcean]: [EliteMember.Lorelei],
  [Biome.Mountain]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Badlands]: [
    EliteMember.Bruno,
    EliteMember.JohtoBruno,
    EliteMember.Koga,
    EliteMember.Karen,
  ],
  [Biome.Desert]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Steppe]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Shrubland]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Savanna]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.RockyCoast]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Swamp]: [EliteMember.Agatha, EliteMember.Koga],
  [Biome.Bog]: [EliteMember.Agatha, EliteMember.Koga, EliteMember.Karen],
  [Biome.Mangrove]: [EliteMember.Agatha, EliteMember.Koga],
  [Biome.TemperateRainforest]: [EliteMember.Agatha, EliteMember.Will, EliteMember.Karen],
  [Biome.Beyond]: [EliteMember.Agatha, EliteMember.Will, EliteMember.Karen],
  [Biome.DeepOcean]: [EliteMember.Lance],
  [Biome.Ocean]: [EliteMember.Lance],
  [Biome.CoralReef]: [EliteMember.Lance],
  [Biome.Beach]: [EliteMember.Lance],
  [Biome.KelpForest]: [EliteMember.Lance, EliteMember.Will],
  [Biome.TropicalRainforest]: [EliteMember.Lance, EliteMember.Koga, EliteMember.Will],
  [Biome.TropicalSeasonalForest]: [EliteMember.Lance],
  [Biome.Grassland]: [EliteMember.Lance],
  [Biome.TemperateForest]: [EliteMember.Lance],
  [Biome.Woodland]: [EliteMember.Lance],
  [Biome.MontaneForest]: [EliteMember.Lance, EliteMember.Will],
  [Biome.Volcano]: [EliteMember.Lance],
};

/**
 * The champions, one to a league. Giovanni runs Kanto's eighth gym
 * here, so the seat at the top of that league is Blue's; Johto's is
 * Lance, who also keeps a seat in Kanto's Elite Four and is drawn in
 * his Heart Gold coat when he is standing at the top
 */
const enum Champion {
  Blue = 0,
  Lance = 1,
}

export { Champion };

export const CHAMPIONS: Champion[] = [Champion.Blue, Champion.Lance];

export const CHAMPION_NAMES: Record<Champion, string> = {
  [Champion.Blue]: 'Blue',
  [Champion.Lance]: 'Lance',
};

export const CHAMPION_CHARSETS: Record<Champion, string[]> = {
  [Champion.Blue]: ['characters/frlg/blue'],
  [Champion.Lance]: ['characters/hgss/lance', 'characters/hgss/lance-2'],
};

/** The title a champion's seat is worth */
export const CHAMPION_TITLES: Record<Champion, Awards> = {
  [Champion.Blue]: Awards.KantoChampion,
  [Champion.Lance]: Awards.JohtoChampion,
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
};

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
}

export { Legend };

export const LEGENDS: Legend[] = [Legend.Red];

export const LEGEND_NAMES: Record<Legend, string> = {
  [Legend.Red]: 'Red',
};

export const LEGEND_CHARSETS: Record<Legend, string[]> = {
  [Legend.Red]: ['characters/frlg/red'],
};

/** The mark beating one is worth, which is the only thing they pay */
export const LEGEND_HONORS: Record<Legend, Awards> = {
  [Legend.Red]: Awards.RedDefeated,
};

/**
 * And the coats that mark unlocks. Not the one they wander in: Red's
 * Fire Red sheet is what the game starts everybody as, so a mark that
 * unlocked it would be worth nothing to wear. These are the other two
 * of him, the Mt. Silver coat first
 */
export const LEGEND_PRIZE_CHARSETS: Record<Legend, string[]> = {
  [Legend.Red]: ['characters/hgss/red', 'characters/lgpe/red'],
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
};

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
  // The Ground half brings the heavy ground with it, and overlaps
  // Brock's rock at Golem and Rhydon, which is right: they are the
  // same pokemon a fighting specialist and a rock specialist would
  // both want. Onix is named, since a Steelix above him puts him
  // below the band the rules read
  [EliteMember.Bruno]: {
    types: [Types.Fighting, Types.Ground],
    also: [Species.Onix],
  },
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
  // Johto's three each field a type wide enough to stand on its own,
  // so none of them needs a widener
  [EliteMember.Will]: { types: [Types.Psychic] },
  [EliteMember.Koga]: { types: [Types.Poison] },
  [EliteMember.Karen]: { types: [Types.Dark] },
  [EliteMember.JohtoBruno]: {
    types: [Types.Fighting, Types.Ground],
    also: [Species.Onix],
  },
};

/**
 * The one an elite is remembered for, standing last the way a gym
 * leader's does. Bruno's is his Machamp in both leagues, since Bruno
 * is in both
 */
export const ELITE_MEMBER_SIGNATURES: Record<EliteMember, Species> = {
  [EliteMember.Lorelei]: Species.Lapras,
  [EliteMember.Bruno]: Species.Machamp,
  [EliteMember.Agatha]: Species.Gengar,
  [EliteMember.Lance]: Species.Dragonite,
  [EliteMember.Will]: Species.Xatu,
  [EliteMember.Koga]: Species.Crobat,
  [EliteMember.Karen]: Species.Houndoom,
  [EliteMember.JohtoBruno]: Species.Machamp,
};

/**
 * And what a gym leader fields: their own type and nothing more, read
 * off the table above rather than kept twice
 */
export function getGymLeaderPool(leader: GymLeader): ExpertPool {
  return { types: [GYM_LEADER_TYPES[leader]] };
}

/**
 * The one pokemon a leader is remembered for, which stands in their
 * sixth slot however the other five roll. It is the mainline ace,
 * so several of them are below the band the other five are drawn
 * from: Brock's Onix is a middle stage now that a Steelix exists,
 * and he brings it anyway
 */
export const GYM_LEADER_SIGNATURES: Record<GymLeader, Species> = {
  [GymLeader.Brock]: Species.Onix,
  [GymLeader.Misty]: Species.Starmie,
  [GymLeader.LtSurge]: Species.Raichu,
  [GymLeader.Erika]: Species.Vileplume,
  [GymLeader.Koga]: Species.Weezing,
  [GymLeader.Sabrina]: Species.Alakazam,
  [GymLeader.Blaine]: Species.Arcanine,
  [GymLeader.Giovanni]: Species.Rhydon,
  [GymLeader.Falkner]: Species.Pidgeotto,
  [GymLeader.Bugsy]: Species.Scyther,
  [GymLeader.Whitney]: Species.Miltank,
  [GymLeader.Morty]: Species.Gengar,
  [GymLeader.Chuck]: Species.Poliwrath,
  [GymLeader.Jasmine]: Species.Steelix,
  [GymLeader.Pryce]: Species.Piloswine,
  [GymLeader.Clair]: Species.Kingdra,
};

/**
 * The species an expert may field out of a roster: the **rare** band
 * of it, which is the fully-evolved and single-line species, narrowed
 * to what their pool counts as theirs.
 *
 * The band is the whole of what separates them from a duelling
 * trainer: a leader fielding the same Bellsprout a player meets in the
 * grass is a leader nobody remembers beating. It leaves the babies and
 * the legendaries out with the half-grown, which is right for both.
 * A legendary belongs to its raid, and the egg to nothing at all.
 *
 * Which roster is the caller's: an elite fields their own region,
 * a gym leader every region there is
 */
const LAIR_SPECIES = new Set(EVERY_LAIR.flatMap(getLairResidents));

function filterExpertPool(roster: Species[], pool: ExpertPool): Species[] {
  const types = new Set(pool.types);
  const groups = new Set(pool.eggGroups);
  const named = new Set(pool.also);

  return roster.filter((species) => {
    if (species === Species.Egg || LAIR_SPECIES.has(species) || !isBaseForm(species)) {
      return false;
    }
    // Naming beats the band as well as the type rules. Bruno's Onix
    // and Agatha's Golbat are middle stages now that a Steelix and a
    // Crobat exist, and they are still the pokemon those two field
    if (named.has(species)) {
      return true;
    }
    if (getSpawnRarity(species) !== SpawnRarity.Rare) {
      return false;
    }
    // An expert with no specialty takes the band whole
    if (types.size === 0) {
      return true;
    }

    const data = getSpeciesData(species);

    return (
      data.types.some((type) => types.has(type)) ||
      data.eggGroups.some((group) => groups.has(group))
    );
  });
}

/**
 * The five an expert rolls, which is their kind's band from every
 * region rather than the one they are standing in. A gym is a fight
 * about a type, so a steel gym should reach a Steelix wherever the
 * badge is handed out, and Karen's dark has nothing at all in Kanto
 */
export function getWorldExpertPool(pool: ExpertPool): Species[] {
  return filterExpertPool(getRegisteredSpecies(), pool);
}

export function getGymLeaderRoster(leader: GymLeader): Species[] {
  return getWorldExpertPool(getGymLeaderPool(leader));
}

export function getEliteMemberRoster(member: EliteMember): Species[] {
  return getWorldExpertPool(ELITE_MEMBER_POOLS[member]);
}
