import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerHeracrossSpecies(): void {
  registerSpecies(Species.Heracross, {
    dexNumber: 214,
    name: 'Heracross',
    category: 'Single Horn Pokemon',
    height: 1.5,
    weight: 54,
    family: Families.Heracross,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 125,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 85,
    },
    types: [Types.Bug, Types.Fighting],
    abilities: [Abilities.Swarm, Abilities.Guts],
    // Sap Sipper is this registry's rather than the mainline's,
    // filling it to four: tree sap is what it spends the night
    // fighting over
    hiddenAbilities: [Abilities.Moxie, Abilities.SapSipper],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.MontaneForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        23: [Moves.BrickBreak],
        1: [Moves.Leer, Moves.Tackle],
        6: [Moves.HornAttack],
        12: [Moves.Endure],
        19: [Moves.FuryAttack],
        27: [Moves.Counter],
        35: [Moves.TakeDown],
        44: [Moves.Reversal],
        54: [Moves.Megahorn],
      },
      teachable: [
        Moves.Toxic,
        Moves.Earthquake,
        Moves.Cut,
        Moves.Strength,
        Moves.RockSmash,
        Moves.FuryCutter,
        Moves.Headbutt,
        Moves.SunnyDay,
        Moves.DoubleTeam,
        Moves.Rest,
        Moves.Thief,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.Detect,
        Moves.Endure,
        Moves.Swagger,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.HiddenPower,

        Moves.BodySlam,
        Moves.BulkUp,
        Moves.Dig,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.FocusPunch,
        Moves.HyperBeam,
        Moves.Mimic,
        Moves.RockSlide,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.SeismicToss,
        Moves.Substitute,
        Moves.SwordsDance,
      ],
      egg: [Moves.Bide, Moves.Flail, Moves.Harden, Moves.FalseSwipe],
    },
  });
}
