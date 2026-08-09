import { Stats } from '../constants/stats';
import { Types } from '../constants/types';
import Abilities from '../ids/abilities';
import EggGroups from '../ids/egg-groups';
import Families from '../ids/families';
import { Moves } from '../ids/moves';
import { EvolutionMethod, Species } from '../ids/species';
import { registerSpecies } from './__create';

export default function registerCaterpieSpecies(): void {
  registerSpecies(Species.Caterpie, {
    dexNumber: 10,
    evolvesInto: [
      {
        species: Species.Metapod,
        method: EvolutionMethod.Level,
        level: 7,
      },
    ],
    name: 'Caterpie',
    category: 'Worm Pokemon',
    family: Families.Caterpie,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 30,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 20,
      [Stats.Speed]: 45,
    },
    types: [Types.Bug],
    abilities: [Abilities.RunAway, Abilities.ShieldDust],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 255,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.StringShot],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Metapod, {
    dexNumber: 11,
    evolvesInto: [
      {
        species: Species.Butterfree,
        method: EvolutionMethod.Level,
        level: 10,
      },
    ],
    name: 'Metapod',
    category: 'Cocoon Pokemon',
    family: Families.Caterpie,
    evolvesFrom: Species.Caterpie,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 20,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 30,
    },
    types: [Types.Bug],
    abilities: [Abilities.ShedSkin],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 120,
    learnSet: {
      level: {
        1: [Moves.Harden],
        7: [Moves.Harden],
      },
      teachable: [],
    },
  });

  registerSpecies(Species.Butterfree, {
    dexNumber: 12,
    name: 'Butterfree',
    category: 'Butterfly Pokemon',
    family: Families.Caterpie,
    evolvesFrom: Species.Metapod,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 45,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 70,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.TintedLens, Abilities.CompoundEyes],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    learnSet: {
      level: {
        1: [Moves.Confusion],
        12: [Moves.Confusion],
        15: [Moves.PoisonPowder],
        16: [Moves.StunSpore],
        17: [Moves.SleepPowder],
        21: [Moves.Supersonic],
        26: [Moves.Whirlwind],
        32: [Moves.Psybeam],
      },
      teachable: [
        Moves.Toxic,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.MegaDrain,
        Moves.SolarBeam,
        Moves.Psychic,
        Moves.Teleport,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Swift,
        Moves.Rest,
        Moves.Psywave,
        Moves.Substitute,
        Moves.Flash,
      ],
    },
  });
}
