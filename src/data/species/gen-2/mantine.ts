import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMantineSpecies(): void {
  registerSpecies(Species.Mantine, {
    dexNumber: 226,
    name: 'Mantine',
    category: 'Kite Pokemon',
    height: 2.1,
    weight: 220,
    family: Families.Mantine,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 40,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 140,
      [Stats.Speed]: 70,
    },
    types: [Types.Water, Types.Flying],
    abilities: [Abilities.SwiftSwim, Abilities.WaterAbsorb],
    // Hydration is this registry's rather than the mainline's,
    // filling it to four: rain is the water it already lives in
    hiddenAbilities: [Abilities.WaterVeil, Abilities.Hydration],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 25,
    biomes: [Biome.Ocean, Biome.CoralReef, Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Tackle],
        10: [Moves.Supersonic],
        18: [Moves.BubbleBeam],
        25: [Moves.TakeDown],
        32: [Moves.Agility],
        40: [Moves.WingAttack],
        49: [Moves.ConfuseRay],
      },
      teachable: [
        Moves.Attract,
        Moves.Blizzard,
        Moves.Curse,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IceBeam,
        Moves.IcyWind,
        Moves.MudSlap,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Surf,
        Moves.Swagger,
        Moves.Swift,
        Moves.Toxic,
        Moves.Waterfall,
        Moves.Whirlpool,
      ],
      egg: [Moves.Haze, Moves.HydroPump, Moves.Slam, Moves.Twister],
    },
  });
}
