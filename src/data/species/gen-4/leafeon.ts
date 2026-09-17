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
 * The Eevee that settled in a wood and stayed: a Leafeon lives off
 * the light and smells like the clearing it sleeps in
 */
export default function registerLeafeonSpecies(): void {
  registerSpecies(Species.Leafeon, {
    dexNumber: 470,
    name: 'Leafeon',
    category: 'Verdant Pokemon',
    height: 1.0,
    weight: 25.5,
    family: Families.Eevee,
    evolvesFrom: Species.Eevee,
    stats: {
      [Stats.HP]: 65,
      [Stats.Attack]: 110,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 60,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 95,
    },
    types: [Types.Grass],
    abilities: [Abilities.LeafGuard],
    hiddenAbilities: [Abilities.Chlorophyll],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 45,
    biomes: [Biome.TemperateForest, Biome.Woodland, Biome.TemperateRainforest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.HelpingHand, Moves.Tackle, Moves.TailWhip],
        8: [Moves.SandAttack],
        15: [Moves.RazorLeaf],
        22: [Moves.QuickAttack],
        29: [Moves.Synthesis],
        36: [Moves.MagicalLeaf],
        43: [Moves.GigaDrain],
        50: [Moves.LastResort],
        57: [Moves.GrassWhistle],
        64: [Moves.SunnyDay],
        71: [Moves.LeafBlade],
        78: [Moves.SwordsDance],
      },
      teachable: [
        Moves.AerialAce,
        Moves.Attract,
        Moves.BulletSeed,
        Moves.Captivate,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.EnergyBall,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.GigaDrain,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.KnockOff,
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
        Moves.SeedBomb,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.SwordsDance,
        Moves.Synthesis,
        Moves.Toxic,
        Moves.XScissor,
      ],
    },
  });
}
