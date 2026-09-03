import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the baby and the spinner
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.Strength,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Detect,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.MudSlap,
  Moves.Headbutt,
  Moves.RockSmash,
  Moves.Swift,
  Moves.BodySlam,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.DoubleEdge,
  Moves.Earthquake,
  Moves.Facade,
  Moves.MegaKick,
  Moves.Mimic,
  Moves.RockSlide,
  Moves.SecretPower,
  Moves.SeismicToss,
  Moves.Substitute,
];

// Which of the three it becomes, decided the way the games decide it
const AT_TWENTY = EvolutionMethod.Level | EvolutionMethod.StatComparison;

export default function registerTyrogueSpecies(): void {
  registerSpecies(Species.Tyrogue, {
    dexNumber: 236,
    evolvesInto: [
      {
        species: Species.Hitmonlee,
        method: AT_TWENTY,
        level: 20,
        compare: { stat: Stats.Attack, against: Stats.Defense, order: 'greater' },
      },
      {
        species: Species.Hitmonchan,
        method: AT_TWENTY,
        level: 20,
        compare: { stat: Stats.Attack, against: Stats.Defense, order: 'lesser' },
      },
      {
        species: Species.Hitmontop,
        method: AT_TWENTY,
        level: 20,
        compare: { stat: Stats.Attack, against: Stats.Defense, order: 'equal' },
      },
    ],
    name: 'Tyrogue',
    category: 'Scuffle Pokemon',
    height: 0.7,
    weight: 21,
    family: Families.Tyrogue,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 35,
      [Stats.Defense]: 35,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 35,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Guts, Abilities.Steadfast],
    hiddenAbilities: [Abilities.VitalSpirit],
    // A baby has nothing to breed with: it is what an egg holds
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 0],
    catchRate: 75,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Counter],
      egg: [
        Moves.HiJumpKick,
        Moves.MachPunch,
        Moves.MindReader,
        Moves.RapidSpin,
        Moves.HelpingHand,
      ],
    },
  });

  registerSpecies(Species.Hitmontop, {
    dexNumber: 237,
    name: 'Hitmontop',
    category: 'Handstand Pokemon',
    height: 1.4,
    weight: 48,
    family: Families.Tyrogue,
    evolvesFrom: Species.Tyrogue,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 95,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 70,
    },
    types: [Types.Fighting],
    abilities: [Abilities.Intimidate, Abilities.Technician],
    // Nothing invented here: Tyrogue's Guts and Vital Spirit walk up
    // to meet its own three
    hiddenAbilities: [Abilities.Steadfast],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 0],
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.RollingKick, Moves.Revenge],
        7: [Moves.FocusEnergy],
        13: [Moves.Pursuit],
        19: [Moves.QuickAttack],
        25: [Moves.RapidSpin],
        31: [Moves.Counter],
        37: [Moves.Agility],
        43: [Moves.Detect],
        49: [Moves.TripleKick, Moves.Endeavor],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Dig],
    },
  });
}
