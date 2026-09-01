import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerKingdraSpecies(): void {
  registerSpecies(Species.Kingdra, {
    dexNumber: 230,
    name: 'Kingdra',
    category: 'Dragon Pokemon',
    height: 1.8,
    weight: 152,
    family: Families.Horsea,
    evolvesFrom: Species.Seadra,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 95,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 85,
    },
    types: [Types.Water, Types.Dragon],
    abilities: [Abilities.SwiftSwim, Abilities.Sniper],
    hiddenAbilities: [Abilities.Damp],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.CoralReef],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Leer, Moves.SmokeScreen, Moves.WaterGun],
        8: [Moves.SmokeScreen],
        15: [Moves.Leer],
        22: [Moves.WaterGun],
        29: [Moves.Twister],
        40: [Moves.Agility],
        51: [Moves.HydroPump],
      },
      teachable: [
        Moves.Attract,
        Moves.Blizzard,
        Moves.Curse,
        Moves.DoubleTeam,
        Moves.DragonBreath,
        Moves.Endure,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcyWind,
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
    },
  });
}
