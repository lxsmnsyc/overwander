import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerChanseySpecies(): void {
  registerSpecies(Species.Chansey, {
    dexNumber: 113,
    name: 'Chansey',
    category: 'Egg Pokemon',
    height: 1.1,
    weight: 34.6,
    family: Families.Chansey,
    stats: {
      [Stats.HP]: 250,
      [Stats.Attack]: 5,
      [Stats.Defense]: 5,
      [Stats.SpecialAttack]: 35,
      [Stats.SpecialDefense]: 105,
      [Stats.Speed]: 50,
    },
    types: [Types.Normal],
    abilities: [Abilities.NaturalCure, Abilities.SereneGrace],
    hiddenAbilities: [Abilities.Healer],
    eggGroups: [EggGroups.Fairy],
    genderRatio: [0, 1],
    catchRate: 30,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Pound, Moves.DoubleSlap],
        24: [Moves.Sing],
        30: [Moves.Growl],
        38: [Moves.Minimize],
        44: [Moves.DefenseCurl],
        48: [Moves.LightScreen],
        54: [Moves.DoubleEdge],
      },
      teachable: [
        Moves.Toxic,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.Submission,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Psychic,
        Moves.Teleport,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Metronome,
        Moves.FireBlast,
        Moves.SkullBash,
        Moves.Rest,
        Moves.ThunderWave,
        Moves.Psywave,
        Moves.TriAttack,
        Moves.Substitute,
        Moves.Strength,
        Moves.Flash,
        // Chansey's egg, and the machine that teaches it. The man who
        // hands the TM out says only a Chansey can learn it, which is
        // nearly true — Mew can as well, and was not supposed to be
        // spoken of
        Moves.SoftBoiled,
      ],
    },
  });
}
