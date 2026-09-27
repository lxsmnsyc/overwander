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
  Moves.AfterYou,
  Moves.AllySwitch,
  Moves.Attract,
  Moves.Block,
  Moves.CalmMind,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Embargo,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FakeTears,
  Moves.Flash,
  Moves.Frustration,
  Moves.Hex,
  Moves.HiddenPower,
  Moves.Imprison,
  Moves.IronDefense,
  Moves.KnockOff,
  Moves.MagicCoat,
  Moves.NastyPlot,
  Moves.PainSplit,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RolePlay,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShockWave,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snatch,
  Moves.Snore,
  Moves.Spite,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.Toxic,
  Moves.ToxicSpikes,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.WillOWisp,
  Moves.WonderRoom,
  Moves.ZenHeadbutt,
  Moves.Confide,
  Moves.Infestation,
];

// What it does whether it is carrying the mask or wearing the coffin
const FAMILY_LEVEL = {
  16: [Moves.WillOWisp],
  17: [Moves.Hex],
  25: [Moves.OminousWind],
  28: [Moves.MeanLook],
  29: [Moves.Curse],
  32: [Moves.Grudge],
  33: [Moves.GuardSplit, Moves.PowerSplit],
};

/**
 * The tomb pair: a Yamask carries the face it had when it was a person
 * and cries at it, and a Cofagrigus is what the robbers who went
 * looking for gold ended up inside
 */
export default function registerYamaskSpecies(): void {
  registerSpecies(Species.Yamask, {
    dexNumber: 562,
    evolvesInto: [
      {
        species: Species.Cofagrigus,
        method: EvolutionMethod.Level,
        level: 34,
      },
    ],
    name: 'Yamask',
    category: 'Spirit Pokemon',
    height: 0.5,
    weight: 1.5,
    family: Families.Yamask,
    stats: {
      [Stats.HP]: 38,
      [Stats.Attack]: 30,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 30,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Mummy],
    hiddenAbilities: [],
    eggGroups: [EggGroups.Mineral, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Protect, Moves.Astonish],
        4: [Moves.Haze],
        5: [Moves.Disable],
        8: [Moves.NightShade],
        ...FAMILY_LEVEL,
        37: [Moves.ShadowBall],
        44: [Moves.DarkPulse],
        49: [Moves.DestinyBond],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AllySwitch,
        Moves.Disable,
        Moves.Endure,
        Moves.FakeTears,
        Moves.HealBlock,
        Moves.Imprison,
        Moves.Memento,
        Moves.NastyPlot,
        Moves.Nightmare,
        Moves.ToxicSpikes,
      ],
    },
  });
  registerSpecies(Species.Cofagrigus, {
    dexNumber: 563,
    name: 'Cofagrigus',
    category: 'Coffin Pokemon',
    height: 1.7,
    weight: 76.5,
    family: Families.Yamask,
    evolvesFrom: Species.Yamask,
    stats: {
      [Stats.HP]: 58,
      [Stats.Attack]: 50,
      [Stats.Defense]: 145,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 105,
      [Stats.Speed]: 30,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Mummy],
    // The line reaches only Mummy, so three of the four are invented:
    // a coffin takes the weapon off whoever opens it, wears out anybody
    // who keeps trying, and takes the robber down with it
    hiddenAbilities: [Abilities.CursedBody, Abilities.Pressure, Abilities.PerishBody],
    eggGroups: [EggGroups.Mineral, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Disable,
          Moves.NightShade,
          Moves.Haze,
          Moves.Protect,
          Moves.Astonish,
          Moves.ScaryFace,
          Moves.ShadowClaw,
        ],
        ...FAMILY_LEVEL,
        39: [Moves.ShadowBall],
        50: [Moves.DarkPulse],
        57: [Moves.DestinyBond],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.GuardSwap,
        Moves.HyperBeam,
        Moves.PowerSwap,
        Moves.Revenge,
        Moves.ScaryFace,
        Moves.ShadowClaw,
      ],
    },
  });
}
