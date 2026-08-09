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
  Moves.Toxic,
  Moves.BodySlam,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Bide,
  Moves.Swift,
  Moves.SkullBash,
  Moves.Rest,
  Moves.Reflect,
  Moves.Substitute,
];

export default function registerEeveeSpecies(): void {
  registerSpecies(Species.Eevee, {
    dexNumber: 133,
    name: 'Eevee',
    category: 'Evolution Pokemon',
    family: Families.Eevee,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 55,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 55,
    },
    types: [Types.Normal],
    abilities: [Abilities.Anticipation, Abilities.RunAway, Abilities.Adaptability],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.SandAttack],
        27: [Moves.QuickAttack],
        31: [Moves.TailWhip],
        37: [Moves.Bite],
        45: [Moves.TakeDown],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });

  registerSpecies(Species.Vaporeon, {
    dexNumber: 134,
    name: 'Vaporeon',
    category: 'Bubble Jet Pokemon',
    family: Families.Eevee,
    evolvesFrom: Species.Eevee,
    stats: {
      [Stats.HP]: 130,
      [Stats.Attack]: 65,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 65,
    },
    types: [Types.Water],
    abilities: [Abilities.Hydration, Abilities.WaterAbsorb],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.SandAttack, Moves.QuickAttack, Moves.WaterGun],
        31: [Moves.WaterGun],
        37: [Moves.TailWhip],
        40: [Moves.Bite],
        42: [Moves.AcidArmor],
        44: [Moves.Haze],
        48: [Moves.Mist],
        54: [Moves.HydroPump],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.Surf,
      ],
    },
  });

  registerSpecies(Species.Jolteon, {
    dexNumber: 135,
    name: 'Jolteon',
    category: 'Lightning Pokemon',
    family: Families.Eevee,
    evolvesFrom: Species.Eevee,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 65,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 130,
    },
    types: [Types.Electric],
    abilities: [Abilities.QuickFeet, Abilities.VoltAbsorb],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.SandAttack, Moves.QuickAttack, Moves.ThunderShock],
        31: [Moves.ThunderShock],
        37: [Moves.TailWhip],
        40: [Moves.DoubleKick],
        42: [Moves.PinMissile],
        44: [Moves.Agility],
        48: [Moves.ThunderWave],
        54: [Moves.Thunder],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Flash,
      ],
    },
  });

  registerSpecies(Species.Flareon, {
    dexNumber: 136,
    name: 'Flareon',
    category: 'Flame Pokemon',
    family: Families.Eevee,
    evolvesFrom: Species.Eevee,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 130,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 65,
    },
    types: [Types.Fire],
    abilities: [Abilities.Guts, Abilities.FlashFire],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.SandAttack, Moves.QuickAttack, Moves.Ember],
        31: [Moves.Ember],
        37: [Moves.TailWhip],
        40: [Moves.Bite],
        42: [Moves.Leer],
        44: [Moves.FireSpin],
        48: [Moves.Rage],
        54: [Moves.Flamethrower],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.FireBlast],
    },
  });
}
