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
  Moves.Attract,
  Moves.Block,
  Moves.Bulldoze,
  Moves.DoubleTeam,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Explosion,
  Moves.Facade,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.Gravity,
  Moves.HiddenPower,
  Moves.IronDefense,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.Sandstorm,
  Moves.SleepTalk,
  Moves.SmackDown,
  Moves.Snore,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Toxic,
];

/**
 * The ore: a Roggenrola is a lump of it with ears, and a Gigalith has
 * a core hot enough to fire the country in front of it
 */
export default function registerRoggenrolaSpecies(): void {
  registerSpecies(Species.Roggenrola, {
    dexNumber: 524,
    evolvesInto: [
      {
        species: Species.Boldore,
        method: EvolutionMethod.Level,
        level: 25,
      },
    ],
    name: 'Roggenrola',
    category: 'Mantle Pokemon',
    height: 0.4,
    weight: 18,
    family: Families.Roggenrola,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 75,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 25,
      [Stats.SpecialDefense]: 25,
      [Stats.Speed]: 15,
    },
    types: [Types.Rock],
    abilities: [Abilities.Sturdy, Abilities.WeakArmor],
    hiddenAbilities: [Abilities.SandForce],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        4: [Moves.Harden],
        7: [Moves.SandAttack],
        10: [Moves.Headbutt],
        14: [Moves.RockBlast],
        17: [Moves.MudSlap],
        20: [Moves.IronDefense],
        23: [Moves.SmackDown],
        27: [Moves.RockSlide],
        30: [Moves.StealthRock],
        33: [Moves.Sandstorm],
        36: [Moves.StoneEdge],
        40: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Autotomize,
        Moves.Curse,
        Moves.HeavySlam,
        Moves.LockOn,
        Moves.Magnitude,
        Moves.TakeDown,
      ],
    },
  });
  registerSpecies(Species.Boldore, {
    dexNumber: 525,
    evolvesInto: [
      {
        species: Species.Gigalith,
        method: EvolutionMethod.Trade,
      },
    ],
    name: 'Boldore',
    category: 'Ore Pokemon',
    height: 0.9,
    weight: 102,
    family: Families.Roggenrola,
    evolvesFrom: Species.Roggenrola,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 105,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 50,
      [Stats.SpecialDefense]: 40,
      [Stats.Speed]: 20,
    },
    types: [Types.Rock],
    abilities: [Abilities.Sturdy, Abilities.WeakArmor],
    hiddenAbilities: [Abilities.SandForce],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Harden, Moves.Headbutt, Moves.SandAttack, Moves.Tackle],
        14: [Moves.RockBlast],
        17: [Moves.MudSlap],
        20: [Moves.IronDefense],
        23: [Moves.SmackDown],
        25: [Moves.PowerGem],
        30: [Moves.RockSlide],
        36: [Moves.StealthRock],
        42: [Moves.Sandstorm],
        48: [Moves.StoneEdge],
        55: [Moves.Explosion],
      },
      teachable: [...FAMILY_TEACHABLE],
    },
  });
  registerSpecies(Species.Gigalith, {
    dexNumber: 526,
    name: 'Gigalith',
    category: 'Compressed Pokemon',
    height: 1.7,
    weight: 260,
    family: Families.Roggenrola,
    evolvesFrom: Species.Boldore,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 135,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 25,
    },
    types: [Types.Rock],
    // Weak Armor is reached through Roggenrola rather than its own,
    // which is what the pools walk puts in the hidden band
    abilities: [Abilities.Sturdy, Abilities.SandStream],
    hiddenAbilities: [Abilities.SandForce],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Harden, Moves.Headbutt, Moves.SandAttack, Moves.Tackle],
        14: [Moves.RockBlast],
        17: [Moves.MudSlap],
        20: [Moves.IronDefense],
        23: [Moves.SmackDown],
        25: [Moves.PowerGem],
        30: [Moves.RockSlide],
        36: [Moves.StealthRock],
        42: [Moves.Sandstorm],
        48: [Moves.StoneEdge],
        55: [Moves.Explosion],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.IronHead,
        Moves.SolarBeam,
        Moves.Superpower,
      ],
    },
  });
}
