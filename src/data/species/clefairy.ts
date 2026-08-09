import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import EggGroups from '../ids/egg-groups';
import Families from '../ids/families';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { registerSpecies } from './__create';

// RBY TM/HM moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.BubbleBeam,
  Moves.WaterGun,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.PayDay,
  Moves.Submission,
  Moves.SeismicToss,
  Moves.Rage,
  Moves.SolarBeam,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Psychic,
  Moves.Teleport,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.FireBlast,
  Moves.SkullBash,
  Moves.Rest,
  Moves.ThunderWave,
  Moves.Psywave,
  Moves.Substitute,
  Moves.Strength,
  Moves.Flash,
];

export default function registerClefairySpecies(): void {
  registerSpecies(Species.Clefairy, {
    dexNumber: 35,
    name: 'Clefairy',
    category: 'Fairy Pokemon',
    family: Families.Clefairy,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 45,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 35,
    },
    types: [Types.Fairy],
    abilities: [Abilities.FriendGuard, Abilities.CuteCharm, Abilities.MagicGuard],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 150,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Growl],
        13: [Moves.Sing],
        18: [Moves.DoubleSlap],
        24: [Moves.Minimize],
        31: [Moves.Metronome],
        39: [Moves.DefenseCurl],
        48: [Moves.LightScreen],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Clefable, {
    dexNumber: 36,
    name: 'Clefable',
    category: 'Fairy Pokemon',
    family: Families.Clefairy,
    evolvesFrom: Species.Clefairy,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 70,
      [Stats.Defense]: 73,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 60,
    },
    types: [Types.Fairy],
    abilities: [Abilities.Unaware, Abilities.CuteCharm, Abilities.MagicGuard],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [1, 3],
    catchRate: 25,
    learnSet: {
      level: {
        1: [Moves.Sing, Moves.DoubleSlap, Moves.Minimize, Moves.Metronome],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
