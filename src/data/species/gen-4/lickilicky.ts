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
 * The tongue that outgrew the Lickitung: a Lickilicky wraps it around
 * whatever it wants and carries the thing home
 */
export default function registerLickilickySpecies(): void {
  registerSpecies(Species.Lickilicky, {
    dexNumber: 463,
    name: 'Lickilicky',
    category: 'Licking Pokemon',
    height: 1.7,
    weight: 140.0,
    family: Families.Lickitung,
    evolvesFrom: Species.Lickitung,
    stats: {
      [Stats.HP]: 110,
      [Stats.Attack]: 85,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 50,
    },
    types: [Types.Normal],
    abilities: [Abilities.OwnTempo, Abilities.Oblivious],
    // Thick Fat is this registry's rather than the mainline's: the
    // line reaches three abilities and needs four, and 110 HP of soft
    // Normal type is what it is
    hiddenAbilities: [Abilities.CloudNine, Abilities.ThickFat],
    eggGroups: [EggGroups.Monster],
    genderRatio: [1, 1],
    catchRate: 30,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TropicalSeasonalForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Lick],
        5: [Moves.Supersonic],
        9: [Moves.DefenseCurl],
        13: [Moves.KnockOff],
        17: [Moves.Wrap],
        21: [Moves.Stomp],
        25: [Moves.Disable],
        29: [Moves.Slam],
        33: [Moves.Rollout],
        37: [Moves.MeFirst],
        41: [Moves.Refresh],
        45: [Moves.Screech],
        49: [Moves.PowerWhip],
        53: [Moves.WringOut],
        57: [Moves.GyroBall],
      },
      teachable: [
        Moves.AquaTail,
        Moves.Attract,
        Moves.Blizzard,
        Moves.BrickBreak,
        Moves.Captivate,
        Moves.Cut,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Explosion,
        Moves.Facade,
        Moves.FireBlast,
        Moves.FirePunch,
        Moves.Flamethrower,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.FocusPunch,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.GyroBall,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcePunch,
        Moves.IcyWind,
        Moves.IronTail,
        Moves.KnockOff,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.PsychUp,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Rollout,
        Moves.Sandstorm,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Surf,
        Moves.Swagger,
        Moves.SwordsDance,
        Moves.Thief,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.WaterPulse,
        Moves.ZenHeadbutt,
      ],
    },
  });
}
