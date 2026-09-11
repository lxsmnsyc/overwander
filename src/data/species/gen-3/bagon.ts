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
  Moves.DragonClaw,
  Moves.Roar,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.Flamethrower,
  Moves.FireBlast,
  Moves.RockTomb,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Cut,
  Moves.Strength,
  Moves.RockSmash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.SleepTalk,
];

// What the shell brings: a Bagon has nothing to curl up into
const SHELLED_TEACHABLE = [Moves.Rollout, Moves.DefenseCurl];

export default function registerBagonSpecies(): void {
  registerSpecies(Species.Bagon, {
    dexNumber: 371,
    evolvesInto: [
      {
        species: Species.Shelgon,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Bagon',
    category: 'Rock Head Pokemon',
    height: 0.6,
    weight: 42.1,
    family: Families.Bagon,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 75,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 50,
    },
    types: [Types.Dragon],
    abilities: [Abilities.RockHead],
    hiddenAbilities: [Abilities.SheerForce],
    eggGroups: [EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.AlpineTundra],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Rage],
        5: [Moves.Bite],
        9: [Moves.Leer],
        17: [Moves.Headbutt],
        21: [Moves.FocusEnergy],
        25: [Moves.Ember],
        33: [Moves.DragonBreath],
        37: [Moves.ScaryFace],
        41: [Moves.Crunch],
        49: [Moves.DragonClaw],
        53: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.DragonDance, Moves.DragonRage, Moves.HydroPump, Moves.Thrash, Moves.Twister],
    },
  });

  registerSpecies(Species.Shelgon, {
    dexNumber: 372,
    evolvesInto: [
      {
        species: Species.Salamence,
        method: EvolutionMethod.Level,
        level: 50,
      },
    ],
    name: 'Shelgon',
    category: 'Endurance Pokemon',
    height: 1.1,
    weight: 110.5,
    family: Families.Bagon,
    evolvesFrom: Species.Bagon,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 95,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 50,
    },
    types: [Types.Dragon],
    abilities: [Abilities.RockHead],
    hiddenAbilities: [Abilities.Overcoat],
    eggGroups: [EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.AlpineTundra],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Rage, Moves.Bite, Moves.Leer, Moves.Headbutt],
        21: [Moves.FocusEnergy],
        25: [Moves.Ember],
        30: [Moves.Protect],
        38: [Moves.DragonBreath],
        47: [Moves.ScaryFace],
        56: [Moves.Crunch],
        69: [Moves.DragonClaw],
        78: [Moves.DoubleEdge],
      },
      teachable: [...FAMILY_TEACHABLE, ...SHELLED_TEACHABLE],
    },
  });

  registerSpecies(Species.Salamence, {
    dexNumber: 373,
    name: 'Salamence',
    category: 'Dragon Pokemon',
    height: 1.5,
    weight: 102.6,
    family: Families.Bagon,
    evolvesFrom: Species.Shelgon,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 135,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 100,
    },
    types: [Types.Dragon, Types.Flying],
    abilities: [Abilities.Intimidate],
    hiddenAbilities: [Abilities.Moxie],
    eggGroups: [EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.AlpineTundra],
    activeTimes: TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Rage, Moves.Bite, Moves.Leer, Moves.Headbutt],
        21: [Moves.FocusEnergy],
        25: [Moves.Ember],
        30: [Moves.Protect],
        38: [Moves.DragonBreath],
        47: [Moves.ScaryFace],
        50: [Moves.Fly],
        61: [Moves.Crunch],
        79: [Moves.DragonClaw],
        93: [Moves.DoubleEdge],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        ...SHELLED_TEACHABLE,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.Earthquake,
        Moves.SteelWing,
        Moves.Fly,
        Moves.Swift,
      ],
    },
  });
}
