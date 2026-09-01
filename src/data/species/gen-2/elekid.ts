import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerElekidSpecies(): void {
  registerSpecies(Species.Elekid, {
    dexNumber: 239,
    evolvesInto: [
      {
        species: Species.Electabuzz,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Elekid',
    category: 'Electric Pokemon',
    height: 0.6,
    weight: 23.5,
    family: Families.Electabuzz,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 63,
      [Stats.Defense]: 37,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 95,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static],
    hiddenAbilities: [Abilities.VitalSpirit],
    // A baby lays no egg of its own: the stage above it does
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [3, 1],
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.QuickAttack],
        9: [Moves.ThunderPunch],
        17: [Moves.LightScreen],
        25: [Moves.Swift],
        33: [Moves.Screech],
        41: [Moves.Thunderbolt],
        49: [Moves.Thunder],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.DynamicPunch,
        Moves.Endure,
        Moves.FirePunch,
        Moves.Flash,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IcePunch,
        Moves.MudSlap,
        Moves.Protect,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.ZapCannon,
      ],
      egg: [Moves.Barrier, Moves.CrossChop, Moves.KarateChop, Moves.Meditate, Moves.RollingKick],
    },
  });
}
