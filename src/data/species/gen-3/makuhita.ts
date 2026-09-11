import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.FocusPunch,
  Moves.Toxic,
  Moves.BulkUp,
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Earthquake,
  Moves.Return,
  Moves.Dig,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.RockTomb,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Surf,
  Moves.Strength,
  Moves.RockSmash,
  Moves.MegaPunch,
  Moves.MegaKick,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.SeismicToss,
  Moves.Mimic,
  Moves.Metronome,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.DynamicPunch,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.IcePunch,
  Moves.Swagger,
  Moves.ThunderPunch,
  Moves.FirePunch,
  Moves.SleepTalk,
];

export default function registerMakuhitaSpecies(): void {
  registerSpecies(Species.Makuhita, {
    dexNumber: 296,
    evolvesInto: [
      {
        species: Species.Hariyama,
        method: EvolutionMethod.Level,
        level: 24,
      },
    ],
    name: 'Makuhita',
    category: 'Guts Pokemon',
    height: 1,
    weight: 86.4,
    family: Families.Makuhita,
    stats: {
      [Stats.HP]: 72,
      [Stats.Attack]: 60,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 20,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 25,
    },
    types: [Types.Fighting],
    abilities: [Abilities.ThickFat, Abilities.Guts],
    hiddenAbilities: [Abilities.SheerForce],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 180,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.FocusEnergy],
        4: [Moves.SandAttack],
        10: [Moves.ArmThrust],
        13: [Moves.VitalThrow],
        19: [Moves.FakeOut],
        22: [Moves.Whirlwind],
        28: [Moves.KnockOff],
        31: [Moves.SmellingSalts],
        37: [Moves.BellyDrum],
        40: [Moves.Endure],
        46: [Moves.SeismicToss],
        49: [Moves.Reversal],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.CrossChop,
        Moves.Detect,
        Moves.FeintAttack,
        Moves.Foresight,
        Moves.HelpingHand,
        Moves.Revenge,
      ],
    },
  });

  registerSpecies(Species.Hariyama, {
    dexNumber: 297,
    name: 'Hariyama',
    category: 'Arm Thrust Pokemon',
    height: 2.3,
    weight: 253.8,
    family: Families.Makuhita,
    evolvesFrom: Species.Makuhita,
    stats: {
      [Stats.HP]: 144,
      [Stats.Attack]: 120,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 50,
    },
    types: [Types.Fighting],
    abilities: [Abilities.ThickFat, Abilities.Guts],
    // One the mainline never gave it: a sumo digs in rather than
    // stepping back, so every blow leaves it harder to move
    hiddenAbilities: [Abilities.SheerForce, Abilities.Stamina],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 200,
    biomes: [Biome.Mountain, Biome.MontaneForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.FocusEnergy, Moves.SandAttack, Moves.ArmThrust],
        13: [Moves.VitalThrow],
        19: [Moves.FakeOut],
        22: [Moves.Whirlwind],
        29: [Moves.KnockOff],
        33: [Moves.SmellingSalts],
        40: [Moves.BellyDrum],
        44: [Moves.Endure],
        51: [Moves.SeismicToss],
        55: [Moves.Reversal],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
