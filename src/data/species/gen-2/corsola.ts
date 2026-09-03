import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerCorsolaSpecies(): void {
  registerSpecies(Species.Corsola, {
    dexNumber: 222,
    name: 'Corsola',
    category: 'Coral Pokemon',
    height: 0.6,
    weight: 5,
    family: Families.Corsola,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 55,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 35,
    },
    types: [Types.Water, Types.Rock],
    abilities: [Abilities.Hustle, Abilities.NaturalCure],
    // Storm Drain is this registry's rather than the mainline's,
    // filling it to four: a reef is what the current runs into
    hiddenAbilities: [Abilities.Regenerator, Abilities.StormDrain],
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [1, 3],
    catchRate: 60,
    biomes: [Biome.CoralReef, Biome.Ocean, Biome.Beach],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        17: [Moves.Refresh],
        34: [Moves.RockBlast],
        1: [Moves.Tackle],
        7: [Moves.Harden],
        13: [Moves.Bubble],
        19: [Moves.Recover],
        25: [Moves.BubbleBeam],
        31: [Moves.SpikeCannon],
        37: [Moves.MirrorCoat],
        43: [Moves.AncientPower],
      },
      teachable: [
        Moves.Toxic,
        Moves.IceBeam,
        Moves.Surf,
        Moves.Whirlpool,
        Moves.Earthquake,
        Moves.Psychic,
        Moves.Sandstorm,
        Moves.SunnyDay,
        Moves.DoubleTeam,
        Moves.Rest,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.Endure,
        Moves.Rollout,
        Moves.Swagger,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.RainDance,
        Moves.DefenseCurl,
        Moves.Headbutt,
        Moves.MudSlap,
        Moves.RockSmash,
        Moves.Strength,

        Moves.Blizzard,
        Moves.BodySlam,
        Moves.CalmMind,
        Moves.Dig,
        Moves.DoubleEdge,
        Moves.Explosion,
        Moves.Facade,
        Moves.LightScreen,
        Moves.Mimic,
        Moves.Reflect,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.Substitute,
        Moves.WaterPulse,
      ],
      egg: [
        Moves.Amnesia,
        Moves.Mist,
        Moves.RockSlide,
        Moves.Safeguard,
        Moves.Screech,
        Moves.Barrier,
        Moves.ConfuseRay,
        Moves.IcicleSpear,
        Moves.Ingrain,
      ],
    },
  });
}
