import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerLickitungSpecies(): void {
  registerSpecies(Species.Lickitung, {
    dexNumber: 108,
    name: 'Lickitung',
    category: 'Licking Pokemon',
    family: Families.Lickitung,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 55,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 75,
      [Stats.Speed]: 30,
    },
    types: [Types.Normal],
    abilities: [Abilities.OwnTempo, Abilities.Oblivious],
    hiddenAbility: Abilities.CloudNine,
    eggGroups: [EggGroups.Monster],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Swamp],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Wrap, Moves.Supersonic],
        7: [Moves.Stomp],
        15: [Moves.Disable],
        23: [Moves.DefenseCurl],
        31: [Moves.Slam],
        39: [Moves.Screech],
      },
      teachable: [
        Moves.Toxic,
        Moves.SwordsDance,
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
        Moves.Earthquake,
        Moves.Fissure,
        Moves.Dig,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.FireBlast,
        Moves.Swift,
        Moves.SkullBash,
        Moves.Rest,
        Moves.Psywave,
        Moves.Substitute,
        Moves.Cut,
        Moves.Surf,
        Moves.Strength,
      ],
    },
  });
}
