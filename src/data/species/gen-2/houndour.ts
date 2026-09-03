import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Toxic,
  Moves.FireBlast,
  Moves.Flamethrower,
  Moves.SolarBeam,
  Moves.SunnyDay,
  Moves.ShadowBall,
  Moves.SludgeBomb,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Thief,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Detect,
  Moves.DreamEater,
  Moves.Nightmare,
  Moves.Endure,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.IronTail,
  Moves.HiddenPower,
  Moves.Headbutt,
  Moves.MudSlap,
  Moves.RockSmash,
  Moves.Roar,
  Moves.Swift,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Facade,
  Moves.Mimic,
  Moves.Overheat,
  Moves.SecretPower,
  Moves.Snatch,
  Moves.Substitute,
  Moves.Taunt,
  Moves.Torment,
];

const FAMILY_ABILITIES = [Abilities.EarlyBird, Abilities.FlashFire];

// What the pack learns at the same levels either side of evolving
const FAMILY_LEVEL = {
  1: [Moves.Ember, Moves.Leer],
  7: [Moves.Roar],
  13: [Moves.Smog],
  20: [Moves.Bite],
};

export default function registerHoundourSpecies(): void {
  registerSpecies(Species.Houndour, {
    dexNumber: 228,
    evolvesInto: [
      {
        species: Species.Houndoom,
        method: EvolutionMethod.Level,
        level: 24,
      },
    ],
    name: 'Houndour',
    category: 'Dark Pokemon',
    height: 0.6,
    weight: 10.8,
    family: Families.Houndour,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 60,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 65,
    },
    types: [Types.Dark, Types.Fire],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.Unnerve],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Badlands, Biome.Savanna, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        7: [...FAMILY_LEVEL[7], Moves.Howl],
        31: [Moves.OdorSleuth],
        27: [Moves.FeintAttack],
        35: [Moves.Flamethrower],
        43: [Moves.Crunch],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.BeatUp,
        Moves.Counter,
        Moves.FireSpin,
        Moves.Pursuit,
        Moves.Rage,
        Moves.Reversal,
        Moves.Spite,

        Moves.WillOWisp,
      ],
    },
  });

  registerSpecies(Species.Houndoom, {
    dexNumber: 229,
    name: 'Houndoom',
    category: 'Dark Pokemon',
    height: 1.4,
    weight: 35,
    family: Families.Houndour,
    evolvesFrom: Species.Houndour,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 90,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 95,
    },
    types: [Types.Dark, Types.Fire],
    abilities: [...FAMILY_ABILITIES],
    // Strong Jaw is this registry's rather than the mainline's,
    // filling a final evolution to four: Bite and Crunch are its own
    // level-up moves and the jaws are the whole animal
    hiddenAbilities: [Abilities.Unnerve, Abilities.StrongJaw],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Badlands, Biome.Savanna, Biome.Shrubland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        1: [...FAMILY_LEVEL[1], Moves.Howl],
        35: [Moves.OdorSleuth],
        30: [Moves.FeintAttack],
        41: [Moves.Flamethrower],
        52: [Moves.Crunch],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.Strength, Moves.HyperBeam, Moves.Counter],
    },
  });
}
