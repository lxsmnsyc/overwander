import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMagbySpecies(): void {
  registerSpecies(Species.Magby, {
    dexNumber: 240,
    evolvesInto: [
      {
        species: Species.Magmar,
        method: EvolutionMethod.Level,
        level: 30,
      },
    ],
    name: 'Magby',
    category: 'Live Coal Pokemon',
    height: 0.7,
    weight: 21.4,
    family: Families.Magmar,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 75,
      [Stats.Defense]: 37,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 83,
    },
    types: [Types.Fire],
    abilities: [Abilities.FlameBody],
    hiddenAbilities: [Abilities.VitalSpirit],
    // A baby lays no egg of its own: the stage above it does
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [3, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Desert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Ember],
        7: [Moves.Leer],
        13: [Moves.Smog],
        19: [Moves.FirePunch],
        25: [Moves.SmokeScreen],
        31: [Moves.SunnyDay],
        37: [Moves.Flamethrower],
        43: [Moves.ConfuseRay],
        49: [Moves.FireBlast],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.DynamicPunch,
        Moves.Endure,
        Moves.FireBlast,
        Moves.FirePunch,
        Moves.Flamethrower,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IronTail,
        Moves.MudSlap,
        Moves.Protect,
        Moves.Psychic,
        Moves.Rest,
        Moves.Return,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Thief,
        Moves.ThunderPunch,
        Moves.Toxic,

        Moves.BodySlam,
        Moves.BrickBreak,
        Moves.Counter,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.FocusPunch,
        Moves.MegaKick,
        Moves.Mimic,
        Moves.RockSmash,
        Moves.SecretPower,
        Moves.SeismicToss,
        Moves.Substitute,
      ],
      egg: [Moves.Barrier, Moves.CrossChop, Moves.KarateChop, Moves.MegaPunch, Moves.Screech],
    },
  });
}
