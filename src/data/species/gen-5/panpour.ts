import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.AquaTail,
  Moves.Attract,
  Moves.Blizzard,
  Moves.Covet,
  Moves.Cut,
  Moves.Dig,
  Moves.Dive,
  Moves.DoubleTeam,
  Moves.Endeavor,
  Moves.Facade,
  Moves.Fling,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GastroAcid,
  Moves.GrassKnot,
  Moves.GunkShot,
  Moves.Hail,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.IceBeam,
  Moves.IcePunch,
  Moves.IcyWind,
  Moves.IronTail,
  Moves.KnockOff,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.Payback,
  Moves.Protect,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Rest,
  Moves.Return,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.RolePlay,
  Moves.Round,
  Moves.Scald,
  Moves.SecretPower,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
  Moves.Uproar,
  Moves.WaterPulse,
  Moves.Waterfall,
  Moves.WorkUp,
  Moves.Confide,
];

/**
 * The water monkey: it keeps its water in the tuft on its tail, and a
 * Simipour puts it out under enough pressure to cut
 */
export default function registerPanpourSpecies(): void {
  registerSpecies(Species.Panpour, {
    dexNumber: 515,
    evolvesInto: [
      {
        species: Species.Simipour,
        method: EvolutionMethod.UsedItem,
        item: Items.WaterStone,
      },
    ],
    name: 'Panpour',
    category: 'Spray Pokemon',
    height: 0.6,
    weight: 13.5,
    family: Families.Panpour,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 53,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 53,
      [Stats.SpecialDefense]: 48,
      [Stats.Speed]: 64,
    },
    types: [Types.Water],
    abilities: [Abilities.Gluttony],
    hiddenAbilities: [Abilities.Torrent],
    eggGroups: [EggGroups.Field],
    habitat: Habitat.Amphibious,
    // Seven males to every female, the way the whole trio is handed out
    genderRatio: [7, 1],
    catchRate: 190,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.PlayNice],
        4: [Moves.Leer],
        7: [Moves.Lick],
        10: [Moves.WaterGun],
        13: [Moves.FurySwipes],
        16: [Moves.WaterSport],
        19: [Moves.Bite],
        22: [Moves.Scald],
        25: [Moves.Taunt],
        28: [Moves.Fling],
        31: [Moves.Acrobatics],
        34: [Moves.Brine],
        37: [Moves.Recycle],
        40: [Moves.NaturalGift],
        43: [Moves.Crunch],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.AquaRing,
        Moves.AquaTail,
        Moves.Astonish,
        Moves.Covet,
        Moves.HydroPump,
        Moves.LowKick,
        Moves.MudSport,
        Moves.NastyPlot,
        Moves.RolePlay,
        Moves.Tickle,
        Moves.DisarmingVoice,
      ],
    },
  });
  registerSpecies(Species.Simipour, {
    dexNumber: 516,
    name: 'Simipour',
    category: 'Geyser Pokemon',
    height: 1,
    weight: 29,
    family: Families.Panpour,
    evolvesFrom: Species.Panpour,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 98,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 98,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 101,
    },
    types: [Types.Water],
    abilities: [Abilities.Gluttony],
    // The line reaches only two, so both of the last slots are
    // invented: Water Absorb is the monkey drinking its own element,
    // and Analytic is a geyser waiting for the moment to go off
    hiddenAbilities: [Abilities.Torrent, Abilities.WaterAbsorb, Abilities.Analytic],
    eggGroups: [EggGroups.Field],
    habitat: Habitat.Amphibious,
    genderRatio: [7, 1],
    catchRate: 75,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      // A stone evolution learns nothing further on its own, beyond
      // the pressure it comes into
      level: {
        1: [Moves.Leer, Moves.Lick, Moves.FurySwipes, Moves.Scald],
        10: [Moves.WaterPulse],
        28: [Moves.Brine],
        46: [Moves.HydroPump],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BrickBreak,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.RockSlide,
        Moves.Superpower,
        Moves.PowerUpPunch,
      ],
    },
  });
}
