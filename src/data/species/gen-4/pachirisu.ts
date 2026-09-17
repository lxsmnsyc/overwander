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
 * The squirrel with its cheeks full: berries in one pouch and a
 * charge in the other, and it hands both out to whoever it lives
 * beside
 */
export default function registerPachirisuSpecies(): void {
  registerSpecies(Species.Pachirisu, {
    dexNumber: 417,
    name: 'Pachirisu',
    category: 'EleSquirrel Pokemon',
    height: 0.4,
    weight: 3.9,
    family: Families.Pachirisu,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 45,
      [Stats.Defense]: 70,
      [Stats.SpecialAttack]: 45,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 95,
    },
    types: [Types.Electric],
    abilities: [Abilities.RunAway, Abilities.Pickup],
    // Volt Absorb is the mainline's hidden one; the pouches are
    // this registry's, and they are what the species is
    hiddenAbilities: [Abilities.VoltAbsorb, Abilities.CheekPouch],
    eggGroups: [EggGroups.Field, EggGroups.Fairy],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [Biome.TemperateForest, Biome.Woodland, Biome.Taiga],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bide, Moves.Growl],
        5: [Moves.QuickAttack],
        9: [Moves.Charm],
        13: [Moves.Spark],
        17: [Moves.Endure],
        21: [Moves.Swift],
        25: [Moves.SweetKiss],
        29: [Moves.Discharge],
        33: [Moves.SuperFang],
        37: [Moves.LastResort],
      },
      teachable: [
        Moves.Attract,
        Moves.Captivate,
        Moves.ChargeBeam,
        Moves.Cut,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Fling,
        Moves.Frustration,
        Moves.GrassKnot,
        Moves.GunkShot,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.IronTail,
        Moves.LastResort,
        Moves.LightScreen,
        Moves.MagnetRise,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
        Moves.SecretPower,
        Moves.SeedBomb,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Substitute,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.UTurn,
        Moves.Uproar,
      ],
    },
  });
}
