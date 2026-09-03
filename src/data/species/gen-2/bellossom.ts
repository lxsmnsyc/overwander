import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerBellossomSpecies(): void {
  registerSpecies(Species.Bellossom, {
    dexNumber: 182,
    name: 'Bellossom',
    category: 'Flower Pokemon',
    height: 0.4,
    weight: 5.8,
    family: Families.Oddish,
    evolvesFrom: Species.Gloom,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 80,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 50,
    },
    types: [Types.Grass],
    abilities: [Abilities.Chlorophyll],
    hiddenAbilities: [Abilities.Healer],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.PetalDance, Moves.StunSpore, Moves.SweetScent, Moves.MagicalLeaf],
        55: [Moves.SolarBeam],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Cut,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Flash,
        Moves.Frustration,
        Moves.GigaDrain,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.SweetScent,
        Moves.Toxic,

        Moves.BulletSeed,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.Mimic,
        Moves.Safeguard,
        Moves.SecretPower,
        Moves.SludgeBomb,
        Moves.Substitute,
        Moves.SwordsDance,
      ],
    },
  });
}
