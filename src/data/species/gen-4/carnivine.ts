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
 * The mouth hanging off a branch. It smells sweet on purpose, and
 * what comes to find out why does not come back
 */
export default function registerCarnivineSpecies(): void {
  registerSpecies(Species.Carnivine, {
    dexNumber: 455,
    name: 'Carnivine',
    category: 'Bug Catcher Pokemon',
    height: 1.4,
    weight: 27.0,
    family: Families.Carnivine,
    stats: {
      [Stats.HP]: 74,
      [Stats.Attack]: 100,
      [Stats.Defense]: 72,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 72,
      [Stats.Speed]: 46,
    },
    types: [Types.Grass],
    abilities: [Abilities.Levitate],
    // The other three are this registry's: it is a mouth on a stem,
    // it eats early, and nothing else opens its lunch in front of one
    hiddenAbilities: [Abilities.StrongJaw, Abilities.Gluttony, Abilities.Unnerve],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 200,
    biomes: [Biome.Swamp, Biome.Mangrove, Biome.TropicalRainforest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bind, Moves.Growth],
        7: [Moves.Bite],
        11: [Moves.VineWhip],
        17: [Moves.SweetScent],
        21: [Moves.Ingrain],
        27: [Moves.FeintAttack],
        31: [Moves.SpitUp, Moves.Stockpile, Moves.Swallow],
        37: [Moves.Crunch],
        41: [Moves.WringOut],
        47: [Moves.PowerWhip],
      },
      teachable: [
        Moves.Attract,
        Moves.BulletSeed,
        Moves.Captivate,
        Moves.Cut,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.EnergyBall,
        Moves.Facade,
        Moves.Flash,
        Moves.Fling,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.GastroAcid,
        Moves.GigaDrain,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.KnockOff,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Payback,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.SecretPower,
        Moves.SeedBomb,
        Moves.SleepTalk,
        Moves.SludgeBomb,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.SwordsDance,
        Moves.Synthesis,
        Moves.Thief,
        Moves.Toxic,
      ],
    },
  });
}
