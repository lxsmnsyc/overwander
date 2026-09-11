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
  Moves.FirePunch,
  Moves.IcePunch,
  Moves.ThunderPunch,
  Moves.Toxic,
  Moves.Surf,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DefenseCurl,
  Moves.Swift,
  Moves.Rest,
  Moves.Cut,
  Moves.Headbutt,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.DynamicPunch,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.ShadowBall,
  Moves.BodySlam,
  Moves.BrickBreak,
  Moves.Facade,
  Moves.Flamethrower,
  Moves.FocusPunch,
  Moves.IceBeam,
  Moves.Mimic,
  Moves.SecretPower,
  Moves.ShockWave,
  Moves.SolarBeam,
  Moves.Thunderbolt,
  Moves.WaterPulse,
];

export default function registerSentretSpecies(): void {
  registerSpecies(Species.Sentret, {
    dexNumber: 161,
    evolvesInto: [
      {
        species: Species.Furret,
        method: EvolutionMethod.Level,
        level: 15,
      },
    ],
    name: 'Sentret',
    category: 'Scout Pokemon',
    height: 0.8,
    weight: 6,
    family: Families.Sentret,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 46,
      [Stats.Defense]: 34,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 20,
    },
    types: [Types.Normal],
    abilities: [Abilities.RunAway, Abilities.KeenEye],
    hiddenAbilities: [Abilities.Frisk],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        31: [Moves.FollowMe],
        1: [Moves.Tackle, Moves.Scratch],
        5: [Moves.DefenseCurl],
        11: [Moves.QuickAttack],
        17: [Moves.FurySwipes, Moves.HelpingHand],
        25: [Moves.Slam],
        33: [Moves.Rest],
        41: [Moves.Amnesia],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.DoubleEdge,
        Moves.FocusEnergy,
        Moves.Slash,
        Moves.Reversal,
        Moves.Pursuit,
        Moves.Assist,
        Moves.Substitute,
        Moves.Trick,
      ],
    },
  });

  registerSpecies(Species.Furret, {
    dexNumber: 162,
    name: 'Furret',
    category: 'Long Body Pokemon',
    height: 1.8,
    weight: 32.5,
    family: Families.Sentret,
    evolvesFrom: Species.Sentret,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 76,
      [Stats.Defense]: 64,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 90,
    },
    types: [Types.Normal],
    abilities: [Abilities.RunAway, Abilities.KeenEye],
    // Scrappy is this registry's rather than the mainline's, filling a
    // final evolution to four: a scout walks up to whatever is there,
    // and it is the one thing that gives a pure Normal type a ghost to
    // hit
    hiddenAbilities: [Abilities.Frisk, Abilities.Scrappy],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        19: [Moves.HelpingHand],
        37: [Moves.FollowMe],
        1: [Moves.Scratch, Moves.QuickAttack, Moves.DefenseCurl],
        18: [Moves.FurySwipes],
        28: [Moves.Slam],
        38: [Moves.Rest],
        48: [Moves.Amnesia],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.Strength,
        Moves.Blizzard,
        Moves.DoubleEdge,
        Moves.RockSmash,
        Moves.Substitute,
        Moves.Thunder,
      ],
    },
  });
}
