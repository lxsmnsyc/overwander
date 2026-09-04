import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Fly,
  Moves.DoubleTeam,
  Moves.Swift,
  Moves.DreamEater,
  Moves.Flash,
  Moves.Rest,
  Moves.Thief,
  Moves.Nightmare,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.SteelWing,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SunnyDay,
];

export default function registerHoothootSpecies(): void {
  registerSpecies(Species.Hoothoot, {
    dexNumber: 163,
    evolvesInto: [
      {
        species: Species.Noctowl,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Hoothoot',
    category: 'Owl Pokemon',
    height: 0.7,
    weight: 21.2,
    family: Families.Hoothoot,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 30,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 36,
      [Stats.SpecialDefense]: 56,
      [Stats.Speed]: 50,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.Insomnia, Abilities.KeenEye],
    hiddenAbilities: [Abilities.TintedLens],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        6: [Moves.Foresight],
        11: [Moves.Peck],
        16: [Moves.Hypnosis],
        22: [Moves.Reflect],
        28: [Moves.TakeDown],
        34: [Moves.Confusion],
        48: [Moves.DreamEater],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.WingAttack,
        Moves.Whirlwind,
        Moves.Supersonic,
        Moves.MirrorMove,
        Moves.FeintAttack,
      ],
    },
  });

  registerSpecies(Species.Noctowl, {
    dexNumber: 164,
    name: 'Noctowl',
    category: 'Owl Pokemon',
    height: 1.6,
    weight: 40.8,
    family: Families.Hoothoot,
    evolvesFrom: Species.Hoothoot,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 50,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 86,
      [Stats.SpecialDefense]: 96,
      [Stats.Speed]: 70,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.Insomnia, Abilities.KeenEye],
    // Infiltrator is this registry's rather than the mainline's,
    // filling a final evolution to four: an owl is quiet enough to
    // arrive behind whatever was put up in the way
    hiddenAbilities: [Abilities.TintedLens, Abilities.Infiltrator],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.MontaneForest],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.Foresight, Moves.Peck],
        16: [Moves.Hypnosis],
        25: [Moves.Reflect],
        33: [Moves.TakeDown],
        41: [Moves.Confusion],
        57: [Moves.DreamEater],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
