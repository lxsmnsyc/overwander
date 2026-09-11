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

export default function registerOnixSpecies(): void {
  registerSpecies(Species.Onix, {
    dexNumber: 95,
    evolvesInto: [
      {
        species: Species.Steelix,
        method: EvolutionMethod.Trade | EvolutionMethod.HeldItem,
        item: Items.MetalCoat,
      },
    ],
    name: 'Onix',
    category: 'Rock Snake Pokemon',
    height: 8.8,
    weight: 210,
    family: Families.Onix,
    stats: {
      [Stats.HP]: 35,
      [Stats.Attack]: 45,
      [Stats.Defense]: 160,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 70,
    },
    types: [Types.Rock, Types.Ground],
    abilities: [Abilities.RockHead, Abilities.Sturdy],
    hiddenAbilities: [Abilities.WeakArmor],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.ColdDesert, Biome.Volcano],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Screech],
        10: [Moves.Bind],
        14: [Moves.RockThrow],
        23: [Moves.Harden],
        25: [Moves.Rage],
        30: [Moves.DragonBreath],
        33: [Moves.Slam],
        36: [Moves.Sandstorm],
        49: [Moves.SandTomb],
      },
      teachable: [
        Moves.Toxic,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.Rage,
        Moves.DragonRage,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.SelfDestruct,
        Moves.SkullBash,
        Moves.Rest,
        Moves.RockSlide,
        Moves.Substitute,
        Moves.Explosion,
        Moves.Earthquake,
        Moves.Fissure,
        Moves.Dig,
        Moves.Strength,
        Moves.Headbutt,
        Moves.Roar,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.MudSlap,
        Moves.Sandstorm,
        Moves.Endure,
        Moves.Swagger,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.IronTail,
        Moves.HiddenPower,
        Moves.SunnyDay,
        Moves.RockSmash,

        Moves.Facade,
        Moves.PsychUp,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.Taunt,
        Moves.Torment,
      ],
      egg: [Moves.RockSlide, Moves.Flail, Moves.Block],
    },
  });
}
