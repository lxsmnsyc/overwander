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
 * What an Electabuzz becomes with the current to spare: an Electivire
 * puts both tails on whatever it is hitting and lets go
 */
export default function registerElectivireSpecies(): void {
  registerSpecies(Species.Electivire, {
    dexNumber: 466,
    name: 'Electivire',
    category: 'Thunderbolt Pokemon',
    height: 1.8,
    weight: 138.6,
    family: Families.Electabuzz,
    evolvesFrom: Species.Electabuzz,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 123,
      [Stats.Defense]: 67,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 95,
    },
    types: [Types.Electric],
    abilities: [Abilities.MotorDrive],
    // Iron Fist is this registry's rather than the mainline's: the
    // line reaches three abilities and needs four, and it fights in
    // punches with 123 Attack behind them
    hiddenAbilities: [Abilities.VitalSpirit, Abilities.IronFist],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 30,
    biomes: [Biome.Grassland, Biome.Steppe, Biome.Savanna],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.FirePunch, Moves.Leer, Moves.LowKick, Moves.QuickAttack, Moves.ThunderShock],
        7: [Moves.ThunderShock],
        10: [Moves.LowKick],
        16: [Moves.Swift],
        19: [Moves.ShockWave],
        25: [Moves.LightScreen],
        28: [Moves.ThunderPunch],
        37: [Moves.Discharge],
        43: [Moves.Thunderbolt],
        52: [Moves.Screech],
        58: [Moves.Thunder],
        67: [Moves.GigaImpact],
      },
      teachable: [
        Moves.Attract,
        Moves.BrickBreak,
        Moves.Captivate,
        Moves.ChargeBeam,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Facade,
        Moves.FirePunch,
        Moves.Flamethrower,
        Moves.Flash,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.FocusPunch,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IcePunch,
        Moves.IronTail,
        Moves.LightScreen,
        Moves.MagnetRise,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.ShockWave,
        Moves.SignalBeam,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Strength,
        Moves.Substitute,
        Moves.Swagger,
        Moves.Swift,
        Moves.Taunt,
        Moves.Thief,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Torment,
        Moves.Toxic,
      ],
    },
  });
}
