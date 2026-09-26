import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The flat fish buried in the mud of a tidal flat, grinning at
 * whatever stands on it
 */
export default function registerStunfiskSpecies(): void {
  registerSpecies(Species.Stunfisk, {
    dexNumber: 618,
    name: 'Stunfisk',
    category: 'Trap Pokemon',
    height: 0.7,
    weight: 11,
    family: Families.Stunfisk,
    habitat: Habitat.Amphibious,
    stats: {
      [Stats.HP]: 109,
      [Stats.Attack]: 66,
      [Stats.Defense]: 84,
      [Stats.SpecialAttack]: 81,
      [Stats.SpecialDefense]: 99,
      [Stats.Speed]: 32,
    },
    types: [Types.Ground, Types.Electric],
    abilities: [Abilities.Static, Abilities.Limber],
    hiddenAbilities: [Abilities.SandVeil, Abilities.LightningRod],
    eggGroups: [EggGroups.Water1, EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 75,
    // Flat in the mud of the marshes, waiting to be stepped on
    biomes: [Biome.Swamp, Biome.Bog],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.MudSlap, Moves.MudSport],
        5: [Moves.Bide],
        9: [Moves.ThunderShock],
        13: [Moves.MudShot],
        17: [Moves.Camouflage],
        21: [Moves.MudBomb],
        25: [Moves.Discharge],
        30: [Moves.Endure],
        35: [Moves.Bounce],
        40: [Moves.MuddyWater],
        45: [Moves.Thunderbolt],
        50: [Moves.Revenge],
        55: [Moves.Flail],
        61: [Moves.Fissure],
      },
      teachable: [
        Moves.AquaTail,
        Moves.Astonish,
        Moves.Attract,
        Moves.Bounce,
        Moves.Bulldoze,
        Moves.Curse,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.EarthPower,
        Moves.Earthquake,
        Moves.Electroweb,
        Moves.Endeavor,
        Moves.Facade,
        Moves.Flash,
        Moves.FoulPlay,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.MagnetRise,
        Moves.PainSplit,
        Moves.Payback,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockSlide,
        Moves.RockTomb,
        Moves.Round,
        Moves.Sandstorm,
        Moves.Scald,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.SludgeBomb,
        Moves.SludgeWave,
        Moves.Snore,
        Moves.Spark,
        Moves.Spite,
        Moves.StealthRock,
        Moves.StoneEdge,
        Moves.Substitute,
        Moves.Surf,
        Moves.Swagger,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.Uproar,
        Moves.Yawn,
      ],
    },
  });
}
