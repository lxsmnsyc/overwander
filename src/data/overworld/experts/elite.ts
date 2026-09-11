import { Types } from '../../constants/types';
import Awards, {
  HOENN_BADGES,
  HOENN_HONORS,
  JOHTO_BADGES,
  JOHTO_HONORS,
  KANTO_BADGES,
  KANTO_HONORS,
  SINNOH_BADGES,
  SINNOH_HONORS,
} from '../../ids/awards';
import Biome from '../../ids/biome';

/**
 * The four leagues' Elite Four, numbered Kanto's, Johto's, Hoenn's
 * then Sinnoh's. Bruno is here twice because he keeps a seat in each
 * of the first two: two fights, two marks, and a challenger who has
 * only walked one region's gyms is taken by the Bruno of that region
 * alone
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
  Aaron = 12,
  Bertha = 13,
  Flint = 14,
  Lucian = 15,
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
  EliteMember.Aaron,
  EliteMember.Bertha,
  EliteMember.Flint,
  EliteMember.Lucian,
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
  [EliteMember.Aaron]: 'Aaron',
  [EliteMember.Bertha]: 'Bertha',
  [EliteMember.Flint]: 'Flint',
  [EliteMember.Lucian]: 'Lucian',
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
  [EliteMember.Aaron]: Types.Bug,
  [EliteMember.Bertha]: Types.Ground,
  [EliteMember.Flint]: Types.Fire,
  [EliteMember.Lucian]: Types.Psychic,
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
  [EliteMember.Aaron]: Awards.AaronDefeated,
  [EliteMember.Bertha]: Awards.BerthaDefeated,
  [EliteMember.Flint]: Awards.FlintDefeated,
  [EliteMember.Lucian]: Awards.LucianDefeated,
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
    ...(SINNOH_HONORS.includes(honor) ? SINNOH_BADGES : []),
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
  [EliteMember.Aaron]: ['characters/dppt/aaron'],
  [EliteMember.Bertha]: ['characters/dppt/bertha'],
  [EliteMember.Flint]: ['characters/dppt/flint'],
  [EliteMember.Lucian]: ['characters/dppt/lucian'],
};

/**
 * Which of the Elite Four hold each biome's seats, by the same rule
 * the gyms follow: ice country is Lorelei's, hard dry ground is
 * Bruno's, the damp is Agatha's, and everything green or under water
 * is Lance's. The later leagues take the countries their own kind
 * answers to, so a seat holds several names across four leagues and
 * the chunk's fixture roll says whose it is
 */
export const BIOME_ELITE_MEMBERS: Record<Biome, EliteMember[]> = {
  [Biome.Glacier]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.Tundra]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.ColdDesert]: [EliteMember.Lorelei, EliteMember.Glacia, EliteMember.Bertha],
  [Biome.AlpineTundra]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.Taiga]: [
    EliteMember.Lorelei,
    EliteMember.Karen,
    EliteMember.Glacia,
    EliteMember.Sidney,
    EliteMember.Aaron,
  ],
  [Biome.PolarOcean]: [EliteMember.Lorelei, EliteMember.Glacia],
  [Biome.Mountain]: [EliteMember.Bruno, EliteMember.JohtoBruno, EliteMember.Bertha],
  [Biome.Badlands]: [
    EliteMember.Bruno,
    EliteMember.JohtoBruno,
    EliteMember.Koga,
    EliteMember.Karen,
    EliteMember.Sidney,
    EliteMember.Bertha,
  ],
  [Biome.Desert]: [
    EliteMember.Bruno,
    EliteMember.JohtoBruno,
    EliteMember.Bertha,
    EliteMember.Flint,
  ],
  [Biome.Steppe]: [EliteMember.Bruno, EliteMember.JohtoBruno, EliteMember.Bertha],
  [Biome.Shrubland]: [
    EliteMember.Bruno,
    EliteMember.JohtoBruno,
    EliteMember.Bertha,
    EliteMember.Aaron,
  ],
  [Biome.Savanna]: [EliteMember.Bruno, EliteMember.JohtoBruno, EliteMember.Bertha],
  [Biome.RockyCoast]: [EliteMember.Bruno, EliteMember.JohtoBruno, EliteMember.Bertha],
  [Biome.Swamp]: [EliteMember.Agatha, EliteMember.Koga, EliteMember.Phoebe, EliteMember.Aaron],
  [Biome.Bog]: [
    EliteMember.Agatha,
    EliteMember.Koga,
    EliteMember.Karen,
    EliteMember.Sidney,
    EliteMember.Phoebe,
  ],
  [Biome.Mangrove]: [EliteMember.Agatha, EliteMember.Koga, EliteMember.Phoebe, EliteMember.Aaron],
  [Biome.TemperateRainforest]: [
    EliteMember.Agatha,
    EliteMember.Will,
    EliteMember.Karen,
    EliteMember.Sidney,
    EliteMember.Phoebe,
    EliteMember.Aaron,
    EliteMember.Lucian,
  ],
  [Biome.Beyond]: [
    EliteMember.Agatha,
    EliteMember.Will,
    EliteMember.Karen,
    EliteMember.Sidney,
    EliteMember.Phoebe,
    EliteMember.Lucian,
  ],
  [Biome.DeepOcean]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.Ocean]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.CoralReef]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.Beach]: [EliteMember.Lance, EliteMember.Drake],
  [Biome.KelpForest]: [EliteMember.Lance, EliteMember.Will, EliteMember.Drake, EliteMember.Lucian],
  [Biome.TropicalRainforest]: [
    EliteMember.Lance,
    EliteMember.Koga,
    EliteMember.Will,
    EliteMember.Drake,
    EliteMember.Aaron,
    EliteMember.Lucian,
  ],
  [Biome.TropicalSeasonalForest]: [EliteMember.Lance, EliteMember.Drake, EliteMember.Aaron],
  [Biome.Grassland]: [EliteMember.Lance, EliteMember.Drake, EliteMember.Aaron],
  [Biome.TemperateForest]: [EliteMember.Lance, EliteMember.Drake, EliteMember.Aaron],
  [Biome.Woodland]: [EliteMember.Lance, EliteMember.Drake, EliteMember.Aaron],
  [Biome.MontaneForest]: [
    EliteMember.Lance,
    EliteMember.Will,
    EliteMember.Drake,
    EliteMember.Aaron,
    EliteMember.Lucian,
  ],
  [Biome.Volcano]: [EliteMember.Lance, EliteMember.Drake, EliteMember.Flint],
};
