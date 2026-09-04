import turns from '../../battle/turn';
import { isGrownSpecies } from '../biome';
import { Types } from '../constants/types';
import Awards, {
  HOENN_BADGES,
  HOENN_HONORS,
  JOHTO_BADGES,
  JOHTO_HONORS,
  KANTO_BADGES,
  KANTO_HONORS,
} from '../ids/awards';
import Biome from '../ids/biome';
import { Statuses } from '../ids/status';
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
  Sidney = 8,
  Phoebe = 9,
  Glacia = 10,
  Drake = 11,
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
  EliteMember.Sidney,
  EliteMember.Phoebe,
  EliteMember.Glacia,
  EliteMember.Drake,
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
  [EliteMember.Sidney]: 'Sidney',
  [EliteMember.Phoebe]: 'Phoebe',
  [EliteMember.Glacia]: 'Glacia',
  [EliteMember.Drake]: 'Drake',
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
  [EliteMember.Sidney]: Types.Dark,
  [EliteMember.Phoebe]: Types.Ghost,
  [EliteMember.Glacia]: Types.Ice,
  [EliteMember.Drake]: Types.Dragon,
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
  [EliteMember.Sidney]: Awards.SidneyDefeated,
  [EliteMember.Phoebe]: Awards.PhoebeDefeated,
  [EliteMember.Glacia]: Awards.GlaciaDefeated,
  [EliteMember.Drake]: Awards.DrakeDefeated,
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
    ...(HOENN_HONORS.includes(honor) ? HOENN_BADGES : []),
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
  [EliteMember.Sidney]: ['characters/oras/sidney'],
  [EliteMember.Phoebe]: ['characters/oras/phoebe'],
  [EliteMember.Glacia]: ['characters/oras/glacia'],
  [EliteMember.Drake]: ['characters/oras/drake'],
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
  [Biome.Glacier]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.Tundra]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.ColdDesert]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.AlpineTundra]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.Taiga]: [EliteMember.Lorelei, EliteMember.Karen, EliteMember.Glacia, EliteMember.Sidney],
  [Biome.PolarOcean]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.Mountain]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Badlands]: [
    EliteMember.Bruno,
    EliteMember.JohtoBruno,
    EliteMember.Koga,
    EliteMember.Karen,
    EliteMember.Sidney,
  ],
  [Biome.Desert]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Steppe]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Shrubland]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Savanna]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.RockyCoast]: [EliteMember.Bruno, EliteMember.JohtoBruno],
  [Biome.Swamp]: [EliteMember.Agatha, EliteMember.Koga, EliteMember.Phoebe],
  [Biome.Bog]: [
    EliteMember.Agatha,
    EliteMember.Koga,
    EliteMember.Karen,
    EliteMember.Sidney,
    EliteMember.Phoebe,
  ],
  [Biome.Mangrove]: [EliteMember.Agatha, EliteMember.Koga, EliteMember.Phoebe],
  [Biome.TemperateRainforest]: [
    EliteMember.Agatha,
    EliteMember.Will,
    EliteMember.Karen,
    EliteMember.Sidney,
    EliteMember.Phoebe,
  ],
  [Biome.Beyond]: [
    EliteMember.Agatha,
    EliteMember.Will,
    EliteMember.Karen,
    EliteMember.Sidney,
    EliteMember.Phoebe,
  ],
  [Biome.DeepOcean]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.Ocean]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.CoralReef]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.Beach]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.KelpForest]: [EliteMember.Lance, EliteMember.Will, EliteMember.Drake],
  [Biome.TropicalRainforest]: [
    EliteMember.Lance,
    EliteMember.Koga,
    EliteMember.Will,
    EliteMember.Drake,
  ],
  [Biome.TropicalSeasonalForest]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.Grassland]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.TemperateForest]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.Woodland]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.MontaneForest]: [EliteMember.Lance, EliteMember.Will, EliteMember.Drake],
  [Biome.Volcano]: [EliteMember.Lance, EliteMember.Drake],
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
  // Hoenn's four field their type and nothing else: each of their
  // mainline teams is that type all the way down, Sableye and Kingdra
  // included, so there is nothing for a widener to reach
  [EliteMember.Sidney]: { types: [Types.Dark] },
  [EliteMember.Phoebe]: { types: [Types.Ghost] },
  [EliteMember.Glacia]: { types: [Types.Ice] },
  [EliteMember.Drake]: { types: [Types.Dragon] },
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
  [EliteMember.Sidney]: Species.Absol,
  [EliteMember.Phoebe]: Species.Dusclops,
  [EliteMember.Glacia]: Species.Walrein,
  [EliteMember.Drake]: Species.Salamence,
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
  [GymLeader.Roxanne]: Species.Nosepass,
  [GymLeader.Brawly]: Species.Hariyama,
  [GymLeader.Wattson]: Species.Manectric,
  [GymLeader.Flannery]: Species.Torkoal,
  [GymLeader.Norman]: Species.Slaking,
  [GymLeader.Winona]: Species.Altaria,
  [GymLeader.Tate]: Species.Solrock,
  [GymLeader.Liza]: Species.Lunatone,
  // The same ace Clair brings, which is the mainline's own doing:
  // two water-and-dragon gyms, one Kingdra between them
  [GymLeader.Juan]: Species.Kingdra,
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
    if (!isGrownSpecies(species)) {
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

/**
 * The Frontier Brains: the house champion of a facility, and the
 * rank above the league.
 *
 * What sets them apart from every seat below is not the party but the
 * **rule**. A gym is a type, an elite is a type with a widener, a
 * champion is a fixed six; a Brain is a fight held under the house's
 * own terms, and the party is only what those terms are demonstrated
 * with. Six of the seven are open; the Dome is the one still shut,
 * since its rule is a bracket rather than a term
 */
const enum FrontierBrain {
  Brandon = 0,
  Greta = 1,
  Lucy = 2,
  Noland = 3,
  Anabel = 4,
  Spenser = 5,
}

export { FrontierBrain };

export const FRONTIER_BRAINS: FrontierBrain[] = [
  FrontierBrain.Brandon,
  FrontierBrain.Greta,
  FrontierBrain.Lucy,
  FrontierBrain.Noland,
  FrontierBrain.Anabel,
  FrontierBrain.Spenser,
];

export const FRONTIER_BRAIN_NAMES: Record<FrontierBrain, string> = {
  [FrontierBrain.Brandon]: 'Brandon',
  [FrontierBrain.Greta]: 'Greta',
  [FrontierBrain.Lucy]: 'Lucy',
  [FrontierBrain.Noland]: 'Noland',
  [FrontierBrain.Anabel]: 'Anabel',
  [FrontierBrain.Spenser]: 'Spenser',
};

/** The house each of them keeps, which is what the rule is named for */
export const FRONTIER_FACILITY_NAMES: Record<FrontierBrain, string> = {
  [FrontierBrain.Brandon]: 'Battle Pyramid',
  [FrontierBrain.Greta]: 'Battle Arena',
  [FrontierBrain.Lucy]: 'Battle Pike',
  [FrontierBrain.Noland]: 'Battle Factory',
  [FrontierBrain.Anabel]: 'Battle Tower',
  [FrontierBrain.Spenser]: 'Battle Palace',
};

export const FRONTIER_BRAIN_CHARSETS: Record<FrontierBrain, string[]> = {
  [FrontierBrain.Brandon]: ['characters/rse/brandon'],
  [FrontierBrain.Greta]: ['characters/rse/greta'],
  [FrontierBrain.Lucy]: ['characters/rse/lucy'],
  [FrontierBrain.Noland]: ['characters/rse/noland'],
  [FrontierBrain.Anabel]: ['characters/rse/anabel'],
  [FrontierBrain.Spenser]: ['characters/rse/spenser'],
};

/**
 * The pair each facility hangs on the shelf.
 *
 * Silver for taking the house. Holding it is what brings the Brain's
 * second three out the next time, and taking **that** is the gold
 * one: the two symbols are two different fights rather than one
 * fight scored two ways
 */
export const FRONTIER_BRAIN_SYMBOLS: Record<FrontierBrain, [silver: Awards, gold: Awards]> = {
  [FrontierBrain.Brandon]: [Awards.SilverBraveSymbol, Awards.GoldBraveSymbol],
  [FrontierBrain.Greta]: [Awards.SilverGutsSymbol, Awards.GoldGutsSymbol],
  [FrontierBrain.Lucy]: [Awards.SilverLuckSymbol, Awards.GoldLuckSymbol],
  [FrontierBrain.Noland]: [Awards.SilverKnowledgeSymbol, Awards.GoldKnowledgeSymbol],
  [FrontierBrain.Anabel]: [Awards.SilverAbilitySymbol, Awards.GoldAbilitySymbol],
  [FrontierBrain.Spenser]: [Awards.SilverSpiritsSymbol, Awards.GoldSpiritsSymbol],
};

/**
 * The three they field.
 *
 * Three rather than six is the Frontier's own shape, and it is the
 * whole reason a house rule bites: fighting bare across three
 * pokemon is a constraint, across six it is a nuisance. Both are the
 * teams they defend their houses with in Emerald
 */
export const FRONTIER_BRAIN_PARTIES: Record<FrontierBrain, Species[]> = {
  // The Pyramid King fields the three that were sealed in chambers,
  // which is the one party in the game a legendary belongs to
  [FrontierBrain.Brandon]: [Species.Regirock, Species.Regice, Species.Registeel],
  [FrontierBrain.Greta]: [Species.Umbreon, Species.Hariyama, Species.Shedinja],
  [FrontierBrain.Lucy]: [Species.Seviper, Species.Shuckle, Species.Milotic],
  // Nobody's: the Factory rents to its own keeper too, so his three
  // are rolled out of the same crate the challenger's come from
  [FrontierBrain.Noland]: [],
  // The Tower's own three, and the hardest hand in the game: an
  // Entei among them, which is what a house with no rule has instead
  // of one
  [FrontierBrain.Anabel]: [Species.Alakazam, Species.Entei, Species.Snorlax],
  // Three that read as three different temperaments, which is what
  // the Palace is asking about
  [FrontierBrain.Spenser]: [Species.Crobat, Species.Slaking, Species.Lapras],
};

/**
 * And the second hand, fielded once the challenger holds that
 * house's silver symbol.
 *
 * A Brain is fought twice in the mainline and the second meeting is
 * its own fight rather than a rematch, so it is its own party here
 * too. Brandon's three are the same either time, which is the
 * mainline's own answer: what he changes between them is the level
 * and the loadout, not who is in the crate. Noland names nobody
 * twice over, since the Factory rents both meetings
 */
export const FRONTIER_BRAIN_GOLD_PARTIES: Record<FrontierBrain, Species[]> = {
  [FrontierBrain.Brandon]: [Species.Regirock, Species.Regice, Species.Registeel],
  [FrontierBrain.Greta]: [Species.Gengar, Species.Breloom, Species.Umbreon],
  [FrontierBrain.Lucy]: [Species.Seviper, Species.Steelix, Species.Gyarados],
  [FrontierBrain.Noland]: [],
  [FrontierBrain.Anabel]: [Species.Raikou, Species.Snorlax, Species.Latios],
  [FrontierBrain.Spenser]: [Species.Arcanine, Species.Slaking, Species.Suicune],
};

/**
 * What a house fields against this challenger: its second three where
 * they already hold its silver symbol, its first where they do not
 */
export function getFrontierParty(brain: FrontierBrain, gold: boolean): Species[] {
  return gold ? FRONTIER_BRAIN_GOLD_PARTIES[brain] : FRONTIER_BRAIN_PARTIES[brain];
}

/**
 * How many a side a Frontier fight is fought with, the house's rather
 * than the league's
 */
export const FRONTIER_TEAM_SIZE = 3;

/**
 * The house rules, one per facility.
 *
 * A rule is stored on the battle it was fought under, the way the
 * limits and the sky are, so a fight replays as the fight it was
 */
export const enum FrontierRule {
  /** No rule at all: the fight is the ordinary one */
  None = 0,
  /**
   * The Pyramid, walked with nothing in hand. Neither side holds an
   * item, so a Focus Sash and a bag of berries are worth nothing and
   * the three pokemon are the whole of what was brought
   */
  Bare = 1,
  /**
   * The Arena, judged. The fight is stopped on the clock, and the
   * side with the greater share of its health still standing takes
   * it, which is the closest a real-time fight comes to being scored
   */
  Timed = 2,
  /**
   * The Pike, walked through a curtain. What is behind it is rolled
   * when the challenge is taken and it lands on the challenger's
   * party alone: the house is not walking through its own rooms
   */
  Curtained = 3,
  /**
   * The Factory, fought with three the house lends. Neither side
   * brings its own, so nothing of the challenger's is on the field
   * and nothing of theirs comes off it: no health lost, no item
   * spent, no candy earned. What is being tested is what they can do
   * with three pokemon they have never met
   */
  Rented = 4,
  /**
   * The Palace, fought on temperament. Every pokemon on the field
   * picks by its own nature rather than on the merits of the move,
   * so which three are brought is a question of who they are and not
   * of what they cover
   */
  Natured = 5,
}

export const FRONTIER_BRAIN_RULES: Record<FrontierBrain, FrontierRule> = {
  [FrontierBrain.Brandon]: FrontierRule.Bare,
  [FrontierBrain.Greta]: FrontierRule.Timed,
  [FrontierBrain.Lucy]: FrontierRule.Curtained,
  [FrontierBrain.Noland]: FrontierRule.Rented,
  // The Tower asks nothing, which is the point of it: it is the
  // fight the other four are read against
  [FrontierBrain.Anabel]: FrontierRule.None,
  [FrontierBrain.Spenser]: FrontierRule.Natured,
};

/**
 * How long the Arena gives a fight before it is judged. Ten mainline
 * turns, which is the shape the facility judges in: long enough for
 * three a side to commit to something, short enough that stalling is
 * a decision rather than a plan
 */
export const FRONTIER_TIME_TURNS = 10;
export const FRONTIER_TIME_LIMIT = turns(FRONTIER_TIME_TURNS);

/**
 * What a Brain asks to see: the crown of the region their house
 * stands in. The Frontier is what a league is walked to reach, so
 * nobody is admitted who has not taken one
 */
export const FRONTIER_BRAIN_TITLES: Record<FrontierBrain, Awards> = {
  [FrontierBrain.Brandon]: Awards.HoennChampion,
  [FrontierBrain.Greta]: Awards.HoennChampion,
  [FrontierBrain.Lucy]: Awards.HoennChampion,
  [FrontierBrain.Noland]: Awards.HoennChampion,
  [FrontierBrain.Anabel]: Awards.HoennChampion,
  [FrontierBrain.Spenser]: Awards.HoennChampion,
};

/**
 * What is behind the Pike's curtain.
 *
 * The mainline's rooms come to the same handful of things: something
 * is wrong with your party on the far side, or somebody was kind. The
 * roll is taken when the challenge is accepted and baked into the
 * party as it is frozen, so what the curtain did is part of the fight
 * rather than something rolled again on every watch
 */
export const enum PikeCurtain {
  Poisoned = 0,
  Burned = 1,
  Paralysed = 2,
  Asleep = 3,
  /** The kind room: the party walks out mended, whatever it walked in as */
  Healed = 4,
}

/**
 * The curtains, in the order they are drawn from. Four of the five
 * cost something and one of them gives, which is the Pike's whole
 * character: it is the one house where walking in is a gamble rather
 * than a test
 */
export const PIKE_CURTAINS: PikeCurtain[] = [
  PikeCurtain.Poisoned,
  PikeCurtain.Burned,
  PikeCurtain.Paralysed,
  PikeCurtain.Asleep,
  PikeCurtain.Healed,
];

/** The status each curtain leaves on the party, or null for the kind one */
export const PIKE_CURTAIN_STATUSES: Record<PikeCurtain, Statuses | null> = {
  [PikeCurtain.Poisoned]: Statuses.Poisoned,
  [PikeCurtain.Burned]: Statuses.Burned,
  [PikeCurtain.Paralysed]: Statuses.Paralyzed,
  [PikeCurtain.Asleep]: Statuses.Sleeping,
  [PikeCurtain.Healed]: null,
};

/** What each curtain is called, for the line the fight is announced with */
export const PIKE_CURTAIN_NAMES: Record<PikeCurtain, string> = {
  [PikeCurtain.Poisoned]: 'poisoned',
  [PikeCurtain.Burned]: 'burned',
  [PikeCurtain.Paralysed]: 'paralysed',
  [PikeCurtain.Asleep]: 'put to sleep',
  [PikeCurtain.Healed]: 'mended',
};

/**
 * Which curtain a roll in [0, 1) draws. Taken from the stop rather
 * than from the clock, so the same challenge is the same room however
 * many times it is looked at
 */
export function pickPikeCurtain(roll: number): PikeCurtain {
  const at = Math.floor(Math.abs(roll) * PIKE_CURTAINS.length);

  return PIKE_CURTAINS[Math.min(at, PIKE_CURTAINS.length - 1)];
}

/**
 * What the Factory has in its crate.
 *
 * Everything an expert could field, from every region: the fully
 * evolved and the single-line species, legendaries and lair residents
 * left out the way every expert pool leaves them out. It is the one
 * pool that widens on its own — every generation registered puts more
 * in the crate, and the house is the harder for it, which is the
 * right way round for a rented fight
 */
export function getRentalPool(): Species[] {
  return getWorldExpertPool({ types: [] });
}

/**
 * How many the Factory lays out for the challenger to choose from.
 * Six for three: the choice is the fight, since nothing in the crate
 * is anybody's and none of it can be looked up beforehand
 */
export const FRONTIER_RENTAL_OFFER = 6;
