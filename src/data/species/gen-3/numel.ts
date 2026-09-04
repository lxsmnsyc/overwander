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
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.Frustration,
  Moves.Earthquake,
  Moves.Return,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Flamethrower,
  Moves.Sandstorm,
  Moves.FireBlast,
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Overheat,
  Moves.Strength,
  Moves.RockSmash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Rollout,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

export default function registerNumelSpecies(): void {
  registerSpecies(Species.Numel, {
    dexNumber: 322,
    evolvesInto: [
      {
        species: Species.Camerupt,
        method: EvolutionMethod.Level,
        level: 33,
      },
    ],
    name: 'Numel',
    category: 'Numb Pokemon',
    height: 0.7,
    weight: 24,
    family: Families.Numel,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 60,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 35,
    },
    types: [Types.Fire, Types.Ground],
    abilities: [Abilities.Oblivious, Abilities.Simple],
    hiddenAbilities: [Abilities.OwnTempo],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Volcano, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        11: [Moves.Ember],
        19: [Moves.Magnitude],
        25: [Moves.FocusEnergy],
        29: [Moves.TakeDown],
        31: [Moves.Amnesia],
        35: [Moves.Earthquake],
        41: [Moves.Flamethrower],
        49: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Howl, Moves.ScaryFace, Moves.Stomp],
    },
  });

  registerSpecies(Species.Camerupt, {
    dexNumber: 323,
    name: 'Camerupt',
    category: 'Eruption Pokemon',
    height: 1.9,
    weight: 220,
    family: Families.Numel,
    evolvesFrom: Species.Numel,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 100,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 40,
    },
    types: [Types.Fire, Types.Ground],
    abilities: [Abilities.MagmaArmor, Abilities.SolidRock],
    hiddenAbilities: [Abilities.AngerPoint],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 150,
    biomes: [Biome.Volcano, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.Ember, Moves.Magnitude],
        25: [Moves.FocusEnergy],
        29: [Moves.TakeDown],
        31: [Moves.Amnesia],
        33: [Moves.RockSlide],
        37: [Moves.Earthquake],
        45: [Moves.Eruption],
        55: [Moves.Fissure],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Roar, Moves.HyperBeam, Moves.Explosion],
    },
  });
}
