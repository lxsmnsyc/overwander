import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerLuvdiscSpecies(): void {
  registerSpecies(Species.Luvdisc, {
    dexNumber: 370,
    name: 'Luvdisc',
    category: 'Rendezvous Pokemon',
    height: 0.6,
    weight: 8.7,
    family: Families.Luvdisc,
    stats: {
      [Stats.HP]: 43,
      [Stats.Attack]: 30,
      [Stats.Defense]: 55,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 97,
    },
    types: [Types.Water],
    abilities: [Abilities.SwiftSwim],
    hiddenAbilities: [Abilities.Hydration, Abilities.CuteCharm, Abilities.Healer],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 3],
    catchRate: 225,
    biomes: [Biome.CoralReef, Biome.Beach],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        4: [Moves.Charm],
        12: [Moves.WaterGun],
        16: [Moves.Agility],
        24: [Moves.TakeDown],
        28: [Moves.Attract],
        36: [Moves.SweetKiss],
        40: [Moves.Flail],
        48: [Moves.Safeguard],
      },
      teachable: [
        Moves.WaterPulse,
        Moves.Toxic,
        Moves.Hail,
        Moves.HiddenPower,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.Protect,
        Moves.RainDance,
        Moves.Safeguard,
        Moves.Frustration,
        Moves.Return,
        Moves.DoubleTeam,
        Moves.Facade,
        Moves.SecretPower,
        Moves.Rest,
        Moves.Attract,
        Moves.Surf,
        Moves.Waterfall,
        Moves.Dive,
        Moves.DoubleEdge,
        Moves.Mimic,
        Moves.Substitute,
        Moves.PsychUp,
        Moves.Snore,
        Moves.IcyWind,
        Moves.Endure,
        Moves.Swagger,
        Moves.SleepTalk,
        Moves.Swift,
      ],
      egg: [Moves.Splash, Moves.Supersonic, Moves.WaterSport, Moves.MudSport],
    },
  });
}
