import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The crystal: it is born in a snow cloud rather than hatched, and
 * what it catches it catches in chains of ice rather than in a grip
 */
export default function registerCryogonalSpecies(): void {
  registerSpecies(Species.Cryogonal, {
    dexNumber: 615,
    name: 'Cryogonal',
    category: 'Crystallizing Pokemon',
    height: 1.1,
    weight: 148,
    family: Families.Cryogonal,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 50,
      [Stats.Defense]: 50,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 135,
      [Stats.Speed]: 105,
    },
    types: [Types.Ice],
    abilities: [Abilities.Levitate],
    // Ice Body, Snow Warning and Clear Body are the invented three:
    // Levitate is all the mainline gives it, which leaves it three
    // short of the four a final evolution has to reach
    hiddenAbilities: [Abilities.IceBody, Abilities.SnowWarning, Abilities.ClearBody],
    eggGroups: [EggGroups.Mineral],
    genderRatio: undefined,
    catchRate: 25,
    biomes: [Biome.Glacier, Biome.AlpineTundra],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Bind,
          Moves.Mist,
          Moves.Haze,
          Moves.Sharpen,
          Moves.RapidSpin,
          Moves.SheerCold,
          Moves.NightSlash,
          Moves.IceShard,
        ],
        4: [Moves.ConfuseRay],
        5: [Moves.IcyWind],
        13: [Moves.AuroraBeam],
        17: [Moves.AcidArmor],
        20: [Moves.AncientPower],
        25: [Moves.IceBeam],
        28: [Moves.Slash],
        29: [Moves.LightScreen],
        33: [Moves.Reflect],
        44: [Moves.Recover],
        50: [Moves.SolarBeam, Moves.FreezeDry],
      },
      teachable: [
        Moves.Acrobatics,
        Moves.Attract,
        Moves.Avalanche,
        Moves.Blizzard,
        Moves.BodySlam,
        Moves.ConfuseRay,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Explosion,
        Moves.Facade,
        Moves.FlashCannon,
        Moves.FrostBreath,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.Hail,
        Moves.Haze,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcicleSpear,
        Moves.IcyWind,
        Moves.IronDefense,
        Moves.LightScreen,
        Moves.PoisonJab,
        Moves.Protect,
        Moves.RainDance,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.Round,
        Moves.ScaryFace,
        Moves.SecretPower,
        Moves.SelfDestruct,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.Swagger,
        Moves.TakeDown,
        Moves.Toxic,
        Moves.WaterPulse,
        Moves.Confide,
        Moves.AuroraVeil,
        Moves.LaserFocus,
      ],
      egg: [Moves.Explosion, Moves.FrostBreath],
    },
  });
}
