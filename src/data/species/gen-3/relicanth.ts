import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerRelicanthSpecies(): void {
  registerSpecies(Species.Relicanth, {
    dexNumber: 369,
    name: 'Relicanth',
    category: 'Longevity Pokemon',
    height: 1,
    weight: 23.4,
    family: Families.Relicanth,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 90,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 55,
    },
    types: [Types.Water, Types.Rock],
    abilities: [Abilities.SwiftSwim, Abilities.RockHead],
    hiddenAbilities: [Abilities.Sturdy, Abilities.SolidRock],
    eggGroups: [EggGroups.Water1, EggGroups.Water2],
    genderRatio: [7, 1],
    catchRate: 25,
    biomes: [Biome.DeepOcean, Biome.Ocean],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Harden],
        8: [Moves.WaterGun],
        15: [Moves.RockTomb],
        22: [Moves.Yawn],
        29: [Moves.TakeDown],
        36: [Moves.MudSport],
        43: [Moves.AncientPower],
        50: [Moves.Rest],
        57: [Moves.DoubleEdge],
        64: [Moves.HydroPump],
      },
      teachable: [
        Moves.WaterPulse,
        Moves.CalmMind,
        Moves.Toxic,
        Moves.Hail,
        Moves.HiddenPower,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.Protect,
        Moves.RainDance,
        Moves.Safeguard,
        Moves.Frustration,
        Moves.Earthquake,
        Moves.Return,
        Moves.DoubleTeam,
        Moves.Sandstorm,
        Moves.RockTomb,
        Moves.Facade,
        Moves.SecretPower,
        Moves.Rest,
        Moves.Attract,
        Moves.Surf,
        Moves.RockSmash,
        Moves.Waterfall,
        Moves.Dive,
        Moves.BodySlam,
        Moves.DoubleEdge,
        Moves.Mimic,
        Moves.RockSlide,
        Moves.Substitute,
        Moves.PsychUp,
        Moves.Snore,
        Moves.IcyWind,
        Moves.Endure,
        Moves.MudSlap,
        Moves.Swagger,
        Moves.SleepTalk,
      ],
      egg: [Moves.Amnesia, Moves.SkullBash, Moves.Magnitude, Moves.WaterSport],
    },
  });
}
