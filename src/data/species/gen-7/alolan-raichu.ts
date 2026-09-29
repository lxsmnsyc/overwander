import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AllySwitch,
  Moves.Attract,
  Moves.BrickBreak,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.Confide,
  Moves.Covet,
  Moves.DoubleTeam,
  Moves.EchoedVoice,
  Moves.Electroweb,
  Moves.Facade,
  Moves.Fling,
  Moves.FocusBlast,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.IronTail,
  Moves.KnockOff,
  Moves.LaserFocus,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.MagicRoom,
  Moves.MagnetRise,
  Moves.Protect,
  Moves.Psychic,
  Moves.Psyshock,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.Safeguard,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.Thunder,
  Moves.ThunderPunch,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.VoltSwitch,
  Moves.WildCharge,
];

export default function registerAlolanRaichuSpecies(): void {
  registerSpecies(Species.RaichuAlola, {
    dexNumber: 26,
    name: 'Alolan Raichu',
    category: 'Mouse Pokemon',
    height: 0.7,
    weight: 21,
    family: Families.Pikachu,
    baseForm: false,
    evolvesFrom: Species.Pikachu,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 85,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 110,
    },
    types: [Types.Electric, Types.Psychic],
    abilities: [Abilities.SurgeSurfer],
    hiddenAbilities: [Abilities.VoltAbsorb, Abilities.QuickFeet],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [4, 4],
    catchRate: 75,
    biomes: [Biome.Beach, Biome.TropicalSeasonalForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Psychic,
          Moves.QuickAttack,
          Moves.SpeedSwap,
          Moves.TailWhip,
          Moves.ThunderShock,
          Moves.Thunderbolt,
        ],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
}
