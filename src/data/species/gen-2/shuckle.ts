import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerShuckleSpecies(): void {
  registerSpecies(Species.Shuckle, {
    dexNumber: 213,
    name: 'Shuckle',
    category: 'Mold Pokemon',
    height: 0.6,
    weight: 20.5,
    family: Families.Shuckle,
    stats: {
      [Stats.HP]: 20,
      [Stats.Attack]: 10,
      [Stats.Defense]: 230,
      [Stats.SpecialAttack]: 10,
      [Stats.SpecialDefense]: 230,
      [Stats.Speed]: 5,
    },
    types: [Types.Bug, Types.Rock],
    abilities: [Abilities.Sturdy, Abilities.Gluttony],
    // Harvest is this registry's rather than the mainline's, filling
    // it to four: the berries it hoards in its shell come back, which
    // is what the shell is for
    hiddenAbilities: [Abilities.Contrary, Abilities.Harvest],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.Mountain, Biome.Badlands, Biome.RockyCoast],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Constrict, Moves.Withdraw],
        9: [Moves.Wrap],
        14: [Moves.Encore],
        23: [Moves.Safeguard],
        28: [Moves.Bide],
        37: [Moves.Rest],
      },
      teachable: [
        Moves.Toxic,
        Moves.Earthquake,
        Moves.Dig,
        Moves.Sandstorm,
        Moves.SunnyDay,
        Moves.SludgeBomb,
        Moves.DoubleTeam,
        Moves.Flash,
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
        Moves.DefenseCurl,
        Moves.Headbutt,
        Moves.MudSlap,
        Moves.RockSmash,
        Moves.Strength,
      ],
      egg: [Moves.SweetScent],
    },
  });
}
