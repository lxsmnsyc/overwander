import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerPichuSpecies(): void {
  registerSpecies(Species.Pichu, {
    dexNumber: 172,
    evolvesInto: [
      {
        species: Species.Pikachu,
        method: EvolutionMethod.Friendship,
      },
    ],
    name: 'Pichu',
    category: 'Tiny Mouse Pokemon',
    height: 0.3,
    weight: 2,
    family: Families.Pikachu,
    stats: {
      [Stats.HP]: 20,
      [Stats.Attack]: 40,
      [Stats.Defense]: 15,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 35,
      [Stats.Speed]: 60,
    },
    types: [Types.Electric],
    abilities: [Abilities.Static],
    hiddenAbilities: [Abilities.LightningRod],
    // A baby lays no egg of its own: the stage above it does
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 1],
    catchRate: 190,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Charm, Moves.ThunderShock],
        6: [Moves.TailWhip],
        8: [Moves.ThunderWave],
        11: [Moves.SweetKiss],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.DefenseCurl,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Flash,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IronTail,
        Moves.MudSlap,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thunder,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.ZapCannon,
      ],
      egg: [Moves.Bide, Moves.DoubleSlap, Moves.Encore, Moves.Present, Moves.Reversal],
    },
  });
}
