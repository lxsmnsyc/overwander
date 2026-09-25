import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by both sizes
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.AerialAce,
  Moves.Agility,
  Moves.AllySwitch,
  Moves.Attract,
  Moves.AuraSphere,
  Moves.BatonPass,
  Moves.Bounce,
  Moves.BrickBreak,
  Moves.BulkUp,
  Moves.CalmMind,
  Moves.CloseCombat,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DrainPunch,
  Moves.Endure,
  Moves.Facade,
  Moves.Fling,
  Moves.FocusBlast,
  Moves.FocusEnergy,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.KnockOff,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.MegaKick,
  Moves.MegaPunch,
  Moves.Payback,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Revenge,
  Moves.Reversal,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.SwordsDance,
  Moves.TakeDown,
  Moves.Taunt,
  Moves.Toxic,
  Moves.UTurn,
  Moves.WorkUp,
  Moves.Confide,
  Moves.PowerUpPunch,
];

// The forms both of them drill, at the same counts
const FAMILY_LEVEL = {
  15: [Moves.FurySwipes],
  17: [Moves.DoubleSlap],
  21: [Moves.Swift],
  25: [Moves.CalmMind, Moves.ForcePalm],
  30: [Moves.UTurn],
  33: [Moves.DrainPunch],
  37: [Moves.JumpKick],
  40: [Moves.HoneClaws],
  49: [Moves.Bounce],
};

/**
 * The martial artists: the fur on a Mienshao's forelegs is the weapon,
 * and it is thrown in combinations too fast to follow rather than one
 * blow at a time
 */
export default function registerMienfooSpecies(): void {
  registerSpecies(Species.Mienfoo, {
    dexNumber: 619,
    evolvesInto: [
      {
        species: Species.Mienshao,
        method: EvolutionMethod.Level,
        level: 50,
      },
    ],
    name: 'Mienfoo',
    category: 'Martial Arts Pokemon',
    height: 0.9,
    weight: 20,
    family: Families.Mienfoo,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 85,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 65,
    },
    types: [Types.Fighting],
    abilities: [Abilities.InnerFocus, Abilities.Regenerator],
    hiddenAbilities: [Abilities.Reckless],
    eggGroups: [EggGroups.Field, EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 180,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.Detect],
        5: [Moves.Meditate, Moves.FakeOut],
        10: [Moves.Reversal],
        ...FAMILY_LEVEL,
        20: [Moves.QuickGuard],
        45: [Moves.AuraSphere],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AllySwitch,
        Moves.BatonPass,
        Moves.Endure,
        Moves.Feint,
        Moves.FocusPunch,
        Moves.KnockOff,
        Moves.LowKick,
        Moves.MeFirst,
        Moves.SmellingSalts,
        Moves.VitalThrow,
      ],
    },
  });
  registerSpecies(Species.Mienshao, {
    dexNumber: 620,
    name: 'Mienshao',
    category: 'Martial Arts Pokemon',
    height: 1.4,
    weight: 35.5,
    family: Families.Mienfoo,
    evolvesFrom: Species.Mienfoo,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 125,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 105,
    },
    types: [Types.Fighting],
    abilities: [Abilities.InnerFocus, Abilities.Regenerator],
    // Iron Fist is the invented fourth: the line reaches three, and a
    // combination fighter should get something for the blows it throws
    hiddenAbilities: [Abilities.Reckless, Abilities.IronFist],
    eggGroups: [EggGroups.Field, EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.Pound,
          Moves.Meditate,
          Moves.Reversal,
          Moves.Detect,
          Moves.FakeOut,
          Moves.AuraSphere,
          Moves.QuickGuard,
        ],
        ...FAMILY_LEVEL,
        20: [Moves.WideGuard],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Assurance,
        Moves.BlazeKick,
        Moves.DoubleEdge,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.VacuumWave,
        Moves.LaserFocus,
      ],
    },
  });
}
