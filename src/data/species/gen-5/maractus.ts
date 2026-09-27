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
 * The cactus: it keeps the desert's water for the months there is
 * none, and it rattles its arms to put the birds off
 */
export default function registerMaractusSpecies(): void {
  registerSpecies(Species.Maractus, {
    dexNumber: 556,
    name: 'Maractus',
    category: 'Cactus Pokemon',
    height: 1,
    weight: 28,
    family: Families.Maractus,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 86,
      [Stats.Defense]: 67,
      [Stats.SpecialAttack]: 106,
      [Stats.SpecialDefense]: 67,
      [Stats.Speed]: 60,
    },
    types: [Types.Grass],
    abilities: [Abilities.WaterAbsorb, Abilities.Chlorophyll],
    // Rattled is the invented fourth: the line reaches three, and what
    // it does with its arms is rattle them at whatever creeps up
    hiddenAbilities: [Abilities.StormDrain, Abilities.Rattled],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 255,
    biomes: [Biome.Desert, Biome.Badlands],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.Peck,
          Moves.Absorb,
          Moves.Ingrain,
          Moves.AfterYou,
          Moves.CottonGuard,
          Moves.SpikyShield,
        ],
        3: [Moves.SweetScent],
        4: [Moves.Growth],
        8: [Moves.MegaDrain],
        10: [Moves.PinMissile],
        12: [Moves.LeechSeed],
        15: [Moves.Synthesis],
        16: [Moves.SuckerPunch],
        18: [Moves.CottonSpore],
        24: [Moves.GigaDrain],
        29: [Moves.Acupressure],
        38: [Moves.PetalDance],
        44: [Moves.SunnyDay],
        48: [Moves.SolarBeam, Moves.PetalBlizzard],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AfterYou,
        Moves.Assurance,
        Moves.Attract,
        Moves.Bounce,
        Moves.BulletSeed,
        Moves.DoubleTeam,
        Moves.DrainPunch,
        Moves.Endeavor,
        Moves.Endure,
        Moves.EnergyBall,
        Moves.Facade,
        Moves.Frustration,
        Moves.GigaDrain,
        Moves.GrassKnot,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HyperVoice,
        Moves.KnockOff,
        Moves.LeafStorm,
        Moves.NaturePower,
        Moves.PinMissile,
        Moves.PoisonJab,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Round,
        Moves.Safeguard,
        Moves.Screech,
        Moves.SecretPower,
        Moves.SeedBomb,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Spikes,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Synthesis,
        Moves.Toxic,
        Moves.Uproar,
        Moves.WeatherBall,
        Moves.WorrySeed,
        Moves.Confide,
      ],
      egg: [
        Moves.Bounce,
        Moves.BulletSeed,
        Moves.GrassWhistle,
        Moves.LeechSeed,
        Moves.SeedBomb,
        Moves.Spikes,
        Moves.WoodHammer,
        Moves.WorrySeed,
        Moves.GrassyTerrain,
      ],
    },
  });
}
