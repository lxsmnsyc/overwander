import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerDelibirdSpecies(): void {
  registerSpecies(Species.Delibird, {
    dexNumber: 225,
    name: 'Delibird',
    category: 'Delivery Pokemon',
    height: 0.9,
    weight: 16,
    family: Families.Delibird,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 55,
      [Stats.Defense]: 45,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 45,
      [Stats.Speed]: 75,
    },
    types: [Types.Ice, Types.Flying],
    abilities: [Abilities.VitalSpirit, Abilities.Hustle],
    // Gale Wings is this registry's rather than the mainline's,
    // filling it to four: a delivery is only worth anything if it
    // gets there first
    hiddenAbilities: [Abilities.Insomnia, Abilities.GaleWings],
    eggGroups: [EggGroups.Water1, EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Tundra, Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      // Present is the whole of it, which is the joke: everything else
      // it knows had to be taught
      level: {
        1: [Moves.Present],
      },
      teachable: [
        Moves.Toxic,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.IcyWind,
        Moves.Fly,
        Moves.DoubleTeam,
        Moves.Rest,
        Moves.Thief,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.Detect,
        Moves.Endure,
        Moves.Swagger,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.RainDance,
        Moves.Headbutt,
        Moves.MudSlap,
        Moves.Swift,
      ],
      egg: [
        Moves.AuroraBeam,
        Moves.FutureSight,
        Moves.QuickAttack,
        Moves.RapidSpin,
        Moves.Splash,
      ],
    },
  });
}
