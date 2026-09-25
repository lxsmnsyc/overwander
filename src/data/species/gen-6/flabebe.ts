import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay, TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AfterYou,
  Moves.Attract,
  Moves.CalmMind,
  Moves.Confide,
  Moves.Covet,
  Moves.DazzlingGleam,
  Moves.DoubleTeam,
  Moves.EchoedVoice,
  Moves.Endeavor,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.HealBell,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.MagicCoat,
  Moves.NaturePower,
  Moves.Protect,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Synthesis,
  Moves.Toxic,
  Moves.WorrySeed,
];

// What the grown one carries on top of it
const FLORGES_TEACHABLE = [
  ...FAMILY_TEACHABLE,
  Moves.GigaImpact,
  Moves.HyperBeam,
  Moves.LightScreen,
];

const FLABEBE_LEVEL: Record<number, Moves[]> = {
  1: [Moves.VineWhip, Moves.Tackle],
  6: [Moves.FairyWind],
  10: [Moves.LuckyChant],
  15: [Moves.RazorLeaf],
  20: [Moves.Wish],
  22: [Moves.MagicalLeaf],
  24: [Moves.GrassyTerrain],
  28: [Moves.PetalBlizzard],
  33: [Moves.Aromatherapy],
  37: [Moves.MistyTerrain],
  41: [Moves.Moonblast],
  45: [Moves.PetalDance],
  48: [Moves.SolarBeam],
};

const FLOETTE_LEVEL: Record<number, Moves[]> = {
  1: [Moves.VineWhip, Moves.Tackle],
  6: [Moves.FairyWind],
  10: [Moves.LuckyChant],
  15: [Moves.RazorLeaf],
  20: [Moves.Wish],
  25: [Moves.MagicalLeaf],
  27: [Moves.GrassyTerrain],
  33: [Moves.PetalBlizzard],
  38: [Moves.Aromatherapy],
  43: [Moves.MistyTerrain],
  46: [Moves.Moonblast],
  51: [Moves.PetalDance],
  58: [Moves.SolarBeam],
};

const FLORGES_LEVEL: Record<number, Moves[]> = {
  1: [
    Moves.PetalDance,
    Moves.Wish,
    Moves.Aromatherapy,
    Moves.MagicalLeaf,
    Moves.LuckyChant,
    Moves.GrassKnot,
    Moves.PetalBlizzard,
    Moves.DisarmingVoice,
    Moves.FlowerShield,
    Moves.GrassyTerrain,
    Moves.MistyTerrain,
    Moves.Moonblast,
  ],
};

/**
 * The colour of flower a Flabebe picked, which it carries for life:
 * the flower is the pokemon's weapon, so a Floette and a Florges are
 * the same colour as the one that found it. Red grows anywhere the
 * line grows; the other four are each a country's own
 */
const FLOWER_COLOURS: {
  flabebe: Species;
  floette: Species;
  florges: Species;
  name: string;
  biomes: Biome[];
}[] = [
  {
    flabebe: Species.Flabebe,
    floette: Species.Floette,
    florges: Species.Florges,
    name: '',
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
  },
  {
    flabebe: Species.FlabebeYellow,
    floette: Species.FloetteYellow,
    florges: Species.FlorgesYellow,
    name: 'Yellow',
    biomes: [Biome.Savanna, Biome.Steppe],
  },
  {
    flabebe: Species.FlabebeOrange,
    floette: Species.FloetteOrange,
    florges: Species.FlorgesOrange,
    name: 'Orange',
    biomes: [Biome.Shrubland, Biome.TropicalSeasonalForest],
  },
  {
    flabebe: Species.FlabebeBlue,
    floette: Species.FloetteBlue,
    florges: Species.FlorgesBlue,
    name: 'Blue',
    biomes: [Biome.Bog, Biome.Swamp, Biome.Mangrove],
  },
  {
    flabebe: Species.FlabebeWhite,
    floette: Species.FloetteWhite,
    florges: Species.FlorgesWhite,
    name: 'White',
    biomes: [Biome.Taiga, Biome.Tundra],
  },
];

