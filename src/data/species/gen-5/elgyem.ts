import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Agility,
  Moves.AllySwitch,
  Moves.Attract,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.CosmicPower,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.EchoedVoice,
  Moves.Embargo,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.GuardSwap,
  Moves.HiddenPower,
  Moves.Imprison,
  Moves.LightScreen,
  Moves.NastyPlot,
  Moves.PowerSwap,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.Psyshock,
  Moves.RainDance,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Round,
  Moves.Safeguard,
  Moves.Screech,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SteelWing,
  Moves.StoredPower,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.Uproar,
  Moves.WonderRoom,
  Moves.ZenHeadbutt,
  Moves.Confide,
];

// What both sizes work out how to do, at the same levels
const FAMILY_LEVEL = {
  15: [Moves.Psybeam],
  18: [Moves.Headbutt],
  22: [Moves.HiddenPower],
  24: [Moves.GuardSplit, Moves.PowerSplit],
  29: [Moves.SimpleBeam],
  32: [Moves.ZenHeadbutt],
  36: [Moves.PsychUp],
  39: [Moves.Psychic],
};

/**
 * The ones that came down: an Elgyem was found beside a crater, and a
 * Beheeyem talks with its fingers and rearranges what you remember of
 * the conversation afterwards
 */
export default function registerElgyemSpecies(): void {
  registerSpecies(Species.Elgyem, {
    dexNumber: 605,
    evolvesInto: [
      {
        species: Species.Beheeyem,
        method: EvolutionMethod.Level,
        level: 42,
      },
    ],
    name: 'Elgyem',
    category: 'Cerebral Pokemon',
    height: 0.5,
    weight: 9,
    family: Families.Elgyem,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 55,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 30,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Telepathy, Abilities.Synchronize],
    hiddenAbilities: [Abilities.Analytic],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Desert, Biome.ColdDesert],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Confusion],
        6: [Moves.Imprison],
        8: [Moves.HealBlock],
        11: [Moves.MiracleEye],
        12: [Moves.Teleport],
        ...FAMILY_LEVEL,
        43: [Moves.Recover, Moves.CalmMind],
        53: [Moves.Synchronoise],
        54: [Moves.WonderRoom],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AllySwitch,
        Moves.Astonish,
        Moves.Barrier,
        Moves.CosmicPower,
        Moves.DestinyBond,
        Moves.Disable,
        Moves.GuardSwap,
        Moves.NastyPlot,
        Moves.PowerSwap,
        Moves.PsychUp,
        Moves.SkillSwap,
        Moves.Teleport,
      ],
    },
  });
  registerSpecies(Species.Beheeyem, {
    dexNumber: 606,
    name: 'Beheeyem',
    category: 'Cerebral Pokemon',
    height: 1,
    weight: 34.5,
    family: Families.Elgyem,
    evolvesFrom: Species.Elgyem,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 75,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 40,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Telepathy, Abilities.Synchronize],
    // Forewarn is the invented fourth: the line reaches three, and
    // reading the strongest thing in front of it is what the fingers
    // are for
    hiddenAbilities: [Abilities.Analytic, Abilities.Forewarn],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Desert, Biome.ColdDesert],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Growl,
          Moves.Confusion,
          Moves.Teleport,
          Moves.Imprison,
          Moves.MiracleEye,
          Moves.HealBlock,
          Moves.WonderRoom,
          Moves.Synchronoise,
          Moves.PsychicTerrain,
        ],
        ...FAMILY_LEVEL,
        45: [Moves.Recover, Moves.CalmMind],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.FlashCannon,
        Moves.FutureSight,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.TriAttack,
      ],
    },
  });
}
