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
  Moves.HiddenPower,
  Moves.SunnyDay,
  Moves.Protect,
  Moves.RainDance,
  Moves.Frustration,
  Moves.Return,
  Moves.DoubleTeam,
  Moves.AerialAce,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Attract,
  Moves.Thief,
  Moves.SteelWing,
  Moves.Fly,
  Moves.DoubleEdge,
  Moves.Counter,
  Moves.Mimic,
  Moves.Substitute,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerTaillowSpecies(): void {
  registerSpecies(Species.Taillow, {
    dexNumber: 276,
    evolvesInto: [
      {
        species: Species.Swellow,
        method: EvolutionMethod.Level,
        level: 22,
      },
    ],
    name: 'Taillow',
    category: 'Tiny Swallow Pokemon',
    height: 0.3,
    weight: 2.3,
    family: Families.Taillow,
    stats: {
      [Stats.HP]: 40,
      [Stats.Attack]: 55,
      [Stats.Defense]: 30,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 30,
      [Stats.Speed]: 85,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.Guts],
    hiddenAbilities: [Abilities.Scrappy],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [Biome.Grassland, Biome.Savanna],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.Growl],
        4: [Moves.FocusEnergy],
        8: [Moves.QuickAttack],
        13: [Moves.WingAttack],
        19: [Moves.DoubleTeam],
        26: [Moves.Endeavor],
        34: [Moves.AerialAce],
        43: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Supersonic,
        Moves.MirrorMove,
        Moves.Pursuit,
        Moves.Refresh,
        Moves.Rage,
        Moves.SkyAttack,
      ],
    },
  });

  registerSpecies(Species.Swellow, {
    dexNumber: 277,
    name: 'Swellow',
    category: 'Swallow Pokemon',
    height: 0.7,
    weight: 19.8,
    family: Families.Taillow,
    evolvesFrom: Species.Taillow,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 85,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 125,
    },
    types: [Types.Normal, Types.Flying],
    abilities: [Abilities.Guts],
    // Gale Wings and Big Pecks are this registry's rather than the
    // mainline's: it is a 125-Speed bird that fights on the wing, and
    // a final evolution is filled to four
    hiddenAbilities: [Abilities.Scrappy, Abilities.GaleWings, Abilities.BigPecks],
    eggGroups: [EggGroups.Flying],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Savanna],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.Growl, Moves.FocusEnergy, Moves.QuickAttack],
        13: [Moves.WingAttack],
        19: [Moves.DoubleTeam],
        28: [Moves.Endeavor],
        38: [Moves.AerialAce],
        49: [Moves.Agility],
      },
      teachable: [...FAMILY_TEACHABLE, Moves.HyperBeam],
    },
  });
}
