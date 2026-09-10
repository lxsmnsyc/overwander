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
 * What the cold used to grow: a Mamoswine carries tusks that say how
 * long the winter it was born in lasted
 */
export default function registerMamoswineSpecies(): void {
  registerSpecies(Species.Mamoswine, {
    dexNumber: 473,
    name: 'Mamoswine',
    category: 'Twin Tusk Pokemon',
    height: 2.5,
    weight: 291.0,
    family: Families.Swinub,
    evolvesFrom: Species.Piloswine,
    stats: {
      [Stats.HP]: 110,
      [Stats.Attack]: 130,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 70,
      [Stats.SpecialDefense]: 60,
      [Stats.Speed]: 80,
    },
    types: [Types.Ice, Types.Ground],
    abilities: [Abilities.Oblivious, Abilities.SnowCloak],
    // Slush Rush is this registry's rather than the mainline's: the
    // line reaches three abilities and needs four, and 80 Speed is
    // what holds 130 Attack back
    hiddenAbilities: [Abilities.ThickFat, Abilities.SlushRush],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 50,
    biomes: [Biome.Tundra, Biome.Glacier, Biome.AlpineTundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.AncientPower, Moves.MudSport, Moves.OdorSleuth, Moves.Peck, Moves.PowderSnow],
        4: [Moves.MudSport],
        8: [Moves.PowderSnow],
        13: [Moves.MudSlap],
        16: [Moves.Endure],
        20: [Moves.MudBomb],
        25: [Moves.Hail],
        28: [Moves.IceFang],
        32: [Moves.TakeDown],
        33: [Moves.DoubleHit],
        40: [Moves.Earthquake],
        48: [Moves.Mist],
        56: [Moves.Blizzard],
        65: [Moves.ScaryFace],
      },
      teachable: [
        Moves.AncientPower,
        Moves.Attract,
        Moves.Avalanche,
        Moves.Blizzard,
        Moves.Captivate,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.EarthPower,
        Moves.Earthquake,
        Moves.Endeavor,
        Moves.Endure,
        Moves.Facade,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.GigaImpact,
        Moves.Hail,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcyWind,
        Moves.IronHead,
        Moves.KnockOff,
        Moves.LightScreen,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.RainDance,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.Roar,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Sandstorm,
        Moves.SecretPower,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.StealthRock,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.Substitute,
        Moves.Superpower,
        Moves.Swagger,
        Moves.Toxic,
      ],
    },
  });
}
