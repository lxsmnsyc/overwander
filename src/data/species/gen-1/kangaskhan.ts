import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerKangaskhanSpecies(): void {
  registerSpecies(Species.Kangaskhan, {
    dexNumber: 115,
    name: 'Kangaskhan',
    category: 'Parent Pokemon',
    family: Families.Kangaskhan,
    stats: {
      [Stats.HP]: 105,
      [Stats.Attack]: 95,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 90,
    },
    types: [Types.Normal],
    abilities: [Abilities.EarlyBird, Abilities.Scrappy],
    hiddenAbility: Abilities.InnerFocus,
    eggGroups: [EggGroups.Monster],
    genderRatio: [0, 1],
    catchRate: 45,
    biomes: [Biome.Savanna, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.CometPunch, Moves.Rage],
        26: [Moves.Bite],
        31: [Moves.TailWhip],
        36: [Moves.MegaPunch],
        41: [Moves.Leer],
        46: [Moves.DizzyPunch],
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
        Moves.Earthquake,
        Moves.Fissure,
        Moves.Dig,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.FireBlast,
        Moves.SkullBash,
        Moves.Rest,
        Moves.RockSlide,
        Moves.Substitute,
        Moves.Surf,
        Moves.Strength,
      ],
    },
  });
}
