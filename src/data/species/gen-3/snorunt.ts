import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.LightScreen,
  Moves.Protect,
  Moves.RainDance,
  Moves.Safeguard,
  Moves.Frustration,
  Moves.Return,
  Moves.ShadowBall,
  Moves.DoubleTeam,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Flash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
];

export default function registerSnoruntSpecies(): void {
  registerSpecies(Species.Snorunt, {
    dexNumber: 361,
    evolvesInto: [
      {
        species: Species.Glalie,
        method: EvolutionMethod.Level,
        level: 42,
      },
    ],
    name: 'Snorunt',
    category: 'Snow Hat Pokemon',
    height: 0.7,
    weight: 16.8,
    family: Families.Snorunt,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 50,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 50,
    },
    types: [Types.Ice],
    abilities: [Abilities.InnerFocus, Abilities.IceBody],
    hiddenAbilities: [Abilities.Moody],
    eggGroups: [EggGroups.Fairy, EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.PowderSnow],
        7: [Moves.DoubleTeam],
        10: [Moves.Bite],
        16: [Moves.IcyWind],
        19: [Moves.Headbutt],
        25: [Moves.Protect],
        28: [Moves.Crunch],
        34: [Moves.IceBeam],
        37: [Moves.Hail],
        43: [Moves.Blizzard],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.Block, Moves.Spikes],
    },
  });

  registerSpecies(Species.Glalie, {
    dexNumber: 362,
    name: 'Glalie',
    category: 'Face Pokemon',
    height: 1.5,
    weight: 256.5,
    family: Families.Snorunt,
    evolvesFrom: Species.Snorunt,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 80,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 80,
    },
    types: [Types.Ice],
    abilities: [Abilities.InnerFocus, Abilities.IceBody],
    // One the mainline never gave it: it arrives with the sky its
    // other two abilities are waiting for
    hiddenAbilities: [Abilities.Moody, Abilities.SnowWarning],
    eggGroups: [EggGroups.Fairy, EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 75,
    biomes: [Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.PowderSnow, Moves.DoubleTeam, Moves.Bite],
        16: [Moves.IcyWind],
        19: [Moves.Headbutt],
        25: [Moves.Protect],
        28: [Moves.Crunch],
        34: [Moves.IceBeam],
        42: [Moves.Hail],
        53: [Moves.Blizzard],
        61: [Moves.SheerCold],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.Taunt,
        Moves.HyperBeam,
        Moves.Earthquake,
        Moves.Torment,
        Moves.Explosion,
        Moves.Rollout,
        Moves.DefenseCurl,
      ],
    },
  });
}
