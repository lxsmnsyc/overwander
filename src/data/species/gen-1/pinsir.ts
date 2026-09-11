import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerPinsirSpecies(): void {
  registerSpecies(Species.Pinsir, {
    dexNumber: 127,
    name: 'Pinsir',
    category: 'Stag Beetle Pokemon',
    height: 1.5,
    weight: 55,
    family: Families.Pinsir,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 125,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 85,
    },
    types: [Types.Bug],
    abilities: [Abilities.HyperCutter, Abilities.MoldBreaker],
    hiddenAbilities: [Abilities.Moxie, Abilities.Swarm],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.TropicalSeasonalForest, Biome.MontaneForest],
    activeTimes: TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.ViceGrip],
        7: [Moves.FocusEnergy],
        13: [Moves.Bind],
        19: [Moves.SeismicToss],
        25: [Moves.Harden, Moves.Revenge],
        30: [Moves.Guillotine],
        31: [Moves.BrickBreak],
        37: [Moves.Submission],
        43: [Moves.SwordsDance],
        49: [Moves.Slash],
      },
      teachable: [
        Moves.Toxic,
        Moves.SwordsDance,
        Moves.BodySlam,
        Moves.TakeDown,
        Moves.DoubleEdge,
        Moves.HyperBeam,
        Moves.Submission,
        Moves.SeismicToss,
        Moves.Rage,
        Moves.Mimic,
        Moves.DoubleTeam,
        Moves.Bide,
        Moves.Rest,
        Moves.Substitute,
        Moves.Cut,
        Moves.Strength,
        Moves.Headbutt,
        Moves.Thief,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.Endure,
        Moves.Swagger,
        Moves.FuryCutter,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.SunnyDay,
        Moves.RockSmash,

        Moves.BulkUp,
        Moves.Dig,
        Moves.Earthquake,
        Moves.Facade,
        Moves.FocusPunch,
        Moves.RockSlide,
        Moves.RockTomb,
        Moves.SecretPower,
      ],
      egg: [Moves.FuryAttack, Moves.Flail, Moves.FalseSwipe, Moves.FeintAttack],
    },
  });
}
