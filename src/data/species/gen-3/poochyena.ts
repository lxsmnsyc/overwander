import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Roar,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Taunt,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.IronTail,
  Moves.Return,
  Moves.Dig,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Torment,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.Snatch,
  Moves.RockSmash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.Mimic,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
];

export default function registerPoochyenaSpecies(): void {
  registerSpecies(Species.Poochyena, {
    dexNumber: 261,
    evolvesInto: [
      {
        species: Species.Mightyena,
        method: EvolutionMethod.Level,
        level: 18,
      },
    ],
    name: 'Poochyena',
    category: 'Bite Pokemon',
    height: 0.5,
    weight: 13.6,
    family: Families.Poochyena,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 55,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 35,
    },
    types: [Types.Dark],
    abilities: [Abilities.RunAway, Abilities.QuickFeet],
    hiddenAbilities: [Abilities.Rattled],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Savanna, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        5: [Moves.Howl],
        9: [Moves.SandAttack],
        13: [Moves.Bite],
        17: [Moves.OdorSleuth],
        21: [Moves.Roar],
        25: [Moves.Swagger],
        29: [Moves.ScaryFace],
        33: [Moves.TakeDown],
        37: [Moves.Taunt],
        41: [Moves.Crunch],
        45: [Moves.Thief],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Astonish, Moves.PoisonFang, Moves.Covet, Moves.Leer, Moves.Yawn],
    },
  });

  registerSpecies(Species.Mightyena, {
    dexNumber: 262,
    name: 'Mightyena',
    category: 'Bite Pokemon',
    height: 1,
    weight: 37,
    family: Families.Poochyena,
    evolvesFrom: Species.Poochyena,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 90,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 70,
    },
    types: [Types.Dark],
    abilities: [Abilities.Intimidate, Abilities.QuickFeet],
    hiddenAbilities: [Abilities.Moxie],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 127,
    biomes: [Biome.Savanna, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Howl, Moves.SandAttack, Moves.Bite],
        17: [Moves.OdorSleuth],
        22: [Moves.Roar],
        27: [Moves.Swagger],
        32: [Moves.ScaryFace],
        37: [Moves.TakeDown],
        42: [Moves.Taunt],
        47: [Moves.Crunch],
        52: [Moves.Thief],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Strength],
    },
  });
}
