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
  Moves.AerialAce,
  Moves.Attract,
  Moves.BrickBreak,
  Moves.Bulldoze,
  Moves.Cut,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DrillRun,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Facade,
  Moves.Fling,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.IronDefense,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.Sandstorm,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.Snore,
  Moves.StealthRock,
  Moves.Strength,
  Moves.Substitute,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.XScissor,
];

/**
 * The diggers: a Drilbur spins its claws into the rock, and an
 * Excadrill is the whole tunnel boring itself
 */
export default function registerDrilburSpecies(): void {
  registerSpecies(Species.Drilbur, {
    dexNumber: 529,
    evolvesInto: [
      {
        species: Species.Excadrill,
        method: EvolutionMethod.Level,
        level: 31,
      },
    ],
    name: 'Drilbur',
    category: 'Mole Pokemon',
    height: 0.3,
    weight: 8.5,
    family: Families.Drilbur,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 85,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 68,
    },
    types: [Types.Ground],
    abilities: [Abilities.SandRush, Abilities.SandForce],
    hiddenAbilities: [Abilities.MoldBreaker],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Badlands, Biome.Desert],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.MudSport, Moves.Scratch],
        5: [Moves.RapidSpin],
        8: [Moves.MudSlap],
        12: [Moves.FurySwipes],
        15: [Moves.MetalClaw],
        19: [Moves.Dig],
        22: [Moves.HoneClaws],
        26: [Moves.Slash],
        29: [Moves.RockSlide],
        33: [Moves.Earthquake],
        36: [Moves.SwordsDance],
        40: [Moves.Sandstorm],
        43: [Moves.DrillRun],
        47: [Moves.Fissure],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.CrushClaw, Moves.MetalSound, Moves.RockClimb, Moves.SkullBash, Moves.Submission],
    },
  });
  registerSpecies(Species.Excadrill, {
    dexNumber: 530,
    name: 'Excadrill',
    category: 'Subterrene Pokemon',
    height: 0.7,
    weight: 40.4,
    family: Families.Drilbur,
    evolvesFrom: Species.Drilbur,
    stats: {
      [Stats.HP]: 110,
      [Stats.Attack]: 135,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 88,
    },
    types: [Types.Ground, Types.Steel],
    abilities: [Abilities.SandRush, Abilities.SandForce],
    // Tough Claws is the invented fourth: the line reaches three, and
    // everything it fights with is a drill or a claw
    hiddenAbilities: [Abilities.MoldBreaker, Abilities.ToughClaws],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Badlands, Biome.Desert],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.MudSlap, Moves.MudSport, Moves.RapidSpin, Moves.Scratch],
        12: [Moves.FurySwipes],
        15: [Moves.MetalClaw],
        19: [Moves.Dig],
        22: [Moves.HoneClaws],
        26: [Moves.Slash],
        29: [Moves.RockSlide],
        31: [Moves.HornDrill],
        36: [Moves.Earthquake],
        42: [Moves.SwordsDance],
        49: [Moves.Sandstorm],
        55: [Moves.DrillRun],
        62: [Moves.Fissure],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.IronHead,
        Moves.MagnetRise,
      ],
    },
  });
}
