import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AllySwitch,
  Moves.Attract,
  Moves.CalmMind,
  Moves.ConfuseRay,
  Moves.Curse,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Embargo,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FireBlast,
  Moves.FireSpin,
  Moves.FlameCharge,
  Moves.Flamethrower,
  Moves.FlareBlitz,
  Moves.Flash,
  Moves.Frustration,
  Moves.Haze,
  Moves.HeatWave,
  Moves.Hex,
  Moves.HiddenPower,
  Moves.Imprison,
  Moves.Incinerate,
  Moves.NightShade,
  Moves.Overheat,
  Moves.PainSplit,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.Rest,
  Moves.Return,
  Moves.Round,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Spite,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.WillOWisp,
  Moves.Confide,
];

// What the flame works out how to do, at whichever size
const FAMILY_LEVEL = {
  7: [Moves.FireSpin],
  10: [Moves.ConfuseRay],
  13: [Moves.NightShade],
  16: [Moves.WillOWisp, Moves.Hex],
  20: [Moves.FlameBurst],
  24: [Moves.Imprison],
  32: [Moves.Curse],
  33: [Moves.Memento],
  36: [Moves.ShadowBall],
  38: [Moves.Inferno],
};

/**
 * The lamps: a Litwick walks ahead of you helpfully, and the flame on
 * its head is burning what it has already taken off whoever went first
 */
export default function registerLitwickSpecies(): void {
  registerSpecies(Species.Litwick, {
    dexNumber: 607,
    evolvesInto: [
      {
        species: Species.Lampent,
        method: EvolutionMethod.Level,
        level: 41,
      },
    ],
    name: 'Litwick',
    category: 'Candle Pokemon',
    height: 0.3,
    weight: 3.1,
    family: Families.Litwick,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 30,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 20,
    },
    types: [Types.Ghost, Types.Fire],
    abilities: [Abilities.FlashFire, Abilities.FlameBody],
    hiddenAbilities: [Abilities.Infiltrator],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Bog, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.Smog, Moves.Astonish],
        3: [Moves.Minimize],
        ...FAMILY_LEVEL,
        48: [Moves.PainSplit],
        52: [Moves.Overheat],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Acid,
        Moves.AcidArmor,
        Moves.Captivate,
        Moves.ClearSmog,
        Moves.Endure,
        Moves.Haze,
        Moves.HeatWave,
        Moves.PowerSplit,
      ],
    },
  });
  registerSpecies(Species.Lampent, {
    dexNumber: 608,
    evolvesInto: [
      {
        species: Species.Chandelure,
        method: EvolutionMethod.UsedItem,
        item: Items.DuskStone,
      },
    ],
    name: 'Lampent',
    category: 'Lamp Pokemon',
    height: 0.6,
    weight: 13,
    family: Families.Litwick,
    evolvesFrom: Species.Litwick,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 40,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 55,
    },
    types: [Types.Ghost, Types.Fire],
    abilities: [Abilities.FlashFire, Abilities.FlameBody],
    hiddenAbilities: [Abilities.Infiltrator],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Bog, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.Minimize, Moves.Smog, Moves.Astonish],
        ...FAMILY_LEVEL,
        52: [Moves.PainSplit],
        58: [Moves.Overheat],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Chandelure, {
    dexNumber: 609,
    name: 'Chandelure',
    category: 'Luring Pokemon',
    height: 1,
    weight: 34.3,
    family: Families.Litwick,
    evolvesFrom: Species.Lampent,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 55,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 145,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 80,
    },
    types: [Types.Ghost, Types.Fire],
    abilities: [Abilities.FlashFire, Abilities.FlameBody],
    // Illuminate is the invented fourth: the line reaches three, and a
    // chandelier is the one thing on the field that lights the room
    hiddenAbilities: [Abilities.Infiltrator, Abilities.Illuminate],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Bog, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Ember,
          Moves.FireSpin,
          Moves.NightShade,
          Moves.Minimize,
          Moves.ConfuseRay,
          Moves.Smog,
          Moves.Curse,
          Moves.PainSplit,
          Moves.ShadowBall,
          Moves.WillOWisp,
          Moves.Memento,
          Moves.Imprison,
          Moves.Astonish,
          Moves.Overheat,
          Moves.FlameBurst,
          Moves.Hex,
          Moves.Inferno,
        ],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.GigaImpact, Moves.HyperBeam, Moves.LaserFocus],
    },
  });
}
