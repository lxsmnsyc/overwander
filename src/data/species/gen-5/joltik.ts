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
  Moves.Agility,
  Moves.Attract,
  Moves.Bounce,
  Moves.BugBite,
  Moves.BugBuzz,
  Moves.ChargeBeam,
  Moves.CrossPoison,
  Moves.Cut,
  Moves.DoubleTeam,
  Moves.ElectroBall,
  Moves.Electroweb,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GastroAcid,
  Moves.GigaDrain,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.LeechLife,
  Moves.LightScreen,
  Moves.MagnetRise,
  Moves.PinMissile,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.Screech,
  Moves.SecretPower,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StruggleBug,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Swift,
  Moves.Thief,
  Moves.Thunder,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.VoltSwitch,
  Moves.WildCharge,
  Moves.XScissor,
];

// What the spider works out how to do at whichever size
const FAMILY_LEVEL = {
  7: [Moves.Screech],
  20: [Moves.ElectroBall],
  23: [Moves.GastroAcid],
  24: [Moves.Agility],
  26: [Moves.Slash],
  28: [Moves.SuckerPunch],
  34: [Moves.SignalBeam],
};

/**
 * The spiders: a Joltik clings to something bigger and drinks the
 * static off it, and a Galvantula strings a fence of charged silk
 * across whatever it wants kept away
 */
export default function registerJoltikSpecies(): void {
  registerSpecies(Species.Joltik, {
    dexNumber: 595,
    evolvesInto: [
      {
        species: Species.Galvantula,
        method: EvolutionMethod.Level,
        level: 36,
      },
    ],
    name: 'Joltik',
    category: 'Attaching Pokemon',
    height: 0.1,
    weight: 0.6,
    family: Families.Joltik,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 47,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 57,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 65,
    },
    types: [Types.Bug, Types.Electric],
    abilities: [Abilities.CompoundEyes, Abilities.Unnerve],
    hiddenAbilities: [Abilities.Swarm],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Absorb, Moves.StringShot, Moves.LeechLife, Moves.SpiderWeb, Moves.FuryCutter],
        4: [Moves.ThunderWave, Moves.Electroweb],
        8: [Moves.BugBite],
        ...FAMILY_LEVEL,
        37: [Moves.Discharge],
        48: [Moves.BugBuzz],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Camouflage,
        Moves.CrossPoison,
        Moves.Disable,
        Moves.FeintAttack,
        Moves.PinMissile,
        Moves.PoisonSting,
        Moves.Pursuit,
        Moves.RockClimb,
      ],
    },
  });
  registerSpecies(Species.Galvantula, {
    dexNumber: 596,
    name: 'Galvantula',
    category: 'EleSpider Pokemon',
    height: 0.8,
    weight: 14.3,
    family: Families.Joltik,
    evolvesFrom: Species.Joltik,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 77,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 97,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 108,
    },
    types: [Types.Bug, Types.Electric],
    abilities: [Abilities.CompoundEyes, Abilities.Unnerve],
    // Static is the invented fourth: the line reaches three, and a
    // spider that makes its own current by rubbing is what it is
    hiddenAbilities: [Abilities.Swarm, Abilities.Static],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Mountain],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Absorb,
          Moves.StringShot,
          Moves.ThunderWave,
          Moves.LeechLife,
          Moves.SpiderWeb,
          Moves.FuryCutter,
          Moves.BugBite,
          Moves.Electroweb,
        ],
        ...FAMILY_LEVEL,
        39: [Moves.Discharge],
        56: [Moves.BugBuzz],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Charge, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
