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
  Moves.Attract,
  Moves.BrickBreak,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Encore,
  Moves.Endeavor,
  Moves.Endure,
  Moves.Facade,
  Moves.FireBlast,
  Moves.FireFang,
  Moves.FirePunch,
  Moves.FireSpin,
  Moves.FlameCharge,
  Moves.Flamethrower,
  Moves.FlareBlitz,
  Moves.Fling,
  Moves.FocusEnergy,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.GyroBall,
  Moves.HeatWave,
  Moves.HiddenPower,
  Moves.Incinerate,
  Moves.MegaKick,
  Moves.MegaPunch,
  Moves.Overheat,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snatch,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Superpower,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Thief,
  Moves.Toxic,
  Moves.UTurn,
  Moves.Uproar,
  Moves.WillOWisp,
  Moves.WorkUp,
  Moves.ZenHeadbutt,
];

// What the doll grows into swinging, whichever shape it is in
const FAMILY_LEVEL = {
  11: [Moves.FireFang],
  14: [Moves.Headbutt],
  16: [Moves.WorkUp],
  19: [Moves.Facade],
  22: [Moves.FirePunch],
  27: [Moves.Thrash],
  30: [Moves.BellyDrum],
  33: [Moves.FlareBlitz],
};

// The two shapes share everything but their stats and the second type
const DARMANITAN_SHARED = {
  dexNumber: 555,
  height: 1.3,
  weight: 92.9,
  family: Families.Darumaka,
  evolvesFrom: Species.Darumaka,
  eggGroups: [EggGroups.Field],
  genderRatio: [1, 1] as [number, number],
  catchRate: 60,
  biomes: [Biome.Desert, Biome.Badlands],
  activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
  learnSet: {
    level: {
      1: [Moves.Tackle, Moves.Bite, Moves.Ember, Moves.Rage, Moves.Rollout, Moves.Taunt],
      ...FAMILY_LEVEL,
      32: [Moves.Uproar],
      47: [Moves.Superpower],
      54: [Moves.Overheat],
    },
    teachable: [
      ...FAMILY_TEACHABLE,
      Moves.BodySlam,
      Moves.BulkUp,
      Moves.Bulldoze,
      Moves.Earthquake,
      Moves.FocusBlast,
      Moves.FutureSight,
      Moves.GigaImpact,
      Moves.GuardSwap,
      Moves.HyperBeam,
      Moves.IronDefense,
      Moves.IronHead,
      Moves.Payback,
      Moves.PowerSwap,
      Moves.Psychic,
      Moves.Reversal,
      Moves.SmackDown,
      Moves.StoneEdge,
      Moves.Torment,
      Moves.Trick,
    ],
  },
};

/**
 * The daruma dolls: a Darumaka burns whatever it eats down to coal in
 * its belly, and a Darmanitan that has taken enough sits down and
 * stops moving, which is when it is at its most dangerous
 */
export default function registerDarumakaSpecies(): void {
  registerSpecies(Species.Darumaka, {
    dexNumber: 554,
    evolvesInto: [
      {
        species: Species.Darmanitan,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Darumaka',
    category: 'Zen Charm Pokemon',
    height: 0.6,
    weight: 37.5,
    family: Families.Darumaka,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 90,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 15,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 50,
    },
    types: [Types.Fire],
    abilities: [Abilities.Hustle],
    hiddenAbilities: [Abilities.InnerFocus],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Ember],
        3: [Moves.Rollout],
        4: [Moves.Taunt],
        6: [Moves.Incinerate],
        8: [Moves.Bite],
        9: [Moves.Rage],
        ...FAMILY_LEVEL,
        17: [Moves.Uproar],
        39: [Moves.Superpower],
        42: [Moves.Overheat],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Encore,
        Moves.Endure,
        Moves.Extrasensory,
        Moves.FlameWheel,
        Moves.FocusEnergy,
        Moves.FocusPunch,
        Moves.HammerArm,
        Moves.SleepTalk,
        Moves.Snatch,
        Moves.TakeDown,
        Moves.Yawn,
      ],
    },
  });
  registerSpecies(Species.Darmanitan, {
    ...DARMANITAN_SHARED,
    name: 'Darmanitan',
    category: 'Blazing Pokemon',
    stats: {
      [Stats.HP]: 105,
      [Stats.Attack]: 140,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 95,
    },
    types: [Types.Fire],
    abilities: [Abilities.SheerForce],
    hiddenAbilities: [Abilities.ZenMode],
  });
  registerSpecies(Species.DarmanitanZen, {
    ...DARMANITAN_SHARED,
    name: 'Darmanitan Zen',
    category: 'Blazing Pokemon',
    // Sitting down turns it inside out: what it hit with becomes what
    // it thinks with, and it is far harder to shift
    baseForm: false,
    // A shape it only ever takes mid-fight, so nothing meets one
    biomes: [],
    stats: {
      [Stats.HP]: 105,
      [Stats.Attack]: 30,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 140,
      [Stats.SpecialDefense]: 105,
      [Stats.Speed]: 55,
    },
    types: [Types.Fire, Types.Psychic],
    abilities: [Abilities.SheerForce],
    hiddenAbilities: [Abilities.ZenMode],
  });
}
