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
 * A Magmar with its arms rebuilt as cannons: a Magmortar fires a ball
 * of its own fire and steps back from the heat
 */
export default function registerMagmortarSpecies(): void {
  registerSpecies(Species.Magmortar, {
    dexNumber: 467,
    name: 'Magmortar',
    category: 'Blast Pokemon',
    height: 1.6,
    weight: 68.0,
    family: Families.Magmar,
    evolvesFrom: Species.Magmar,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 95,
      [Stats.Defense]: 67,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 83,
    },
    types: [Types.Fire],
    abilities: [Abilities.FlameBody],
    // Flash Fire and Solar Power are this registry's rather than the
    // mainline's: the line reaches two abilities and needs four, and
    // both are what a cannon that runs on its own heat would have
    hiddenAbilities: [Abilities.VitalSpirit, Abilities.FlashFire, Abilities.SolarPower],
    eggGroups: [EggGroups.HumanLike],
    genderRatio: [3, 1],
    catchRate: 30,
    biomes: [Biome.Volcano, Biome.Badlands, Biome.Desert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Ember, Moves.Leer, Moves.Smog, Moves.SmokeScreen, Moves.ThunderPunch],
        7: [Moves.Ember],
        10: [Moves.SmokeScreen],
        16: [Moves.FeintAttack],
        19: [Moves.FireSpin],
        25: [Moves.ConfuseRay],
        28: [Moves.FirePunch],
        37: [Moves.LavaPlume],
        43: [Moves.Flamethrower],
        52: [Moves.SunnyDay],
        58: [Moves.FireBlast],
        67: [Moves.HyperBeam],
      },
      teachable: [
        Moves.Attract,
        Moves.BrickBreak,
        Moves.Captivate,
        Moves.DoubleTeam,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Facade,
        Moves.FireBlast,
        Moves.FirePunch,
        Moves.Flamethrower,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.FocusPunch,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HeatWave,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IronTail,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Overheat,
        Moves.Protect,
        Moves.Psychic,
        Moves.Rest,
        Moves.Return,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Thief,
        Moves.ThunderPunch,
        Moves.Thunderbolt,
        Moves.Torment,
        Moves.Toxic,
        Moves.WillOWisp,
      ],
    },
  });
}
