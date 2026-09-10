import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The Eevee that settled where the snow does: a Glaceon drops its own
 * temperature until the air around it freezes
 */
export default function registerGlaceonSpecies(): void {
  registerSpecies(Species.Glaceon, {
    dexNumber: 471,
    name: 'Glaceon',
    category: 'Fresh Snow Pokemon',
    height: 0.8,
    weight: 25.9,
    family: Families.Eevee,
    evolvesFrom: Species.Eevee,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 60,
      [Stats.Defense]: 110,
      [Stats.SpecialAttack]: 130,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 65,
    },
    types: [Types.Ice],
    abilities: [Abilities.SnowCloak],
    hiddenAbilities: [Abilities.IceBody],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.Glacier, Biome.Tundra, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.HelpingHand, Moves.Tackle, Moves.TailWhip],
        8: [Moves.SandAttack],
        15: [Moves.IcyWind],
        22: [Moves.QuickAttack],
        29: [Moves.Bite],
        36: [Moves.IceShard],
        43: [Moves.IceFang],
        50: [Moves.LastResort],
        57: [Moves.MirrorCoat],
        64: [Moves.Hail],
        71: [Moves.Blizzard],
        78: [Moves.Barrier],
      },
      teachable: [
        Moves.AquaTail,
        Moves.Attract,
        Moves.Avalanche,
        Moves.Blizzard,
        Moves.Captivate,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Facade,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.Hail,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcyWind,
        Moves.IronTail,
        Moves.LastResort,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Roar,
        Moves.RockSmash,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.SignalBeam,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Toxic,
        Moves.WaterPulse,
      ],
    },
  });
}
