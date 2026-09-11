import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerScizorSpecies(): void {
  registerSpecies(Species.Scizor, {
    dexNumber: 212,
    name: 'Scizor',
    category: 'Pincer Pokemon',
    height: 1.8,
    weight: 118,
    family: Families.Scyther,
    evolvesFrom: Species.Scyther,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 130,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 65,
    },
    types: [Types.Bug, Types.Steel],
    abilities: [Abilities.Swarm, Abilities.Technician],
    hiddenAbilities: [Abilities.LightMetal],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 25,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        41: [Moves.IronDefense],
        1: [Moves.Leer, Moves.QuickAttack],
        6: [Moves.FocusEnergy],
        12: [Moves.Pursuit],
        18: [Moves.FalseSwipe],
        24: [Moves.Agility],
        30: [Moves.MetalClaw],
        36: [Moves.Slash],
        42: [Moves.SwordsDance],
        48: [Moves.DoubleTeam],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Cut,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.Sandstorm,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SteelWing,
        Moves.Strength,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Toxic,

        Moves.AerialAce,
        Moves.Counter,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.Mimic,
        Moves.SecretPower,
        Moves.Substitute,
      ],
    },
  });
}
