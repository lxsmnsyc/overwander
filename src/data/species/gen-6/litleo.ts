import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by cub and king
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.Attract,
  Moves.BodySlam,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.Crunch,
  Moves.DarkPulse,
  Moves.Dig,
  Moves.DoubleEdge,
  Moves.DoubleTeam,
  Moves.EchoedVoice,
  Moves.Endeavor,
  Moves.Endure,
  Moves.Facade,
  Moves.FireBlast,
  Moves.FireFang,
  Moves.FireSpin,
  Moves.FlameCharge,
  Moves.Flamethrower,
  Moves.FlareBlitz,
  Moves.Frustration,
  Moves.HeatWave,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HyperVoice,
  Moves.Incinerate,
  Moves.IronTail,
  Moves.MudSlap,
  Moves.Overheat,
  Moves.Payback,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Retaliate,
  Moves.Return,
  Moves.Roar,
  Moves.RockSmash,
  Moves.Round,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.Snarl,
  Moves.Snatch,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Swift,
  Moves.TakeDown,
  Moves.Taunt,
  Moves.Thief,
  Moves.ThunderFang,
  Moves.Toxic,
  Moves.WildCharge,
  Moves.WillOWisp,
  Moves.WorkUp,
];

// What the pride knows at either age
const FAMILY_LEVEL = {
  11: [Moves.Headbutt],
  15: [Moves.NobleRoar],
  20: [Moves.TakeDown],
  23: [Moves.FireFang],
  28: [Moves.Endeavor],
  33: [Moves.EchoedVoice],
};

/**
 * The lion cub and the king it grows into. Nothing is staged yet:
 * nobody has drawn a male Pyroar, so the line waits for its art
 */
export default function registerLitleoSpecies(): void {
  registerSpecies(Species.Litleo, {
    dexNumber: 667,
    evolvesInto: [
      {
        species: Species.Pyroar,
        method: EvolutionMethod.Level,
        level: 35,
      },
    ],
    name: 'Litleo',
    category: 'Lion Cub Pokemon',
    height: 0.6,
    weight: 13.5,
    family: Families.Litleo,
    stats: {
      [Stats.HP]: 62,
      [Stats.Attack]: 50,
      [Stats.Defense]: 58,
      [Stats.SpecialAttack]: 73,
      [Stats.SpecialDefense]: 54,
      [Stats.Speed]: 72,
    },
    types: [Types.Fire, Types.Normal],
    abilities: [Abilities.Rivalry, Abilities.Unnerve],
    hiddenAbilities: [Abilities.Moxie],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 7],
    catchRate: 220,
    biomes: [],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Tackle],
        5: [Moves.Ember],
        8: [Moves.WorkUp],
        ...FAMILY_LEVEL,
        36: [Moves.Flamethrower],
        39: [Moves.Crunch],
        43: [Moves.HyperVoice],
        46: [Moves.Incinerate],
        50: [Moves.Overheat],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Entrainment, Moves.FireSpin, Moves.FlareBlitz, Moves.Snatch, Moves.Yawn],
    },
  });
  registerSpecies(Species.Pyroar, {
    dexNumber: 668,
    name: 'Pyroar',
    category: 'Royal Pokemon',
    height: 1.5,
    weight: 81.5,
    family: Families.Litleo,
    evolvesFrom: Species.Litleo,
    stats: {
      [Stats.HP]: 86,
      [Stats.Attack]: 68,
      [Stats.Defense]: 72,
      [Stats.SpecialAttack]: 109,
      [Stats.SpecialDefense]: 66,
      [Stats.Speed]: 106,
    },
    types: [Types.Fire, Types.Normal],
    abilities: [Abilities.Rivalry, Abilities.Unnerve],
    // Intimidate is this line's invented filler: the mainline gives it
    // three abilities, and Fire Mane belongs to the Mega
    hiddenAbilities: [Abilities.Moxie, Abilities.Intimidate],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 7],
    catchRate: 65,
    biomes: [],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.HyperBeam, Moves.Leer, Moves.Tackle, Moves.WorkUp],
        ...FAMILY_LEVEL,
        38: [Moves.Flamethrower],
        42: [Moves.Crunch],
        48: [Moves.HyperVoice],
        51: [Moves.Incinerate],
        57: [Moves.Overheat],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Bounce, Moves.GigaImpact, Moves.HyperBeam],
    },
  });
}
