import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerNosepassSpecies(): void {
  registerSpecies(Species.Nosepass, {
    dexNumber: 299,
    name: 'Nosepass',
    category: 'Compass Pokemon',
    height: 1,
    weight: 97,
    family: Families.Nosepass,
    stats: {
      [Stats.HP]: 30,
      [Stats.Attack]: 45,
      [Stats.Defense]: 135,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 30,
    },
    types: [Types.Rock],
    abilities: [Abilities.Sturdy, Abilities.MagnetPull],
    hiddenAbilities: [Abilities.SandForce],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        7: [Moves.Harden],
        13: [Moves.RockThrow],
        16: [Moves.Block],
        22: [Moves.ThunderWave],
        28: [Moves.RockSlide],
        31: [Moves.Sandstorm],
        37: [Moves.Rest],
        43: [Moves.ZapCannon],
        46: [Moves.LockOn],
      },
      teachable: [
        Moves.Attract,
        Moves.BodySlam,
        Moves.DefenseCurl,
        Moves.DoubleEdge,
        Moves.DoubleTeam,
        Moves.DynamicPunch,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Explosion,
        Moves.Facade,
        Moves.FirePunch,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.IcePunch,
        Moves.Mimic,
        Moves.MudSlap,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Rollout,
        Moves.Sandstorm,
        Moves.SecretPower,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Torment,
        Moves.Toxic,
      ],
      egg: [Moves.Explosion, Moves.Magnitude, Moves.Rollout],
    },
  });
}
