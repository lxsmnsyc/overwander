import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerTorkoalSpecies(): void {
  registerSpecies(Species.Torkoal, {
    dexNumber: 324,
    name: 'Torkoal',
    category: 'Coal Pokemon',
    height: 0.5,
    weight: 80.4,
    family: Families.Torkoal,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 85,
      [Stats.Defense]: 140,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 20,
    },
    types: [Types.Fire],
    abilities: [Abilities.WhiteSmoke, Abilities.Drought],
    hiddenAbilities: [Abilities.ShellArmor, Abilities.FlameBody],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Volcano, Biome.Mountain],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Ember],
        4: [Moves.Smog],
        7: [Moves.Curse],
        14: [Moves.SmokeScreen],
        17: [Moves.FireSpin],
        20: [Moves.BodySlam],
        27: [Moves.Protect],
        30: [Moves.Flamethrower],
        33: [Moves.IronDefense],
        40: [Moves.Amnesia],
        43: [Moves.Flail],
        46: [Moves.HeatWave],
      },
      teachable: [
        Moves.Toxic,
        Moves.HiddenPower,
        Moves.SunnyDay,
        Moves.Protect,
        Moves.Frustration,
        Moves.IronTail,
        Moves.Return,
        Moves.DoubleTeam,
        Moves.Flamethrower,
        Moves.SludgeBomb,
        Moves.FireBlast,
        Moves.Facade,
        Moves.SecretPower,
        Moves.Rest,
        Moves.Attract,
        Moves.Overheat,
        Moves.Strength,
        Moves.RockSmash,
        Moves.BodySlam,
        Moves.DoubleEdge,
        Moves.Mimic,
        Moves.Explosion,
        Moves.RockSlide,
        Moves.Substitute,
        Moves.Snore,
        Moves.Endure,
        Moves.MudSlap,
        Moves.Swagger,
        Moves.SleepTalk,
      ],
      egg: [Moves.Yawn, Moves.Eruption],
    },
  });
}
