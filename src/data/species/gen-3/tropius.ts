import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerTropiusSpecies(): void {
  registerSpecies(Species.Tropius, {
    dexNumber: 357,
    name: 'Tropius',
    category: 'Fruit Pokemon',
    height: 2,
    weight: 100,
    family: Families.Tropius,
    stats: {
      [Stats.HP]: 99,
      [Stats.Attack]: 68,
      [Stats.Defense]: 83,
      [Stats.SpecialAttack]: 72,
      [Stats.SpecialDefense]: 87,
      [Stats.Speed]: 51,
    },
    types: [Types.Grass, Types.Flying],
    abilities: [Abilities.Chlorophyll, Abilities.SolarPower],
    hiddenAbilities: [Abilities.Harvest, Abilities.Gluttony],
    eggGroups: [EggGroups.Monster, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [Biome.TropicalRainforest, Biome.TropicalSeasonalForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Gust],
        7: [Moves.Growth],
        11: [Moves.RazorLeaf],
        17: [Moves.Stomp],
        21: [Moves.SweetScent],
        27: [Moves.Whirlwind],
        31: [Moves.MagicalLeaf],
        37: [Moves.BodySlam],
        41: [Moves.SolarBeam],
        47: [Moves.Synthesis],
      },
      teachable: [
        Moves.Roar,
        Moves.Toxic,
        Moves.BulletSeed,
        Moves.HiddenPower,
        Moves.SunnyDay,
        Moves.HyperBeam,
        Moves.Protect,
        Moves.GigaDrain,
        Moves.Safeguard,
        Moves.Frustration,
        Moves.SolarBeam,
        Moves.Earthquake,
        Moves.Return,
        Moves.DoubleTeam,
        Moves.AerialAce,
        Moves.Facade,
        Moves.SecretPower,
        Moves.Rest,
        Moves.Attract,
        Moves.SteelWing,
        Moves.Cut,
        Moves.Fly,
        Moves.Strength,
        Moves.Flash,
        Moves.RockSmash,
        Moves.SwordsDance,
        Moves.BodySlam,
        Moves.DoubleEdge,
        Moves.Mimic,
        Moves.Substitute,
        Moves.Snore,
        Moves.Endure,
        Moves.MudSlap,
        Moves.Swagger,
        Moves.FuryCutter,
        Moves.SleepTalk,
      ],
      egg: [Moves.LeechSeed, Moves.Headbutt, Moves.Slam, Moves.RazorWind, Moves.NaturePower],
    },
  });
}
