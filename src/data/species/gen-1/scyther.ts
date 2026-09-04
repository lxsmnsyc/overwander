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

export default function registerScytherSpecies(): void {
  registerSpecies(Species.Scyther, {
    dexNumber: 123,
    evolvesInto: [
      {
        species: Species.Scizor,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.MetalCoat,
      },
    ],
    name: 'Scyther',
    category: 'Mantis Pokemon',
    height: 1.5,
    weight: 56,
    family: Families.Scyther,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 110,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 105,
    },
    types: [Types.Bug, Types.Flying],
    abilities: [Abilities.Swarm, Abilities.Technician],
    hiddenAbilities: [Abilities.Steadfast],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.QuickAttack, Moves.Leer],
        6: [Moves.FocusEnergy],
        12: [Moves.Pursuit],
        18: [Moves.FalseSwipe],
        24: [Moves.DoubleTeam, Moves.Agility],
        29: [Moves.Slash],
        30: [Moves.WingAttack],
        35: [Moves.SwordsDance],
      },
      teachable: [
        Moves.Toxic,
        Moves.SwordsDance,
        Moves.HyperBeam,
        Moves.Rage,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.Swift,
        Moves.SkullBash,
        Moves.Rest,
        Moves.Substitute,
        Moves.Cut,
        Moves.Headbutt,
        Moves.Thief,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.Detect,
        Moves.Endure,
        Moves.Swagger,
        Moves.FuryCutter,
        Moves.SteelWing,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.SunnyDay,
        Moves.RockSmash,
      ],
      egg: [
        Moves.Counter,
        Moves.LightScreen,
        Moves.RazorWind,
        Moves.Reversal,
        Moves.Safeguard,
        Moves.BatonPass,
      ],
    },
  });
}
