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
  Moves.Attract,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.DoubleTeam,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Endeavor,
  Moves.Facade,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.Payback,
  Moves.Protect,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Round,
  Moves.Sandstorm,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StealthRock,
  Moves.StompingTantrum,
  Moves.Substitute,
  Moves.Superpower,
  Moves.Swagger,
  Moves.Toxic,
];

export default function registerMudbraySpecies(): void {
  registerSpecies(Species.Mudbray, {
    dexNumber: 749,
    evolvesInto: [{ species: Species.Mudsdale, method: EvolutionMethod.Level, level: 30 }],
    name: 'Mudbray',
    category: 'Donkey Pokemon',
    height: 1.0,
    weight: 110,
    family: Families.Mudbray,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 100,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 45,
    },
    types: [Types.Ground],
    abilities: [Abilities.OwnTempo, Abilities.Stamina],
    hiddenAbilities: [Abilities.InnerFocus],
    eggGroups: [EggGroups.Field],
    genderRatio: [4, 4],
    catchRate: 190,
    biomes: [Biome.Savanna, Biome.Steppe, Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.MudSlap],
        3: [Moves.MudSport],
        8: [Moves.Rototiller],
        10: [Moves.Bulldoze],
        15: [Moves.DoubleKick],
        17: [Moves.Stomp],
        22: [Moves.Bide],
        24: [Moves.HighHorsepower],
        29: [Moves.IronDefense],
        31: [Moves.HeavySlam],
        36: [Moves.Counter],
        38: [Moves.Earthquake],
        43: [Moves.MegaKick],
        45: [Moves.Superpower],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.BodySlam, Moves.CloseCombat, Moves.DoubleEdge, Moves.Magnitude, Moves.MudBomb],
    },
  });
  registerSpecies(Species.Mudsdale, {
    dexNumber: 750,
    name: 'Mudsdale',
    category: 'Draft Horse Pokemon',
    height: 2.5,
    weight: 920,
    family: Families.Mudbray,
    evolvesFrom: Species.Mudbray,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 125,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 35,
    },
    types: [Types.Ground],
    abilities: [Abilities.OwnTempo, Abilities.Stamina],
    hiddenAbilities: [Abilities.InnerFocus, Abilities.Steadfast],
    eggGroups: [EggGroups.Field],
    genderRatio: [4, 4],
    catchRate: 60,
    biomes: [Biome.Savanna, Biome.Steppe, Biome.Grassland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Bulldoze, Moves.MudSlap, Moves.MudSport, Moves.Rototiller],
        15: [Moves.DoubleKick],
        17: [Moves.Stomp],
        22: [Moves.Bide],
        24: [Moves.HighHorsepower],
        29: [Moves.IronDefense],
        34: [Moves.HeavySlam],
        42: [Moves.Counter],
        47: [Moves.Earthquake],
        55: [Moves.MegaKick],
        60: [Moves.Superpower],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.FocusBlast, Moves.GigaImpact],
    },
  });
}
