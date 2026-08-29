import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerLaprasSpecies(): void {
  registerSpecies(Species.Lapras, {
    dexNumber: 131,
    name: 'Lapras',
    category: 'Transport Pokemon',
    height: 2.5,
    weight: 220,
    family: Families.Lapras,
    stats: {
      [Stats.HP]: 130,
      [Stats.Attack]: 85,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 60,
    },
    types: [Types.Water, Types.Ice],
    abilities: [Abilities.WaterAbsorb, Abilities.ShellArmor],
    hiddenAbilities: [Abilities.Hydration, Abilities.FriendGuard],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.DeepOcean, Biome.PolarOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun, Moves.Growl],
        16: [Moves.Sing],
        20: [Moves.Mist],
        25: [Moves.BodySlam],
        31: [Moves.ConfuseRay],
        38: [Moves.IceBeam],
        46: [Moves.HydroPump],
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
        Moves.SolarBeam,
        Moves.DragonRage,
        Moves.Psychic,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Rest,
        Moves.Psywave,
        Moves.Substitute,
        Moves.Surf,
        Moves.Strength,
      ],
    },
  });
}
