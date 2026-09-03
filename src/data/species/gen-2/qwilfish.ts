import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerQwilfishSpecies(): void {
  registerSpecies(Species.Qwilfish, {
    dexNumber: 211,
    name: 'Qwilfish',
    category: 'Balloon Pokemon',
    height: 0.5,
    weight: 3.9,
    family: Families.Qwilfish,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 95,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 55,
      [Stats.SpecialDefense]: 55,
      [Stats.Speed]: 85,
    },
    types: [Types.Water, Types.Poison],
    abilities: [Abilities.PoisonPoint, Abilities.SwiftSwim],
    // Rough Skin is this registry's rather than the mainline's,
    // filling it to four: the spines are the whole animal, and
    // whatever grabs it finds them
    hiddenAbilities: [Abilities.Intimidate, Abilities.RoughSkin],
    eggGroups: [EggGroups.Water2],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Ocean, Biome.KelpForest, Biome.RockyCoast],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        25: [Moves.Revenge],
        45: [Moves.DestinyBond],
        1: [Moves.PoisonSting, Moves.Spikes, Moves.Tackle],
        10: [Moves.Harden, Moves.Minimize],
        19: [Moves.WaterGun],
        28: [Moves.PinMissile],
        37: [Moves.TakeDown],
        46: [Moves.HydroPump],
      },
      teachable: [
        Moves.Toxic,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.IcyWind,
        Moves.Surf,
        Moves.Waterfall,
        Moves.Whirlpool,
        Moves.SludgeBomb,
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
        Moves.Swift,

        Moves.Dive,
        Moves.DoubleEdge,
        Moves.Facade,
        Moves.Mimic,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.Substitute,
        Moves.SwordsDance,
        Moves.ThunderWave,
        Moves.WaterPulse,
      ],
      egg: [Moves.BubbleBeam, Moves.Flail, Moves.Haze, Moves.Supersonic, Moves.Astonish],
    },
  });
}
