import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMewSpecies(): void {
  registerSpecies(Species.Mew, {
    dexNumber: 151,
    name: 'Mew',
    category: 'New Species Pokemon',
    family: Families.Mew,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 100,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 100,
    },
    types: [Types.Psychic],
    abilities: [Abilities.Synchronize],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 45,
    biomes: [Biome.TropicalRainforest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Pound],
        10: [Moves.Transform],
        20: [Moves.MegaPunch],
        30: [Moves.Metronome],
        40: [Moves.Psychic],
      },
      // Mew famously learns every machine move
      teachable: [
        Moves.Toxic,
        Moves.MegaPunch,
        Moves.RazorWind,
        Moves.SwordsDance,
        Moves.Whirlwind,
        Moves.MegaKick,
        Moves.HornDrill,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.HyperBeam,
        Moves.PayDay,
        Moves.Submission,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.MegaDrain,
        Moves.SolarBeam,
        Moves.DragonRage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Earthquake,
        Moves.Fissure,
        Moves.Dig,
        Moves.Psychic,
        Moves.Teleport,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Reflect,
        Moves.Bide,
        Moves.Metronome,
        Moves.SelfDestruct,
        Moves.EggBomb,
        Moves.FireBlast,
        Moves.Swift,
        Moves.SkullBash,
        Moves.RockSlide,
        Moves.TriAttack,
        Moves.Substitute,
        Moves.Cut,
        Moves.Fly,
        Moves.Surf,
        Moves.Strength,
        Moves.Flash,
        Moves.ThunderWave,
        Moves.Psywave,
        Moves.Explosion,
        Moves.Rest,
      ],
    },
  });
}
