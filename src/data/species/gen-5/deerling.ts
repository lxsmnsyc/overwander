import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The deer that wears the year. Which coat a player meets is decided
 * by the month rather than by the ground: the season turns for
 * everybody at once, so two people walking far apart still meet the
 * same coat and the four are collected over a year rather than
 * walked to
 */

/** Each season's coat, spring first, in the order the year turns */
const DEERLING_COATS = [
  Species.Deerling,
  Species.DeerlingSummer,
  Species.DeerlingAutumn,
  Species.DeerlingWinter,
];

const SAWSBUCK_COATS = [
  Species.Sawsbuck,
  Species.SawsbuckSummer,
  Species.SawsbuckAutumn,
  Species.SawsbuckWinter,
];

const SEASONAL_COATS = new Map<Species, Species[]>([
  [Species.Deerling, DEERLING_COATS],
  [Species.Sawsbuck, SAWSBUCK_COATS],
]);

/**
 * The coat this season hands over, or the species itself for anything
 * that does not change with the year. The season is an index, spring
 * first, so this stays out of the biome clock's way
 */
export function getSeasonalCoat(species: Species, season: number): Species {
  return SEASONAL_COATS.get(species)?.[season] ?? species;
}

/** The coats a Deerling and a Sawsbuck wear, for anything listing them */
export { DEERLING_COATS, SAWSBUCK_COATS };

const DEERLING_LEVELS = {
  1: [Moves.Tackle, Moves.Camouflage],
  4: [Moves.Growl],
  7: [Moves.SandAttack],
  10: [Moves.DoubleKick],
  13: [Moves.LeechSeed],
  16: [Moves.FeintAttack, Moves.BulletSeed],
  20: [Moves.TakeDown],
  24: [Moves.JumpKick, Moves.ZenHeadbutt],
  28: [Moves.Aromatherapy, Moves.EnergyBall],
  32: [Moves.Charm],
  37: [Moves.DoubleEdge],
  41: [Moves.NaturePower],
  42: [Moves.SolarBeam],
};

const SAWSBUCK_LEVELS = {
  1: [Moves.HornLeech, Moves.Megahorn, Moves.Tackle, Moves.Camouflage, Moves.Growl],
  10: [Moves.DoubleKick],
  13: [Moves.LeechSeed],
  16: [Moves.FeintAttack, Moves.BulletSeed],
  20: [Moves.TakeDown],
  24: [Moves.JumpKick, Moves.ZenHeadbutt],
  28: [Moves.Aromatherapy, Moves.EnergyBall],
  36: [Moves.Charm],
  44: [Moves.DoubleEdge, Moves.NaturePower],
  52: [Moves.SolarBeam],
};

/** What both stages are taught */
const SEASON_TEACHABLE = [
  Moves.Agility,
  Moves.Attract,
  Moves.BatonPass,
  Moves.BodySlam,
  Moves.Bounce,
  Moves.Bulldoze,
  Moves.BulletSeed,
  Moves.Charm,
  Moves.Dig,
  Moves.DoubleEdge,
  Moves.DoubleTeam,
  Moves.EchoedVoice,
  Moves.Endeavor,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FakeTears,
  Moves.Flash,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.LastResort,
  Moves.LeafStorm,
  Moves.LightScreen,
  Moves.MagicalLeaf,
  Moves.NaturePower,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.ShadowBall,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Synthesis,
  Moves.TakeDown,
  Moves.ThunderWave,
  Moves.Toxic,
  Moves.WildCharge,
  Moves.WorkUp,
  Moves.WorrySeed,
  Moves.ZenHeadbutt,
  Moves.Confide,
];

const SAWSBUCK_TEACHABLE = [
  ...SEASON_TEACHABLE,
  Moves.Curse,
  Moves.Cut,
  Moves.GigaImpact,
  Moves.HyperBeam,
  Moves.RockSmash,
  Moves.SwordsDance,
  Moves.StompingTantrum,
];

const DEERLING_BIOMES = [Biome.Grassland, Biome.TemperateForest];

const DEERLING_STATS = {
  [Stats.HP]: 60,
  [Stats.Attack]: 60,
  [Stats.Defense]: 50,
  [Stats.SpecialAttack]: 40,
  [Stats.SpecialDefense]: 50,
  [Stats.Speed]: 75,
};

const SAWSBUCK_STATS = {
  [Stats.HP]: 80,
  [Stats.Attack]: 100,
  [Stats.Defense]: 70,
  [Stats.SpecialAttack]: 60,
  [Stats.SpecialDefense]: 70,
  [Stats.Speed]: 95,
};

