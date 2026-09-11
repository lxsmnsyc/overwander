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
 * The three that decide what the sky is doing: the sea, the land, and
 * the thing that flies above both and calls the argument off. Each
 * carries one ability in the mainline and nothing else, so what fills
 * the other three slots is this registry's
 */

// TM, HM and tutor moves all three share
const TRIO_TEACHABLE = [
  Moves.Roar,
  Moves.Toxic,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.Protect,
  Moves.Frustration,
  Moves.Thunderbolt,
  Moves.Thunder,
  Moves.Earthquake,
  Moves.Return,
  Moves.BrickBreak,
  Moves.DoubleTeam,
  Moves.ShockWave,
  Moves.Facade,
  Moves.SecretPower,
  Moves.Rest,
  Moves.Strength,
  Moves.RockSmash,
  Moves.BodySlam,
  Moves.DoubleEdge,
  Moves.Mimic,
  Moves.ThunderWave,
  Moves.RockSlide,
  Moves.Substitute,
  Moves.PsychUp,
  Moves.Snore,
  Moves.Endure,
  Moves.MudSlap,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Swift,
];

export default function registerWeatherTrioSpecies(): void {
  registerSpecies(Species.Kyogre, {
    dexNumber: 382,
    name: 'Kyogre',
    category: 'Sea Basin Pokemon',
    height: 4.5,
    weight: 352,
    family: Families.Kyogre,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 100,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 150,
      [Stats.SpecialDefense]: 140,
      [Stats.Speed]: 90,
    },
    types: [Types.Water],
    abilities: [Abilities.Drizzle],
    // All three are this registry's: it swims in the rain it brought,
    // drinks what is thrown at it, and is expensive to fight at all
    hiddenAbilities: [Abilities.SwiftSwim, Abilities.WaterAbsorb, Abilities.Pressure],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.WaterPulse],
        5: [Moves.ScaryFace],
        15: [Moves.AncientPower],
        20: [Moves.BodySlam],
        30: [Moves.CalmMind],
        35: [Moves.IceBeam],
        45: [Moves.HydroPump],
        50: [Moves.Rest],
        60: [Moves.SheerCold],
        65: [Moves.DoubleEdge],
        75: [Moves.WaterSpout],
      },
      teachable: [
        ...TRIO_TEACHABLE,
        Moves.WaterPulse,
        Moves.CalmMind,
        Moves.Hail,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.RainDance,
        Moves.Safeguard,
        Moves.RockTomb,
        Moves.Surf,
        Moves.Waterfall,
        Moves.Dive,
        Moves.IcyWind,
        Moves.DefenseCurl,
      ],
    },
  });

  registerSpecies(Species.Groudon, {
    dexNumber: 383,
    name: 'Groudon',
    category: 'Continent Pokemon',
    height: 3.5,
    weight: 950,
    family: Families.Groudon,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 150,
      [Stats.Defense]: 140,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 90,
    },
    types: [Types.Ground],
    abilities: [Abilities.Drought],
    // All three are this registry's: nothing freezes what it is made
    // of, every blow settles it deeper, and it is expensive to fight
    hiddenAbilities: [Abilities.MagmaArmor, Abilities.Stamina, Abilities.Pressure],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Volcano],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.MudShot],
        5: [Moves.ScaryFace],
        15: [Moves.AncientPower],
        20: [Moves.Slash],
        30: [Moves.BulkUp],
        35: [Moves.Earthquake],
        45: [Moves.FireBlast],
        50: [Moves.Rest],
        60: [Moves.Fissure],
        65: [Moves.SolarBeam],
        75: [Moves.Eruption],
      },
      teachable: [
        ...TRIO_TEACHABLE,
        Moves.DragonClaw,
        Moves.BulkUp,
        Moves.SunnyDay,
        Moves.Safeguard,
        Moves.SolarBeam,
        Moves.IronTail,
        Moves.Dig,
        Moves.Flamethrower,
        Moves.Sandstorm,
        Moves.FireBlast,
        Moves.RockTomb,
        Moves.AerialAce,
        Moves.Overheat,
        Moves.Cut,
        Moves.MegaPunch,
        Moves.SwordsDance,
        Moves.MegaKick,
        Moves.Counter,
        Moves.SeismicToss,
        Moves.DynamicPunch,
        Moves.Rollout,
        Moves.FuryCutter,
        Moves.ThunderPunch,
        Moves.FirePunch,
        Moves.DefenseCurl,
      ],
    },
  });

  registerSpecies(Species.Rayquaza, {
    dexNumber: 384,
    name: 'Rayquaza',
    category: 'Sky High Pokemon',
    height: 7,
    weight: 206.5,
    family: Families.Rayquaza,
    stats: {
      [Stats.HP]: 105,
      [Stats.Attack]: 150,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 150,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 95,
    },
    types: [Types.Dragon, Types.Flying],
    abilities: [Abilities.AirLock],
    // All three are this registry's: it is expensive to fight, what
    // it comes down on thinks better of swinging, and nothing gets
    // through the first blow at full strength
    hiddenAbilities: [Abilities.Pressure, Abilities.Intimidate, Abilities.Multiscale],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    // The one of the three the mainline lets a player face on level
    // terms, and the only reason it is not a 3
    catchRate: 45,
    biomes: [Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Twister],
        5: [Moves.ScaryFace],
        15: [Moves.AncientPower],
        20: [Moves.DragonClaw],
        30: [Moves.DragonDance],
        35: [Moves.Crunch],
        45: [Moves.Fly],
        50: [Moves.Rest],
        60: [Moves.ExtremeSpeed],
        65: [Moves.Outrage],
        75: [Moves.HyperBeam],
      },
      teachable: [
        ...TRIO_TEACHABLE,
        Moves.DragonClaw,
        Moves.WaterPulse,
        Moves.BulkUp,
        Moves.SunnyDay,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.RainDance,
        Moves.SolarBeam,
        Moves.IronTail,
        Moves.Flamethrower,
        Moves.Sandstorm,
        Moves.FireBlast,
        Moves.AerialAce,
        Moves.Overheat,
        Moves.Fly,
        Moves.Surf,
        Moves.Waterfall,
        Moves.Dive,
        Moves.IcyWind,
        Moves.FuryCutter,
      ],
    },
  });
}