export default function registerFlabebeSpecies(): void {
  // Every colour is the same flower under a different petal, so each
  // is registered off the one shape rather than written out five times
  for (const colour of FLOWER_COLOURS) {
    const red = colour.flabebe === Species.Flabebe;
    const named = (stage: string): string => (red ? stage : `${colour.name} ${stage}`);

    registerSpecies(colour.flabebe, {
      dexNumber: 669,
      evolvesInto: [
        {
          species: colour.floette,
          method: EvolutionMethod.Level,
          level: 19,
        },
      ],
      name: named('Flabebe'),
      category: 'Single Bloom Pokemon',
      height: 0.1,
      weight: 0.1,
      family: Families.Flabebe,
      ...(red ? {} : { baseForm: false }),
      stats: {
        [Stats.HP]: 44,
        [Stats.Attack]: 38,
        [Stats.Defense]: 39,
        [Stats.SpecialAttack]: 61,
        [Stats.SpecialDefense]: 79,
        [Stats.Speed]: 42,
      },
      types: [Types.Fairy],
      abilities: [Abilities.FlowerVeil],
      hiddenAbilities: [Abilities.Symbiosis],
      eggGroups: [EggGroups.Fairy],
      genderRatio: [0, 1],
      catchRate: 225,
      biomes: [...colour.biomes],
      activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
      learnSet: {
        level: { ...FLABEBE_LEVEL },
        teachable: [...FAMILY_TEACHABLE],
        egg: [Moves.Camouflage, Moves.Captivate, Moves.Copycat, Moves.TearfulLook],
      },
    });
    registerSpecies(colour.floette, {
      dexNumber: 670,
      evolvesInto: [
        {
          species: colour.florges,
          method: EvolutionMethod.UsedItem,
          item: Items.ShinyStone,
        },
      ],
      name: named('Floette'),
      category: 'Single Bloom Pokemon',
      height: 0.2,
      weight: 0.9,
      family: Families.Flabebe,
      evolvesFrom: colour.flabebe,
      ...(red ? {} : { baseForm: false }),
      stats: {
        [Stats.HP]: 54,
        [Stats.Attack]: 45,
        [Stats.Defense]: 47,
        [Stats.SpecialAttack]: 75,
        [Stats.SpecialDefense]: 98,
        [Stats.Speed]: 52,
      },
      types: [Types.Fairy],
      abilities: [Abilities.FlowerVeil],
      hiddenAbilities: [Abilities.Symbiosis],
      eggGroups: [EggGroups.Fairy],
      genderRatio: [0, 1],
      catchRate: 120,
      biomes: [...colour.biomes],
      activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
      learnSet: {
        level: { ...FLOETTE_LEVEL },
        teachable: [...FAMILY_TEACHABLE],
      },
    });
    registerSpecies(colour.florges, {
      dexNumber: 671,
      name: named('Florges'),
      category: 'Garden Pokemon',
      height: 1.1,
      weight: 10.0,
      family: Families.Flabebe,
      evolvesFrom: colour.floette,
      ...(red ? {} : { baseForm: false }),
      stats: {
        [Stats.HP]: 78,
        [Stats.Attack]: 65,
        [Stats.Defense]: 68,
        [Stats.SpecialAttack]: 112,
        [Stats.SpecialDefense]: 154,
        [Stats.Speed]: 75,
      },
      types: [Types.Fairy],
      abilities: [Abilities.FlowerVeil],
      // Misty Surge and Unaware are this line's invented fillers: the
      // mainline gives Florges only the two above
      hiddenAbilities: [Abilities.Symbiosis, Abilities.MistySurge, Abilities.Unaware],
      eggGroups: [EggGroups.Fairy],
      genderRatio: [0, 1],
      catchRate: 45,
      biomes: [...colour.biomes],
      activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
      learnSet: {
        level: { ...FLORGES_LEVEL },
        teachable: [...FLORGES_TEACHABLE],
      },
    });
  }

  // The flower nobody picked, which has not wilted in three thousand
  // years: it is met on a town's streets and nowhere else, no Flabebe
  // grows into it, and it never takes a stone
  registerSpecies(Species.FloetteEternal, {
    dexNumber: 670,
    name: 'Eternal Floette',
    category: 'Single Bloom Pokemon',
    height: 0.2,
    weight: 0.9,
    family: Families.Flabebe,
    baseForm: false,
    stats: {
      [Stats.HP]: 74,
      [Stats.Attack]: 65,
      [Stats.Defense]: 67,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 128,
      [Stats.Speed]: 92,
    },
    types: [Types.Fairy],
    abilities: [Abilities.FlowerVeil],
    hiddenAbilities: [Abilities.Symbiosis],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [0, 1],
    catchRate: 45,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: { ...FLOETTE_LEVEL, 50: [Moves.LightOfRuin] },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
}
