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
 * What a Dusclops opens into: a Dusknoir listens for what the dead
 * still want and carries them off when they are done saying it
 */
export default function registerDusknoirSpecies(): void {
  registerSpecies(Species.Dusknoir, {
    dexNumber: 477,
    name: 'Dusknoir',
    category: 'Gripper Pokemon',
    height: 2.2,
    weight: 106.6,
    family: Families.Duskull,
    evolvesFrom: Species.Dusclops,
    stats: {
      [Stats.HP]: 45,
      [Stats.Attack]: 100,
      [Stats.Defense]: 135,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 135,
      [Stats.Speed]: 45,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Pressure],
    // Iron Fist is this registry's rather than the mainline's: the
    // line has three abilities and needs four, and every punch it
    // learns is thrown with the one hand it has
    hiddenAbilities: [Abilities.Frisk, Abilities.IronFist],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Badlands, Biome.Woodland],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [
          Moves.Bind,
          Moves.Disable,
          Moves.FirePunch,
          Moves.Gravity,
          Moves.IcePunch,
          Moves.Leer,
          Moves.NightShade,
          Moves.ThunderPunch,
        ],
        6: [Moves.Disable],
        9: [Moves.Foresight],
        14: [Moves.Astonish],
        17: [Moves.ConfuseRay],
        22: [Moves.ShadowSneak],
        25: [Moves.Pursuit],
        30: [Moves.Curse],
        33: [Moves.WillOWisp],
        37: [Moves.ShadowPunch],
        43: [Moves.MeanLook],
        51: [Moves.Payback],
        61: [Moves.FutureSight],
      },
      teachable: [
        Moves.Attract,
        Moves.Blizzard,
        Moves.BrickBreak,
        Moves.CalmMind,
        Moves.Captivate,
        Moves.ChargeBeam,
        Moves.DarkPulse,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Earthquake,
        Moves.Embargo,
        Moves.Endure,
        Moves.Facade,
        Moves.FirePunch,
        Moves.Flash,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.FocusPunch,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcePunch,
        Moves.IcyWind,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.OminousWind,
        Moves.Payback,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.SkillSwap,
        Moves.SleepTalk,
        Moves.Snatch,
        Moves.Snore,
        Moves.Spite,
        Moves.Strength,
        Moves.Substitute,
        Moves.SuckerPunch,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Thief,
        Moves.ThunderPunch,
        Moves.Torment,
        Moves.Toxic,
        Moves.Trick,
        Moves.TrickRoom,
        Moves.WillOWisp,
      ],
    },
  });
}
