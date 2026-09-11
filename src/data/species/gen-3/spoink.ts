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
  Moves.CalmMind,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Taunt,
  Moves.LightScreen,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.IronTail,
  Moves.Return,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.ShockWave,
  Moves.Torment,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.SkillSwap,
  Moves.Snatch,
  Moves.Flash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.DreamEater,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerSpoinkSpecies(): void {
  registerSpecies(Species.Spoink, {
    dexNumber: 325,
    evolvesInto: [
      {
        species: Species.Grumpig,
        method: EvolutionMethod.Level,
        level: 32,
      },
    ],
    name: 'Spoink',
    category: 'Bounce Pokemon',
    height: 0.7,
    weight: 30.6,
    family: Families.Spoink,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 25,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 60,
    },
    types: [Types.Psychic],
    abilities: [Abilities.ThickFat, Abilities.OwnTempo],
    hiddenAbilities: [Abilities.Gluttony],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Mountain, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Splash],
        7: [Moves.Psywave],
        10: [Moves.OdorSleuth],
        16: [Moves.Psybeam],
        19: [Moves.PsychUp],
        25: [Moves.ConfuseRay],
        28: [Moves.MagicCoat],
        34: [Moves.Psychic],
        37: [Moves.Rest, Moves.Snore],
        43: [Moves.Bounce],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Extrasensory, Moves.FutureSight, Moves.Trick],
    },
  });

  registerSpecies(Species.Grumpig, {
    dexNumber: 326,
    name: 'Grumpig',
    category: 'Manipulate Pokemon',
    height: 0.9,
    weight: 71.5,
    family: Families.Spoink,
    evolvesFrom: Species.Spoink,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 45,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 80,
    },
    types: [Types.Psychic],
    abilities: [Abilities.ThickFat, Abilities.OwnTempo],
    // One the mainline never gave it: the pearls are what it reads
    // the other side with
    hiddenAbilities: [Abilities.Gluttony, Abilities.Forewarn],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Mountain, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Splash, Moves.Psywave, Moves.OdorSleuth, Moves.Psybeam],
        19: [Moves.PsychUp],
        25: [Moves.ConfuseRay],
        28: [Moves.MagicCoat],
        37: [Moves.Psychic],
        43: [Moves.Rest, Moves.Snore],
        55: [Moves.Bounce],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.FocusPunch,
        Moves.HyperBeam,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.DynamicPunch,
        Moves.MudSlap,
        Moves.IcePunch,
        Moves.ThunderPunch,
        Moves.FirePunch,
      ],
    },
  });
}
