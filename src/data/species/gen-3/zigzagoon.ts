import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.IronTail,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Return,
  Moves.Dig,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.Cut,
  Moves.Surf,
  Moves.RockSmash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.ThunderWave,
  Moves.Rollout,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.SleepTalk,
  Moves.DefenseCurl,
  Moves.Swift,
];

export default function registerZigzagoonSpecies(): void {
  registerSpecies(Species.Zigzagoon, {
    dexNumber: 263,
    evolvesInto: [
      {
        species: Species.Linoone,
        method: EvolutionMethod.Level,
        level: 20,
      },
    ],
    name: 'Zigzagoon',
    category: 'Tiny Raccoon Pokemon',
    height: 0.4,
    weight: 17.5,
    family: Families.Zigzagoon,
    stats: {
      [Stats.HP]: 38,
      [Stats.Attack]: 30,
      [Stats.Defense]: 41,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 41,
      [Stats.Speed]: 60,
    },
    types: [Types.Normal],
    abilities: [Abilities.Pickup, Abilities.Gluttony],
    hiddenAbilities: [Abilities.QuickFeet],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        5: [Moves.TailWhip],
        9: [Moves.Headbutt],
        13: [Moves.SandAttack],
        17: [Moves.OdorSleuth],
        21: [Moves.MudSport],
        25: [Moves.PinMissile],
        29: [Moves.Covet],
        33: [Moves.Flail],
        37: [Moves.Rest],
        41: [Moves.BellyDrum],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Charm, Moves.Pursuit, Moves.Tickle, Moves.Trick],
    },
  });

  registerSpecies(Species.Linoone, {
    dexNumber: 264,
    name: 'Linoone',
    category: 'Rushing Pokemon',
    height: 0.5,
    weight: 32.5,
    family: Families.Zigzagoon,
    evolvesFrom: Species.Zigzagoon,
    stats: {
      [Stats.HP]: 78,
      [Stats.Attack]: 70,
      [Stats.Defense]: 61,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 61,
      [Stats.Speed]: 100,
    },
    types: [Types.Normal],
    abilities: [Abilities.Pickup, Abilities.Gluttony],
    // Frisk is this registry's rather than the mainline's: it already
    // rummages with Pickup, Covet and Thief, and a final evolution is
    // filled to four
    hiddenAbilities: [Abilities.QuickFeet, Abilities.Frisk],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl, Moves.TailWhip, Moves.Headbutt],
        13: [Moves.SandAttack],
        17: [Moves.OdorSleuth],
        23: [Moves.MudSport],
        29: [Moves.FurySwipes],
        35: [Moves.Covet],
        41: [Moves.Slash],
        47: [Moves.Rest],
        53: [Moves.BellyDrum],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Roar, Moves.HyperBeam, Moves.Strength],
    },
  });
}
