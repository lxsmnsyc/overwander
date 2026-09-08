import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * Duskull and Dusclops. **Dusclops is not a final evolution**: a
 * Dusknoir stands above it in a later generation, so nothing is
 * invented for it here. What it is short of is the slot that
 * evolution will fill
 */

// TM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.CalmMind,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Taunt,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.DoubleTeam,
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
];

export default function registerDuskullSpecies(): void {
  registerSpecies(Species.Duskull, {
    dexNumber: 355,
    evolvesInto: [
      {
        species: Species.Dusclops,
        method: EvolutionMethod.Level,
        level: 37,
      },
    ],
    name: 'Duskull',
    category: 'Requiem Pokemon',
    height: 0.8,
    weight: 15,
    family: Families.Duskull,
    stats: {
      [Stats.HP]: 20,
      [Stats.Attack]: 40,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 25,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Levitate],
    hiddenAbilities: [Abilities.Frisk],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Badlands, Biome.Woodland],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.NightShade],
        5: [Moves.Disable],
        12: [Moves.Foresight],
        16: [Moves.Astonish],
        23: [Moves.ConfuseRay],
        27: [Moves.Pursuit],
        34: [Moves.Curse],
        38: [Moves.WillOWisp],
        45: [Moves.MeanLook],
        49: [Moves.FutureSight],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.DestinyBond, Moves.FeintAttack, Moves.Grudge, Moves.Imprison, Moves.Memento],
    },
  });

  registerSpecies(Species.Dusclops, {
    dexNumber: 356,
    name: 'Dusclops',
    category: 'Beckon Pokemon',
    height: 1.6,
    weight: 30.6,
    family: Families.Duskull,
    evolvesFrom: Species.Duskull,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 70,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 130,
      [Stats.Speed]: 25,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Pressure],
    hiddenAbilities: [Abilities.Frisk],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Badlands, Biome.Woodland],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.NightShade, Moves.Disable, Moves.Bind],
        12: [Moves.Foresight],
        16: [Moves.Astonish],
        23: [Moves.ConfuseRay],
        27: [Moves.Pursuit],
        34: [Moves.Curse],
        37: [Moves.ShadowPunch],
        41: [Moves.WillOWisp],
        51: [Moves.MeanLook],
        58: [Moves.FutureSight],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.FocusPunch,
        Moves.HyperBeam,
        Moves.Earthquake,
        Moves.RockTomb,
        Moves.Strength,
        Moves.RockSmash,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Metronome,
        Moves.RockSlide,
        Moves.DynamicPunch,
        Moves.MudSlap,
        Moves.IcePunch,
        Moves.ThunderPunch,
        Moves.FirePunch,
      ],
    },
  });
}
