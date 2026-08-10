import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMagmarSpecies(): void {
  registerSpecies(Species.Magmar, {
    dexNumber: 126,
    name: 'Magmar',
    category: 'Spitfire Pokemon',
    height: 1.3,
    weight: 44.5,
    family: Families.Magmar,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 95,
      [Stats.Defense]: 57,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 93,
    },
    types: [Types.Fire],
    abilities: [Abilities.FlameBody],
    hiddenAbility: Abilities.VitalSpirit,
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Desert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Ember],
        36: [Moves.Leer],
        39: [Moves.ConfuseRay],
        43: [Moves.FirePunch],
        48: [Moves.SmokeScreen],
        52: [Moves.Smog],
        55: [Moves.Flamethrower],
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
        Moves.FireBlast,
        Moves.Psychic,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.Metronome,
        Moves.SkullBash,
        Moves.Rest,
        Moves.Psywave,
        Moves.Substitute,
        Moves.Strength,
      ],
      egg: [Moves.KarateChop, Moves.MegaPunch, Moves.Barrier, Moves.Screech],
    },
  });
}
