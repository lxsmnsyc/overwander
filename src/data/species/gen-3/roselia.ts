import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerRoseliaSpecies(): void {
  registerSpecies(Species.Roselia, {
    dexNumber: 315,
    name: 'Roselia',
    category: 'Thorn Pokemon',
    height: 0.3,
    weight: 2,
    family: Families.Roselia,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 60,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 65,
    },
    types: [Types.Grass, Types.Poison],
    abilities: [Abilities.NaturalCure, Abilities.PoisonPoint],
    hiddenAbilities: [Abilities.LeafGuard],
    eggGroups: [EggGroups.Fairy, EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 150,
    biomes: [Biome.Grassland, Biome.Shrubland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Absorb],
        5: [Moves.Growth],
        9: [Moves.PoisonSting],
        13: [Moves.StunSpore],
        17: [Moves.MegaDrain],
        21: [Moves.LeechSeed],
        25: [Moves.MagicalLeaf],
        29: [Moves.GrassWhistle],
        33: [Moves.GigaDrain],
        37: [Moves.SweetScent],
        41: [Moves.Ingrain],
        45: [Moves.Toxic],
        49: [Moves.PetalDance],
        53: [Moves.Aromatherapy],
        57: [Moves.Synthesis],
      },
      teachable: [
        Moves.Attract,
        Moves.BodySlam,
        Moves.BulletSeed,
        Moves.Cut,
        Moves.DoubleEdge,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.GigaDrain,
        Moves.HiddenPower,
        Moves.Mimic,
        Moves.MudSlap,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Rest,
        Moves.Return,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.SludgeBomb,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.SwordsDance,
        Moves.Toxic,
      ],
      egg: [Moves.CottonSpore, Moves.PinMissile, Moves.Spikes, Moves.Synthesis],
    },
  });
}
