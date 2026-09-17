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
 * What a Misdreavus becomes once its noise turns into words: a
 * Mismagius chants, and the chant is what does the damage
 */
export default function registerMismagiusSpecies(): void {
  registerSpecies(Species.Mismagius, {
    dexNumber: 429,
    name: 'Mismagius',
    category: 'Magical Pokemon',
    height: 0.9,
    weight: 4.4,
    family: Families.Misdreavus,
    evolvesFrom: Species.Misdreavus,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 60,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 105,
      [Stats.Speed]: 105,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Levitate],
    // Cursed Body, Infiltrator and Magic Bounce are this registry's
    // rather than the mainline's: the line reaches one ability and
    // needs four, and every one of these is something it is said to do
    hiddenAbilities: [Abilities.CursedBody, Abilities.Infiltrator, Abilities.MagicBounce],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Woodland, Biome.Badlands],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Astonish,
          Moves.Growl,
          Moves.LuckyChant,
          Moves.MagicalLeaf,
          Moves.Psywave,
          Moves.Spite,
        ],
      },
      teachable: [
        Moves.AerialAce,
        Moves.Attract,
        Moves.CalmMind,
        Moves.Captivate,
        Moves.ChargeBeam,
        Moves.DarkPulse,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Embargo,
        Moves.Endure,
        Moves.EnergyBall,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IcyWind,
        Moves.NaturalGift,
        Moves.OminousWind,
        Moves.Payback,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SkillSwap,
        Moves.SleepTalk,
        Moves.Snatch,
        Moves.Snore,
        Moves.Spite,
        Moves.Substitute,
        Moves.SuckerPunch,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Taunt,
        Moves.Thief,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Torment,
        Moves.Toxic,
        Moves.Trick,
        Moves.TrickRoom,
        Moves.Uproar,
        Moves.WillOWisp,
      ],
    },
  });
}
