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
 * The squirrel that glides between the trees on the membranes under
 * its arms, and holds its charge in its cheeks until it lets go
 */
export default function registerEmolgaSpecies(): void {
  registerSpecies(Species.Emolga, {
    dexNumber: 587,
    name: 'Emolga',
    category: 'Sky Squirrel Pokemon',
    height: 0.4,
    weight: 5,
    family: Families.Emolga,
    stats: {
      [Stats.HP]: 55,
      [Stats.Attack]: 75,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 103,
    },
    types: [Types.Electric, Types.Flying],
    abilities: [Abilities.Static],
    // Wind Rider and Cheek Pouch are this registry's rather than the
    // mainline's: it lives on the air it glides through, and the
    // cheeks it stores its charge in hold a meal just as well
    hiddenAbilities: [Abilities.MotorDrive, Abilities.WindRider, Abilities.CheekPouch],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.TailWhip, Moves.ThunderShock],
        4: [Moves.QuickAttack],
        5: [Moves.DoubleTeam],
        10: [Moves.Charge],
        13: [Moves.Spark],
        15: [Moves.Nuzzle],
        16: [Moves.Pursuit],
        22: [Moves.ShockWave],
        25: [Moves.Acrobatics],
        26: [Moves.ElectroBall],
        34: [Moves.LightScreen],
        35: [Moves.Encore],
        40: [Moves.VoltSwitch],
        46: [Moves.Agility],
        50: [Moves.Discharge],
      },
      teachable: [
        Moves.Acrobatics,
        Moves.AerialAce,
        Moves.Agility,
        Moves.AirSlash,
        Moves.Attract,
        Moves.BatonPass,
        Moves.ChargeBeam,
        Moves.Charm,
        Moves.Covet,
        Moves.Cut,
        Moves.Defog,
        Moves.DoubleTeam,
        Moves.ElectroBall,
        Moves.Electroweb,
        Moves.Encore,
        Moves.Endure,
        Moves.EnergyBall,
        Moves.Facade,
        Moves.Flash,
        Moves.Fling,
        Moves.Frustration,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.IronTail,
        Moves.KnockOff,
        Moves.LastResort,
        Moves.LightScreen,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Roost,
        Moves.Round,
        Moves.SecretPower,
        Moves.ShockWave,
        Moves.SignalBeam,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.Swagger,
        Moves.Swift,
        Moves.Tailwind,
        Moves.Taunt,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.UTurn,
        Moves.VoltSwitch,
        Moves.WildCharge,
        Moves.Confide,
      ],
      egg: [Moves.IonDeluge, Moves.SpeedSwap],
    },
  });
}
