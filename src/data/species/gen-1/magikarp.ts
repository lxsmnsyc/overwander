import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMagikarpSpecies(): void {
  registerSpecies(Species.Magikarp, {
    dexNumber: 129,
    evolvesInto: [
      {
        species: Species.Gyarados,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Magikarp',
    category: 'Fish Pokemon',
    height: 0.9,
    weight: 10,
    family: Families.Magikarp,
    stats: {
      [Stats.HP]: 20,
      [Stats.Attack]: 10,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 15,
      [Stats.SpecialDefense]: 20,
      [Stats.Speed]: 80,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim],
    hiddenAbilities: [Abilities.Rattled],
    eggGroups: [EggGroups.Water2, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Swamp, Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Splash],
        15: [Moves.Tackle],
      },
      // Famously teachable nothing
      teachable: [],
    },
  });

  registerSpecies(Species.Gyarados, {
    dexNumber: 130,
    name: 'Gyarados',
    category: 'Atrocious Pokemon',
    height: 6.5,
    weight: 235,
    family: Families.Magikarp,
    evolvesFrom: Species.Magikarp,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 125,
      [Stats.Defense]: 79,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 81,
    },
    types: [Types.Water, Types.Flying],
    abilities: [Abilities.Intimidate],
    hiddenAbilities: [Abilities.Moxie],
    eggGroups: [EggGroups.Water2, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        20: [Moves.Bite],
        25: [Moves.DragonRage],
        32: [Moves.Leer],
        41: [Moves.HydroPump],
        52: [Moves.HyperBeam],
      },
      teachable: [
        Moves.Toxic,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.FireBlast,
        Moves.SkullBash,
        Moves.Rest,
        Moves.Substitute,
        Moves.Surf,
        Moves.Strength,
      ],
    },
  });
}
