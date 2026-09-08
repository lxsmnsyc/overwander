import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The three golems, sealed one to a chamber. They are built to the
 * same plan: one ability the mainline gave all three, one of its own,
 * and the same nine moves at the same nine levels, differing only in
 * the blow each throws at 9
 */

// TM and tutor moves all three share
const GOLEM_TEACHABLE = [
  Moves.FocusPunch,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.Protect,
  Moves.Safeguard,
  Moves.Frustration,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Earthquake,
  Moves.Return,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Strength,
  Moves.RockSmash,
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Mimic,
  Moves.ThunderWave,
  Moves.Explosion,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.Rollout,
  Moves.PsychUp,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.IcePunch,
  Moves.Swagger,
  Moves.ThunderPunch,
  Moves.SleepTalk,
  Moves.DefenseCurl,
];

export default function registerRegiSpecies(): void {
  registerSpecies(Species.Regirock, {
    dexNumber: 377,
    name: 'Regirock',
    category: 'Rock Peak Pokemon',
    height: 1.7,
    weight: 230,
    family: Families.Regirock,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 100,
      [Stats.Defense]: 200,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 50,
    },
    types: [Types.Rock],
    abilities: [Abilities.ClearBody],
    // Solid Rock and Sand Force are this registry's rather than the
    // mainline's: a wall of boulders takes the worst of a blow, and
    // the desert it was sealed in is where it hits hardest
    hiddenAbilities: [Abilities.Sturdy, Abilities.SolidRock, Abilities.SandForce],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Explosion],
        9: [Moves.RockThrow],
        17: [Moves.Curse],
        25: [Moves.Superpower],
        33: [Moves.AncientPower],
        41: [Moves.IronDefense],
        49: [Moves.ZapCannon],
        57: [Moves.LockOn],
        65: [Moves.HyperBeam],
      },
      teachable: [
        ...GOLEM_TEACHABLE,
        Moves.SunnyDay,
        Moves.Dig,
        Moves.Sandstorm,
        Moves.RockTomb,
        Moves.FirePunch,
      ],
    },
  });

  registerSpecies(Species.Regice, {
    dexNumber: 378,
    name: 'Regice',
    category: 'Iceberg Pokemon',
    height: 1.8,
    weight: 175,
    family: Families.Regice,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 50,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 200,
      [Stats.Speed]: 50,
    },
    types: [Types.Ice],
    abilities: [Abilities.ClearBody],
    // Filter and Slush Rush are this registry's: an iceberg takes the
    // worst of a blow, and hail is the one thing that moves it
    hiddenAbilities: [Abilities.IceBody, Abilities.Filter, Abilities.SlushRush],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Glacier, Biome.PolarOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Explosion],
        9: [Moves.IcyWind],
        17: [Moves.Curse],
        25: [Moves.Superpower],
        33: [Moves.AncientPower],
        41: [Moves.Amnesia],
        49: [Moves.ZapCannon],
        57: [Moves.LockOn],
        65: [Moves.HyperBeam],
      },
      teachable: [
        ...GOLEM_TEACHABLE,
        Moves.Hail,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.RainDance,
        Moves.IcyWind,
      ],
    },
  });

  registerSpecies(Species.Registeel, {
    dexNumber: 379,
    name: 'Registeel',
    category: 'Iron Pokemon',
    height: 1.9,
    weight: 205,
    family: Families.Registeel,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 75,
      [Stats.Defense]: 150,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 150,
      [Stats.Speed]: 50,
    },
    types: [Types.Steel],
    abilities: [Abilities.ClearBody],
    // Steelworker and Filter are this registry's: a body hammered out
    // of one metal swings it hardest, and takes the worst of a blow
    hiddenAbilities: [Abilities.LightMetal, Abilities.Steelworker, Abilities.Filter],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Explosion],
        9: [Moves.MetalClaw],
        17: [Moves.Curse],
        25: [Moves.Superpower],
        33: [Moves.AncientPower],
        41: [Moves.Amnesia, Moves.IronDefense],
        49: [Moves.ZapCannon],
        57: [Moves.LockOn],
        65: [Moves.HyperBeam],
      },
      teachable: [
        ...GOLEM_TEACHABLE,
        Moves.SunnyDay,
        Moves.RainDance,
        Moves.Sandstorm,
        Moves.RockTomb,
        Moves.AerialAce,
      ],
    },
  });
}
