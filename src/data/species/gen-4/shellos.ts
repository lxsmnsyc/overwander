import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AncientPower,
  Moves.Attract,
  Moves.Blizzard,
  Moves.Brine,
  Moves.Captivate,
  Moves.Dive,
  Moves.DoubleTeam,
  Moves.EarthPower,
  Moves.Endure,
  Moves.Facade,
  Moves.Frustration,
  Moves.Hail,
  Moves.Headbutt,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.PainSplit,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StringShot,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.Toxic,
  Moves.WaterPulse,
  Moves.Whirlpool,
];

/**
 * Which shell a shore hands over, by the side of the world it is on.
 * The mainline splits the two seas at a mountain range; here the
 * meridian is what a chunk's own x already is, so west of nothing is
 * the pink one and east of it the blue
 */
const EAST_SHELLS = new Map<Species, Species>([
  [Species.Shellos, Species.ShellosEast],
  [Species.Gastrodon, Species.GastrodonEast],
]);

export function getShoreForm(species: Species, x: number): Species {
  return x < 0 ? species : (EAST_SHELLS.get(species) ?? species);
}

/**
 * The sea slug that comes in two shells. Which one a player meets is
 * decided by the side of the world they are standing on rather than
 * by the shore itself: west of the meridian is the pink one, east of
 * it the blue, and the shell it was met in is the shell it evolves
 * with
 */
export default function registerShellosSpecies(): void {
  registerSpecies(Species.Shellos, {
    dexNumber: 422,
    evolvesInto: [
      {
        species: Species.Gastrodon,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Shellos',
    category: 'Sea Slug Pokemon',
    height: 0.3,
    weight: 6.3,
    family: Families.Shellos,
    stats: {
      [Stats.HP]: 76,
      [Stats.Attack]: 48,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 57,
      [Stats.SpecialDefense]: 62,
      [Stats.Speed]: 34,
    },
    types: [Types.Water],
    abilities: [Abilities.StickyHold, Abilities.StormDrain],
    hiddenAbilities: [Abilities.SandForce],
    eggGroups: [EggGroups.Water1, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Beach, Biome.RockyCoast, Biome.Mangrove],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.MudSlap],
        2: [Moves.MudSport],
        4: [Moves.Harden],
        7: [Moves.WaterPulse],
        11: [Moves.MudBomb],
        16: [Moves.HiddenPower],
        22: [Moves.RainDance],
        29: [Moves.BodySlam],
        37: [Moves.MuddyWater],
        46: [Moves.Recover],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Amnesia,
        Moves.Counter,
        Moves.Curse,
        Moves.Fissure,
        Moves.Memento,
        Moves.MirrorCoat,
        Moves.Sludge,
        Moves.SpitUp,
        Moves.Stockpile,
        Moves.Swallow,
        Moves.TrumpCard,
        Moves.Yawn,
      ],
    },
  });
  registerSpecies(Species.ShellosEast, {
    dexNumber: 422,
    evolvesInto: [
      {
        species: Species.GastrodonEast,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'East Shellos',
    category: 'Sea Slug Pokemon',
    height: 0.3,
    weight: 6.3,
    family: Families.Shellos,
    baseForm: false,
    stats: {
      [Stats.HP]: 76,
      [Stats.Attack]: 48,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 57,
      [Stats.SpecialDefense]: 62,
      [Stats.Speed]: 34,
    },
    types: [Types.Water],
    abilities: [Abilities.StickyHold, Abilities.StormDrain],
    hiddenAbilities: [Abilities.SandForce],
    eggGroups: [EggGroups.Water1, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Beach, Biome.RockyCoast, Biome.Mangrove],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.MudSlap],
        2: [Moves.MudSport],
        4: [Moves.Harden],
        7: [Moves.WaterPulse],
        11: [Moves.MudBomb],
        16: [Moves.HiddenPower],
        22: [Moves.RainDance],
        29: [Moves.BodySlam],
        37: [Moves.MuddyWater],
        46: [Moves.Recover],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Amnesia,
        Moves.Counter,
        Moves.Curse,
        Moves.Fissure,
        Moves.Memento,
        Moves.MirrorCoat,
        Moves.Sludge,
        Moves.SpitUp,
        Moves.Stockpile,
        Moves.Swallow,
        Moves.TrumpCard,
        Moves.Yawn,
      ],
    },
  });
  registerSpecies(Species.Gastrodon, {
    dexNumber: 423,
    name: 'Gastrodon',
    category: 'Sea Slug Pokemon',
    height: 0.9,
    weight: 29.9,
    family: Families.Shellos,
    evolvesFrom: Species.Shellos,
    stats: {
      [Stats.HP]: 111,
      [Stats.Attack]: 83,
      [Stats.Defense]: 68,
      [Stats.SpecialAttack]: 92,
      [Stats.SpecialDefense]: 82,
      [Stats.Speed]: 39,
    },
    types: [Types.Water, Types.Ground],
    abilities: [Abilities.StickyHold, Abilities.StormDrain],
    // Liquid Ooze is this registry's rather than the mainline's:
    // what the slug is made of is not worth drinking
    hiddenAbilities: [Abilities.SandForce, Abilities.LiquidOoze],
    eggGroups: [EggGroups.Water1, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Beach, Biome.RockyCoast, Biome.Mangrove],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Harden, Moves.MudSlap, Moves.MudSport, Moves.WaterPulse],
        2: [Moves.MudSport],
        4: [Moves.Harden],
        7: [Moves.WaterPulse],
        11: [Moves.MudBomb],
        16: [Moves.HiddenPower],
        22: [Moves.RainDance],
        29: [Moves.BodySlam],
        41: [Moves.MuddyWater],
        54: [Moves.Recover],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Block,
        Moves.Dig,
        Moves.Earthquake,
        Moves.Flash,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Sandstorm,
        Moves.SludgeBomb,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.Waterfall,
      ],
    },
  });
  registerSpecies(Species.GastrodonEast, {
    dexNumber: 423,
    name: 'East Gastrodon',
    category: 'Sea Slug Pokemon',
    height: 0.9,
    weight: 29.9,
    family: Families.Shellos,
    evolvesFrom: Species.ShellosEast,
    baseForm: false,
    stats: {
      [Stats.HP]: 111,
      [Stats.Attack]: 83,
      [Stats.Defense]: 68,
      [Stats.SpecialAttack]: 92,
      [Stats.SpecialDefense]: 82,
      [Stats.Speed]: 39,
    },
    types: [Types.Water, Types.Ground],
    abilities: [Abilities.StickyHold, Abilities.StormDrain],
    // Liquid Ooze is this registry's rather than the mainline's:
    // what the slug is made of is not worth drinking
    hiddenAbilities: [Abilities.SandForce, Abilities.LiquidOoze],
    eggGroups: [EggGroups.Water1, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Beach, Biome.RockyCoast, Biome.Mangrove],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Harden, Moves.MudSlap, Moves.MudSport, Moves.WaterPulse],
        2: [Moves.MudSport],
        4: [Moves.Harden],
        7: [Moves.WaterPulse],
        11: [Moves.MudBomb],
        16: [Moves.HiddenPower],
        22: [Moves.RainDance],
        29: [Moves.BodySlam],
        41: [Moves.MuddyWater],
        54: [Moves.Recover],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Block,
        Moves.Dig,
        Moves.Earthquake,
        Moves.Flash,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Sandstorm,
        Moves.SludgeBomb,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.Waterfall,
      ],
    },
  });
}
