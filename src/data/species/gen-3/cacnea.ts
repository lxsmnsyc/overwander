import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.FocusPunch,
  Moves.Toxic,
  Moves.BulletSeed,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.GigaDrain,
  Moves.Frustration,
  Moves.SolarBeam,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.Sandstorm,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Cut,
  Moves.Flash,
  Moves.MegaPunch,
  Moves.SwordsDance,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Mimic,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.ThunderPunch,
  Moves.SleepTalk,
];

export default function registerCacneaSpecies(): void {
  registerSpecies(Species.Cacnea, {
    dexNumber: 331,
    evolvesInto: [
      {
        species: Species.Cacturne,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Cacnea',
    category: 'Cactus Pokemon',
    height: 0.4,
    weight: 51.3,
    family: Families.Cacnea,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 85,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 35,
    },
    types: [Types.Grass],
    abilities: [Abilities.SandVeil],
    hiddenAbilities: [Abilities.WaterAbsorb],
    eggGroups: [EggGroups.Grass, EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Desert, Biome.ColdDesert],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.PoisonSting, Moves.Leer],
        5: [Moves.Absorb],
        9: [Moves.Growth],
        13: [Moves.LeechSeed],
        17: [Moves.SandAttack],
        21: [Moves.PinMissile],
        25: [Moves.Ingrain],
        29: [Moves.FeintAttack],
        33: [Moves.Spikes],
        37: [Moves.NeedleArm],
        41: [Moves.CottonSpore],
        45: [Moves.Sandstorm],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Acid, Moves.GrassWhistle, Moves.TeeterDance],
    },
  });

  registerSpecies(Species.Cacturne, {
    dexNumber: 332,
    name: 'Cacturne',
    category: 'Scarecrow Pokemon',
    height: 1.3,
    weight: 77.4,
    family: Families.Cacnea,
    evolvesFrom: Species.Cacnea,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 115,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 115,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 55,
    },
    types: [Types.Grass, Types.Dark],
    abilities: [Abilities.SandVeil],
    // Two the mainline never gave it: a cactus is unpleasant to
    // touch, and the sand it stalks through is what it moves fastest
    // in
    hiddenAbilities: [Abilities.WaterAbsorb, Abilities.RoughSkin, Abilities.SandRush],
    eggGroups: [EggGroups.Grass, EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Desert, Biome.ColdDesert],
    // It follows travellers once the sun is off it
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.PoisonSting, Moves.Leer, Moves.Absorb, Moves.Growth],
        13: [Moves.LeechSeed],
        17: [Moves.SandAttack],
        21: [Moves.PinMissile],
        25: [Moves.Ingrain],
        29: [Moves.FeintAttack],
        35: [Moves.Spikes],
        41: [Moves.NeedleArm],
        47: [Moves.CottonSpore],
        53: [Moves.Sandstorm],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Strength, Moves.MegaKick],
    },
  });
}
