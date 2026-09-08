import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerSudowoodoSpecies(): void {
  registerSpecies(Species.Sudowoodo, {
    dexNumber: 185,
    name: 'Sudowoodo',
    category: 'Imitation Pokemon',
    height: 1.2,
    weight: 38,
    family: Families.Sudowoodo,
    stats: {
      [Stats.HP]: 70,
      [Stats.Attack]: 100,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 30,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 30,
    },
    types: [Types.Rock],
    abilities: [Abilities.Sturdy, Abilities.RockHead],
    // Sap Sipper is this registry's rather than the mainline's,
    // filling it to four: the imitation is good enough that a grass
    // move treats it as the tree it is pretending to be
    hiddenAbilities: [Abilities.Rattled, Abilities.SapSipper],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 65,
    biomes: [Biome.Woodland, Biome.TemperateForest, Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        33: [Moves.Block],
        57: [Moves.DoubleEdge],
        1: [Moves.Mimic, Moves.RockThrow],
        10: [Moves.Flail],
        19: [Moves.LowKick],
        28: [Moves.RockSlide],
        37: [Moves.FeintAttack],
        46: [Moves.Slam],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.DefenseCurl,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.DynamicPunch,
        Moves.Earthquake,
        Moves.Endure,
        Moves.FirePunch,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IcePunch,
        Moves.MudSlap,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.Rollout,
        Moves.Sandstorm,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Strength,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Thief,
        Moves.ThunderPunch,
        Moves.Toxic,

        Moves.BodySlam,
        Moves.BrickBreak,
        Moves.CalmMind,
        Moves.Counter,
        Moves.Explosion,
        Moves.Facade,
        Moves.FocusPunch,
        Moves.MegaKick,
        Moves.MegaPunch,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.SeismicToss,
        Moves.Substitute,
        Moves.Taunt,
      ],
      egg: [Moves.SelfDestruct],
    },
  });
}
