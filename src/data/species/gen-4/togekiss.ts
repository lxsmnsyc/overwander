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
 * The bird that only turns up where nobody is fighting: a Togekiss
 * shares what it has with whoever it decided is worth it
 */
export default function registerTogekissSpecies(): void {
  registerSpecies(Species.Togekiss, {
    dexNumber: 468,
    name: 'Togekiss',
    category: 'Jubilee Pokemon',
    height: 1.5,
    weight: 38.0,
    family: Families.Togepi,
    evolvesFrom: Species.Togetic,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 50,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 120,
      [Stats.SpecialDefense]: 115,
      [Stats.Speed]: 80,
    },
    types: [Types.Fairy, Types.Flying],
    abilities: [Abilities.Hustle, Abilities.SereneGrace],
    // Friend Guard is this registry's rather than the mainline's: the
    // line reaches three abilities and needs four, and standing
    // between somebody and a blow is the whole of what it is for
    hiddenAbilities: [Abilities.SuperLuck, Abilities.FriendGuard],
    eggGroups: [EggGroups.Flying, EggGroups.Fairy],
    genderRatio: [7, 1],
    catchRate: 30,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TemperateForest],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.AirSlash, Moves.AuraSphere, Moves.ExtremeSpeed, Moves.SkyAttack],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AirCutter,
        Moves.AncientPower,
        Moves.Attract,
        Moves.BrickBreak,
        Moves.Captivate,
        Moves.Defog,
        Moves.DoubleTeam,
        Moves.DrainPunch,
        Moves.DreamEater,
        Moves.Endeavor,
        Moves.Endure,
        Moves.Facade,
        Moves.FireBlast,
        Moves.Flamethrower,
        Moves.Flash,
        Moves.Fling,
        Moves.Fly,
        Moves.FocusPunch,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.HeatWave,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.LastResort,
        Moves.LightScreen,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.OminousWind,
        Moves.Pluck,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.Rollout,
        Moves.Roost,
        Moves.Safeguard,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SignalBeam,
        Moves.SilverWind,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.SteelWing,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.ThunderWave,
        Moves.Toxic,
        Moves.Trick,
        Moves.Twister,
        Moves.WaterPulse,
        Moves.ZenHeadbutt,
      ],
    },
  });
}
