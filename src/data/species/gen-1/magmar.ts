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
    evolvesFrom: Species.Magby,
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
    hiddenAbilities: [Abilities.VitalSpirit],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Desert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.Leer, Moves.FirePunch, Moves.Smog],
        25: [Moves.SmokeScreen],
        33: [Moves.SunnyDay],
        39: [Moves.ConfuseRay],
        41: [Moves.Flamethrower],
        57: [Moves.FireBlast],
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
        Moves.FirePunch,
        Moves.ThunderPunch,
        Moves.Headbutt,
        Moves.Thief,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.MudSlap,
        Moves.Detect,
        Moves.Endure,
        Moves.Swagger,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.DynamicPunch,
        Moves.IronTail,
        Moves.HiddenPower,
        Moves.SunnyDay,
        Moves.RockSmash,
        Moves.Flamethrower,
      ],
    },
  });
}