/** The three coats past spring, which is the one each line is registered as */
const DEERLING_SEASONS: [species: Species, name: string, into: Species][] = [
  [Species.DeerlingSummer, 'Summer Deerling', Species.SawsbuckSummer],
  [Species.DeerlingAutumn, 'Autumn Deerling', Species.SawsbuckAutumn],
  [Species.DeerlingWinter, 'Winter Deerling', Species.SawsbuckWinter],
];

const SAWSBUCK_SEASONS: [species: Species, name: string, from: Species][] = [
  [Species.SawsbuckSummer, 'Summer Sawsbuck', Species.DeerlingSummer],
  [Species.SawsbuckAutumn, 'Autumn Sawsbuck', Species.DeerlingAutumn],
  [Species.SawsbuckWinter, 'Winter Sawsbuck', Species.DeerlingWinter],
];

export default function registerDeerlingSpecies(): void {
  registerSpecies(Species.Deerling, {
    dexNumber: 585,
    evolvesInto: [{ species: Species.Sawsbuck, method: EvolutionMethod.Level, level: 34 }],
    name: 'Deerling',
    category: 'Season Pokemon',
    height: 0.6,
    weight: 19.5,
    family: Families.Deerling,
    stats: { ...DEERLING_STATS },
    types: [Types.Normal, Types.Grass],
    abilities: [Abilities.Chlorophyll, Abilities.SapSipper],
    hiddenAbilities: [Abilities.SereneGrace],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [...DEERLING_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: { level: { ...DEERLING_LEVELS }, teachable: [...SEASON_TEACHABLE] },
  });

  for (const [species, name, into] of DEERLING_SEASONS) {
    registerSpecies(species, {
      dexNumber: 585,
      baseForm: false,
      evolvesInto: [{ species: into, method: EvolutionMethod.Level, level: 34 }],
      name,
      category: 'Season Pokemon',
      height: 0.6,
      weight: 19.5,
      family: Families.Deerling,
      stats: { ...DEERLING_STATS },
      types: [Types.Normal, Types.Grass],
      abilities: [Abilities.Chlorophyll, Abilities.SapSipper],
      hiddenAbilities: [Abilities.SereneGrace],
      eggGroups: [EggGroups.Field],
      genderRatio: [1, 1],
      catchRate: 190,
      // The coat is named where it lives, the way the far shore's
      // shell is, and the month rather than a pool hands it over
      biomes: [...DEERLING_BIOMES],
      activeTimes: AnyTimeOfDay,
      learnSet: { level: { ...DEERLING_LEVELS }, teachable: [...SEASON_TEACHABLE] },
    });
  }

  registerSpecies(Species.Sawsbuck, {
    dexNumber: 586,
    evolvesFrom: Species.Deerling,
    name: 'Sawsbuck',
    category: 'Season Pokemon',
    height: 1.9,
    weight: 92.5,
    family: Families.Deerling,
    stats: { ...SAWSBUCK_STATS },
    types: [Types.Normal, Types.Grass],
    abilities: [Abilities.Chlorophyll, Abilities.SapSipper],
    // Fur Coat is this registry's rather than the mainline's: the
    // coat it changes with the year is the whole of what the line is
    hiddenAbilities: [Abilities.SereneGrace, Abilities.FurCoat],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [...DEERLING_BIOMES],
    activeTimes: AnyTimeOfDay,
    learnSet: { level: { ...SAWSBUCK_LEVELS }, teachable: [...SAWSBUCK_TEACHABLE] },
  });

  for (const [species, name, from] of SAWSBUCK_SEASONS) {
    registerSpecies(species, {
      dexNumber: 586,
      baseForm: false,
      evolvesFrom: from,
      name,
      category: 'Season Pokemon',
      height: 1.9,
      weight: 92.5,
      family: Families.Deerling,
      stats: { ...SAWSBUCK_STATS },
      types: [Types.Normal, Types.Grass],
      abilities: [Abilities.Chlorophyll, Abilities.SapSipper],
      hiddenAbilities: [Abilities.SereneGrace, Abilities.FurCoat],
      eggGroups: [EggGroups.Field],
      genderRatio: [1, 1],
      catchRate: 75,
      biomes: [...DEERLING_BIOMES],
      activeTimes: AnyTimeOfDay,
      learnSet: { level: { ...SAWSBUCK_LEVELS }, teachable: [...SAWSBUCK_TEACHABLE] },
    });
  }
}
