import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerElectabuzzSpecies(): void {
  registerSpecies(Species.Electabuzz, {
    dexNumber: 125,
    name: 'Electabuzz',
    category: 'Electric Pokemon',
    family: Families.Electabuzz,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 83,
      [Stats.Defense]: 57,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 105,
    },
    types: [Types.Electric],
    abilities: [Abilities.VitalSpirit, Abilities.Static],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 45,
    biomes: [Biome.Grassland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.QuickAttack, Moves.Leer],
        34: [Moves.ThunderShock],
        37: [Moves.Screech],
        42: [Moves.ThunderPunch],
        49: [Moves.LightScreen],
        54: [Moves.Thunder],
      },
      teachable: [
        Moves.Toxic,
        Moves.MegaPunch,
        Moves.MegaKick,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.HyperBeam,
        Moves.Submission,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.Psychic,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.Metronome,
        Moves.SkullBash,
        Moves.Rest,
        Moves.ThunderWave,
        Moves.Psywave,
        Moves.Substitute,
        Moves.Strength,
        Moves.Flash,
      ],
    },
  });
}
