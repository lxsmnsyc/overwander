import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerOnixSpecies(): void {
  registerSpecies(Species.Onix, {
    dexNumber: 95,
    name: 'Onix',
    category: 'Rock Snake Pokemon',
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
    hiddenAbility: Abilities.WeakArmor,
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.ColdDesert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Screech],
        15: [Moves.Bind],
        19: [Moves.RockThrow],
        25: [Moves.Rage],
        33: [Moves.Slam],
        43: [Moves.Harden],
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
      ],
    },
  });
}
