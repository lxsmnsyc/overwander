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
 * The mouse with whiskers for antennas. It is already moving by the
 * time anything else has decided to, which its signature pays for in
 * cast time rather than in cooldowns
 */
export default function registerDedenneSpecies(): void {
  registerSpecies(Species.Dedenne, {
    dexNumber: 702,
    name: 'Dedenne',
    category: 'Antenna Pokemon',
    height: 0.2,
    weight: 2.2,
    family: Families.Dedenne,
    stats: {
      [Stats.HP]: 67,
      [Stats.Attack]: 58,
      [Stats.Defense]: 57,
      [Stats.SpecialAttack]: 81,
      [Stats.SpecialDefense]: 67,
      [Stats.Speed]: 101,
    },
    types: [Types.Electric, Types.Fairy],
    abilities: [Abilities.CheekPouch, Abilities.Pickup],
    // Minus is this line's invented filler: the mainline gives the
    // mouse Cheek Pouch, Pickup and Plus, so this is the other half
    // of the pair it is already born with
    hiddenAbilities: [Abilities.Plus, Abilities.Minus],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 180,
    biomes: [Biome.Grassland, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.TailWhip, Moves.Nuzzle],
        7: [Moves.ThunderShock],
        10: [Moves.Charge],
        14: [Moves.Charm],
        17: [Moves.ParabolicCharge],
        23: [Moves.ThunderWave],
        26: [Moves.VoltSwitch],
        30: [Moves.Rest],
        31: [Moves.Snore],
        34: [Moves.ChargeBeam],
        39: [Moves.Entrainment],
        40: [Moves.Discharge],
        42: [Moves.PlayRough],
        45: [Moves.Thunder],
        50: [Moves.SuperFang],
      },
      teachable: [
        Moves.AerialAce,
        Moves.Agility,
        Moves.AllySwitch,
        Moves.Attract,
        Moves.Charge,
        Moves.ChargeBeam,
        Moves.Charm,
        Moves.Confide,
        Moves.Covet,
        Moves.Cut,
        Moves.DazzlingGleam,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.DrainingKiss,
        Moves.EerieImpulse,
        Moves.ElectricTerrain,
        Moves.ElectroBall,
        Moves.Electroweb,
        Moves.Endeavor,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Fling,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.LastResort,
        Moves.LightScreen,
        Moves.MagnetRise,
        Moves.MistyTerrain,
        Moves.PlayRough,
        Moves.Protect,
        Moves.RainDance,
        Moves.Recycle,
        Moves.Rest,
        Moves.Retaliate,
        Moves.Return,
        Moves.Round,
        Moves.SecretPower,
        Moves.SeedBomb,
        Moves.ShockWave,
        Moves.SignalBeam,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.SuperFang,
        Moves.Swagger,
        Moves.Swift,
        Moves.TakeDown,
        Moves.Thief,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.UTurn,
        Moves.VoltSwitch,
        Moves.WildCharge,
      ],
      egg: [
        Moves.Covet,
        Moves.EerieImpulse,
        Moves.HelpingHand,
        Moves.MagnetRise,
        Moves.NaturalGift,
      ],
    },
  });
}
