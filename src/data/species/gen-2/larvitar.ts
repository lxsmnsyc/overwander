import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Earthquake,
  Moves.Dig,
  Moves.Sandstorm,
  Moves.SunnyDay,
  Moves.HyperBeam,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.Headbutt,
  Moves.MudSlap,
];

// The line's own moves come at the same order the whole way up, only
// later each time it grows
const FAMILY_LEVEL = {
  8: [Moves.Sandstorm],
  15: [Moves.Screech],
  22: [Moves.RockSlide],
  29: [Moves.Thrash],
};

export default function registerLarvitarSpecies(): void {
  registerSpecies(Species.Larvitar, {
    dexNumber: 246,
    evolvesInto: [
      {
        species: Species.Pupitar,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Larvitar',
    category: 'Rock Skin Pokemon',
    height: 0.6,
    weight: 72,
    family: Families.Larvitar,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 64,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 41,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [Abilities.Guts],
    hiddenAbilities: [Abilities.SandVeil],
    eggGroups: [EggGroups.Monster],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Leer],
        ...FAMILY_LEVEL,
        36: [Moves.ScaryFace],
        43: [Moves.Crunch],
        50: [Moves.Earthquake],
        57: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AncientPower,
        Moves.FocusEnergy,
        Moves.Outrage,
        Moves.Pursuit,
        Moves.Stomp,
      ],
    },
  });

  registerSpecies(Species.Pupitar, {
    dexNumber: 247,
    evolvesInto: [
      {
        species: Species.Tyranitar,
        method: EvolutionMethod.Level,
        level: 55,
      },
    ],
    name: 'Pupitar',
    category: 'Hard Shell Pokemon',
    height: 1.2,
    weight: 152,
    family: Families.Larvitar,
    evolvesFrom: Species.Larvitar,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 84,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 51,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [Abilities.ShedSkin],
    eggGroups: [EggGroups.Monster],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Leer, Moves.Sandstorm, Moves.Screech],
        ...FAMILY_LEVEL,
        38: [Moves.ScaryFace],
        47: [Moves.Crunch],
        56: [Moves.Earthquake],
        65: [Moves.HyperBeam],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Tyranitar, {
    dexNumber: 248,
    name: 'Tyranitar',
    category: 'Armor Pokemon',
    height: 2,
    weight: 202,
    family: Families.Larvitar,
    evolvesFrom: Species.Pupitar,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 134,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 61,
    },
    types: [Types.Rock, Types.Dark],
    abilities: [Abilities.SandStream],
    // Nothing invented here: the line already reaches five, since
    // Pupitar's Shed Skin and Larvitar's Guts and Sand Veil all walk
    // up to meet its own two
    hiddenAbilities: [Abilities.Unnerve],
    eggGroups: [EggGroups.Monster],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bite, Moves.Leer, Moves.Sandstorm, Moves.Screech],
        ...FAMILY_LEVEL,
        38: [Moves.ScaryFace],
        47: [Moves.Crunch],
        61: [Moves.Earthquake],
        75: [Moves.HyperBeam],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Flamethrower,
        Moves.FireBlast,
        Moves.FirePunch,
        Moves.IceBeam,
        Moves.Thunderbolt,
        Moves.Surf,
        Moves.Cut,
        Moves.Strength,
        Moves.RockSmash,
        Moves.FuryCutter,
        Moves.DragonBreath,
        Moves.DynamicPunch,
        Moves.IronTail,
        Moves.Nightmare,
        Moves.Roar,
      ],
    },
  });
}
