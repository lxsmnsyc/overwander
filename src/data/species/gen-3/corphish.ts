import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves both stages share
const FAMILY_TEACHABLE = [
  Moves.WaterPulse,
  Moves.Toxic,
  Moves.Hail,
  Moves.HiddenPower,
  Moves.Taunt,
  Moves.IceBeam,
  Moves.Blizzard,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.Dig,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.SludgeBomb,
  Moves.RockTomb,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Cut,
  Moves.Surf,
  Moves.Strength,
  Moves.RockSmash,
  Moves.Waterfall,
  Moves.SwordsDance,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.IcyWind,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.FuryCutter,
  Moves.SleepTalk,
];

export default function registerCorphishSpecies(): void {
  registerSpecies(Species.Corphish, {
    dexNumber: 341,
    evolvesInto: [
      {
        species: Species.Crawdaunt,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Corphish',
    category: 'Ruffian Pokemon',
    height: 0.6,
    weight: 11.5,
    family: Families.Corphish,
    stats: {
      [Stats.HP]: 43,
      [Stats.Attack]: 80,
      [Stats.Defense]: 65,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 35,
    },
    types: [Types.Water],
    abilities: [Abilities.HyperCutter, Abilities.ShellArmor],
    hiddenAbilities: [Abilities.Adaptability],
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 205,
    biomes: [Biome.Mangrove, Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble],
        7: [Moves.Harden],
        10: [Moves.ViceGrip],
        13: [Moves.Leer],
        20: [Moves.BubbleBeam],
        23: [Moves.Protect],
        26: [Moves.KnockOff],
        32: [Moves.Taunt],
        35: [Moves.Crabhammer],
        38: [Moves.SwordsDance],
        44: [Moves.Guillotine],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.AncientPower, Moves.Endeavor, Moves.MudSport],
    },
  });

  registerSpecies(Species.Crawdaunt, {
    dexNumber: 342,
    name: 'Crawdaunt',
    category: 'Rogue Pokemon',
    height: 1.1,
    weight: 32.8,
    family: Families.Corphish,
    evolvesFrom: Species.Corphish,
    stats: {
      [Stats.HP]: 63,
      [Stats.Attack]: 120,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 55,
    },
    types: [Types.Water, Types.Dark],
    abilities: [Abilities.HyperCutter, Abilities.ShellArmor],
    // One the mainline never gave it: those pincers are most of what
    // it is, and Crabhammer is most of what it does with them
    hiddenAbilities: [Abilities.Adaptability, Abilities.ToughClaws],
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 155,
    biomes: [Biome.Mangrove, Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.Harden, Moves.ViceGrip, Moves.Leer],
        20: [Moves.BubbleBeam],
        23: [Moves.Protect],
        26: [Moves.KnockOff],
        34: [Moves.Taunt],
        39: [Moves.Crabhammer],
        44: [Moves.SwordsDance],
        52: [Moves.Guillotine],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam, Moves.Dive, Moves.Swift],
    },
  });
}
