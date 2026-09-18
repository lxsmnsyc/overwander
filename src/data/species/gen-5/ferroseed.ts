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
  Moves.Assurance,
  Moves.Attract,
  Moves.BulletSeed,
  Moves.DoubleTeam,
  Moves.Endeavor,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Explosion,
  Moves.Facade,
  Moves.Flash,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.Gravity,
  Moves.GyroBall,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.KnockOff,
  Moves.MagnetRise,
  Moves.NaturePower,
  Moves.Payback,
  Moves.PinMissile,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Revenge,
  Moves.RockPolish,
  Moves.RockSmash,
  Moves.Round,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.SelfDestruct,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Spikes,
  Moves.StealthRock,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.WorrySeed,
];

// What a thing hanging off the ceiling learns to do to whatever walks
// underneath it
const FAMILY_LEVEL = {
  15: [Moves.Ingrain],
  20: [Moves.FlashCannon],
  21: [Moves.GyroBall],
  25: [Moves.IronHead],
  26: [Moves.IronDefense],
  30: [Moves.SelfDestruct, Moves.MirrorShot],
};

/**
 * The thorn pods: a Ferroseed hooks itself to a cave roof and pulls
 * the minerals out of it, and a Ferrothorn lets go and drags the
 * spikes along with it
 */
export default function registerFerroseedSpecies(): void {
  registerSpecies(Species.Ferroseed, {
    dexNumber: 597,
    evolvesInto: [
      {
        species: Species.Ferrothorn,
        method: EvolutionMethod.Level,
        level: 40,
      },
    ],
    name: 'Ferroseed',
    category: 'Thorn Seed Pokemon',
    height: 0.6,
    weight: 18.8,
    family: Families.Ferroseed,
    stats: {
      [Stats.HP]: 44,
      [Stats.Attack]: 50,
      [Stats.Defense]: 91,
      [Stats.SpecialAttack]: 24,
      [Stats.SpecialDefense]: 86,
      [Stats.Speed]: 10,
    },
    types: [Types.Grass, Types.Steel],
    abilities: [Abilities.IronBarbs],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Grass, EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Harden],
        5: [Moves.MetalClaw],
        6: [Moves.Rollout],
        9: [Moves.Curse],
        10: [Moves.PinMissile],
        ...FAMILY_LEVEL,
        47: [Moves.Payback],
        50: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AcidSpray,
        Moves.BulletSeed,
        Moves.Gravity,
        Moves.KnockOff,
        Moves.LeechSeed,
        Moves.RockClimb,
        Moves.SeedBomb,
        Moves.Spikes,
        Moves.StealthRock,
        Moves.Toxic,
        Moves.WorrySeed,
      ],
    },
  });
  registerSpecies(Species.Ferrothorn, {
    dexNumber: 598,
    name: 'Ferrothorn',
    category: 'Thorn Pod Pokemon',
    height: 1,
    weight: 110,
    family: Families.Ferroseed,
    evolvesFrom: Species.Ferroseed,
    stats: {
      [Stats.HP]: 74,
      [Stats.Attack]: 94,
      [Stats.Defense]: 131,
      [Stats.SpecialAttack]: 54,
      [Stats.SpecialDefense]: 116,
      [Stats.Speed]: 20,
    },
    types: [Types.Grass, Types.Steel],
    abilities: [Abilities.IronBarbs],
    // The line reaches only two, so both of the last slots are
    // invented: nothing settles on a pod of iron spikes, and a thing
    // with 131 Defense is there to be stood in front of
    hiddenAbilities: [Abilities.Anticipation, Abilities.Overcoat, Abilities.Sturdy],
    eggGroups: [EggGroups.Grass, EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Tackle,
          Moves.PinMissile,
          Moves.Harden,
          Moves.Curse,
          Moves.Rollout,
          Moves.MetalClaw,
          Moves.RockClimb,
          Moves.PowerWhip,
        ],
        ...FAMILY_LEVEL,
        53: [Moves.Payback],
        56: [Moves.Explosion],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.AerialAce,
        Moves.Block,
        Moves.Bulldoze,
        Moves.Cut,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.HeavySlam,
        Moves.HyperBeam,
        Moves.PowerWhip,
        Moves.Sandstorm,
        Moves.ShadowClaw,
        Moves.Strength,
        Moves.SwordsDance,
        Moves.Thunder,
      ],
    },
  });
}
