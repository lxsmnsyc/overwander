import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
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
  Moves.SunnyDay,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Endure,
  Moves.Rollout,
  Moves.Swagger,
  Moves.Attract,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.MudSlap,
  Moves.DefenseCurl,
  Moves.RockSmash,
  Moves.DoubleEdge,
  Moves.Facade,
  Moves.LightScreen,
  Moves.Mimic,
  Moves.Overheat,
  Moves.Reflect,
  Moves.SecretPower,
  Moves.Substitute,
];

const FAMILY_ABILITIES = [Abilities.MagmaArmor, Abilities.FlameBody];

export default function registerSlugmaSpecies(): void {
  registerSpecies(Species.Slugma, {
    dexNumber: 218,
    evolvesInto: [
      {
        species: Species.Magcargo,
        method: EvolutionMethod.Level,
        level: 38,
      },
    ],
    name: 'Slugma',
    category: 'Lava Pokemon',
    height: 0.7,
    weight: 35,
    family: Families.Slugma,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 40,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 20,
    },
    types: [Types.Fire],
    abilities: [...FAMILY_ABILITIES],
    hiddenAbilities: [Abilities.WeakArmor],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Volcano, Biome.Badlands, Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Smog, Moves.Yawn],
        8: [Moves.Ember],
        15: [Moves.RockThrow],
        22: [Moves.Harden],
        29: [Moves.Amnesia],
        36: [Moves.Flamethrower],
        43: [Moves.RockSlide],
        50: [Moves.BodySlam],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.AcidArmor, Moves.HeatWave],
    },
  });

  registerSpecies(Species.Magcargo, {
    dexNumber: 219,
    name: 'Magcargo',
    category: 'Lava Pokemon',
    height: 0.8,
    weight: 55,
    family: Families.Slugma,
    evolvesFrom: Species.Slugma,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 50,
      [Stats.Defense]: 120,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 30,
    },
    types: [Types.Fire, Types.Rock],
    abilities: [...FAMILY_ABILITIES],
    // Solid Rock is this registry's rather than the mainline's,
    // filling a final evolution to four: the crust it cools into is
    // what the water and the ground have to get through
    hiddenAbilities: [Abilities.WeakArmor, Abilities.SolidRock],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Volcano, Biome.Badlands, Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Smog, Moves.Ember, Moves.RockThrow, Moves.Yawn],
        22: [Moves.Harden],
        29: [Moves.Amnesia],
        36: [Moves.Flamethrower],
        48: [Moves.RockSlide],
        60: [Moves.BodySlam],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Earthquake,
        Moves.Strength,
        Moves.HyperBeam,
        Moves.RockTomb,
      ],
    },
  });
}
