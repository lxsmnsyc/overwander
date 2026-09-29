import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AquaTail,
  Moves.Attract,
  Moves.Bounce,
  Moves.Confide,
  Moves.Dive,
  Moves.DoubleTeam,
  Moves.DragonPulse,
  Moves.Facade,
  Moves.Frustration,
  Moves.GunkShot,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IcyWind,
  Moves.IronTail,
  Moves.Outrage,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.Scald,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShockWave,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.SludgeWave,
  Moves.Snore,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.Venoshock,
  Moves.WaterPulse,
  Moves.Waterfall,
];

// What the fake weed learns whichever shape it is in
const FAMILY_LEVEL = {
  1: [Moves.Tackle, Moves.WaterGun, Moves.SmokeScreen],
  5: [Moves.FeintAttack],
  9: [Moves.TailWhip],
  12: [Moves.Bubble],
  15: [Moves.Acid],
  19: [Moves.Camouflage],
  23: [Moves.PoisonTail],
  25: [Moves.WaterPulse],
  28: [Moves.DoubleTeam],
  32: [Moves.Toxic],
  35: [Moves.AquaTail],
  38: [Moves.SludgeBomb],
  42: [Moves.HydroPump],
};

// The weed beds it hides in, both stages alike
const FAMILY_BIOMES = [Biome.KelpForest, Biome.CoralReef];

/**
 * The kelp that is not kelp. It lies in the weed until something
 * comes close enough, and grows into a dragon that never has to move
 */
export default function registerSkrelpSpecies(): void {
  registerSpecies(Species.Skrelp, {
    dexNumber: 690,
    evolvesInto: [
      {
        species: Species.Dragalge,
        method: EvolutionMethod.Level,
        level: 48,
      },
    ],
    name: 'Skrelp',
    category: 'Mock Kelp Pokemon',
    height: 0.5,
    weight: 7.3,
    family: Families.Skrelp,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 60,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 30,
    },
    types: [Types.Poison, Types.Water],
    habitat: Habitat.Water,
    abilities: [Abilities.PoisonPoint, Abilities.PoisonTouch],
    hiddenAbilities: [Abilities.Adaptability],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        49: [Moves.DragonPulse],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.AcidArmor, Moves.Haze, Moves.PlayRough, Moves.ToxicSpikes, Moves.VenomDrench],
    },
  });
  registerSpecies(Species.Dragalge, {
    dexNumber: 691,
    name: 'Dragalge',
    category: 'Mock Kelp Pokemon',
    height: 1.8,
    weight: 81.5,
    family: Families.Skrelp,
    evolvesFrom: Species.Skrelp,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 75,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 97,
      [Stats.SpecialDefense]: 123,
      [Stats.Speed]: 44,
    },
    types: [Types.Poison, Types.Dragon],
    habitat: Habitat.Water,
    abilities: [Abilities.PoisonPoint, Abilities.PoisonTouch],
    // Liquid Ooze is this line's invented filler: the mainline gives
    // Dragalge the three above and nothing else
    hiddenAbilities: [Abilities.Adaptability, Abilities.LiquidOoze],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 55,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        53: [Moves.DragonPulse],
        59: [Moves.DragonTail],
        67: [Moves.Twister],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DracoMeteor,
        Moves.DragonTail,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Thunder,
      ],
    },
  });
}
