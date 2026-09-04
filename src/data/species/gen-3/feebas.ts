import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Surf,
  Moves.Waterfall,
  Moves.Dive,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerFeebasSpecies(): void {
  registerSpecies(Species.Feebas, {
    dexNumber: 349,
    /**
     * The mainline turns a Feebas on how beautiful it has been made,
     * which is a contest stat this game does not keep. Two roads
     * stand in for it, and either one is enough: a Prism Scale handed
     * over, or a Feebas raised fond enough to be worth looking at by
     * the time it reaches 40
     */
    evolvesInto: [
      {
        species: Species.Milotic,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.PrismScale,
      },
      {
        species: Species.Milotic,
        method: EvolutionMethod.Level | EvolutionMethod.Friendship,
        level: 40,
      },
    ],
    name: 'Feebas',
    category: 'Fish Pokemon',
    height: 0.6,
    weight: 7.4,
    family: Families.Feebas,
    stats: {
      [Stats.HP]: 20,
      [Stats.Attack]: 15,
      [Stats.Defense]: 20,
      [Stats.SpecialAttack]: 10,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 80,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim, Abilities.Oblivious],
    hiddenAbilities: [Abilities.Adaptability],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Bog, Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Splash],
        15: [Moves.Tackle],
        30: [Moves.Flail],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.ConfuseRay,
        Moves.DragonBreath,
        Moves.Hypnosis,
        Moves.LightScreen,
        Moves.MirrorCoat,
        Moves.MudSport,
      ],
    },
  });

  registerSpecies(Species.Milotic, {
    dexNumber: 350,
    name: 'Milotic',
    category: 'Tender Pokemon',
    height: 6.2,
    weight: 162,
    family: Families.Feebas,
    evolvesFrom: Species.Feebas,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 60,
      [Stats.Defense]: 79,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 125,
      [Stats.Speed]: 81,
    },
    types: [Types.Water],
    abilities: [Abilities.MarvelScale, Abilities.Competitive],
    hiddenAbilities: [Abilities.CuteCharm],
    eggGroups: [EggGroups.Water1, EggGroups.Dragon],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.KelpForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterGun],
        5: [Moves.Wrap],
        10: [Moves.WaterSport],
        15: [Moves.Refresh],
        20: [Moves.WaterPulse],
        25: [Moves.Twister],
        30: [Moves.Recover],
        35: [Moves.RainDance],
        40: [Moves.HydroPump],
        45: [Moves.Attract],
        50: [Moves.Safeguard],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.HyperBeam,
        Moves.Safeguard,
        Moves.IronTail,
        Moves.BodySlam,
        Moves.PsychUp,
        Moves.MudSlap,
      ],
    },
  });
}
