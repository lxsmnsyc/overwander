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
 * The thing living in the volcano rather than under it: it hangs off
 * the walls and the ceiling by cross-shaped feet, and its blood is
 * what the mountain is full of
 */
export default function registerHeatranSpecies(): void {
  registerSpecies(Species.Heatran, {
    dexNumber: 485,
    name: 'Heatran',
    category: 'Lava Dome Pokemon',
    height: 1.7,
    weight: 430,
    family: Families.Heatran,
    stats: {
      [Stats.HP]: 91,
      [Stats.Attack]: 90,
      [Stats.Defense]: 106,
      [Stats.SpecialAttack]: 130,
      [Stats.SpecialDefense]: 106,
      [Stats.Speed]: 77,
    },
    types: [Types.Fire, Types.Steel],
    abilities: [Abilities.FlashFire],
    // Flame Body is the mainline's; the other two are this
    // registry's, one for what it is made of and one for the smoke
    hiddenAbilities: [Abilities.FlameBody, Abilities.MagmaArmor, Abilities.WhiteSmoke],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [1, 1],
    catchRate: 3,
    biomes: [Biome.Volcano],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.AncientPower],
        9: [Moves.Leer],
        17: [Moves.FireFang],
        25: [Moves.MetalSound],
        33: [Moves.Crunch],
        41: [Moves.ScaryFace],
        49: [Moves.LavaPlume],
        57: [Moves.FireSpin],
        65: [Moves.IronHead],
        73: [Moves.EarthPower],
        81: [Moves.HeatWave],
        88: [Moves.StoneEdge],
        96: [Moves.MagmaStorm],
      },
      teachable: [
        Moves.AncientPower,
        Moves.Attract,
        Moves.Captivate,
        Moves.DarkPulse,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.DragonPulse,
        Moves.EarthPower,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Explosion,
        Moves.Facade,
        Moves.FireBlast,
        Moves.Flamethrower,
        Moves.FlashCannon,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HeatWave,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronDefense,
        Moves.IronHead,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Overheat,
        Moves.Payback,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.Roar,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.StealthRock,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Torment,
        Moves.Toxic,
        Moves.Uproar,
        Moves.WillOWisp,
      ],
    },
  });
}
