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
 * A hundred and eight spirits pressed into one keystone for what
 * they did, and still in it
 */
export default function registerSpiritombSpecies(): void {
  registerSpecies(Species.Spiritomb, {
    dexNumber: 442,
    name: 'Spiritomb',
    category: 'Forbidden Pokemon',
    height: 1.0,
    weight: 108.0,
    family: Families.Spiritomb,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 92,
      [Stats.Defense]: 108,
      [Stats.SpecialAttack]: 92,
      [Stats.SpecialDefense]: 108,
      [Stats.Speed]: 35,
    },
    types: [Types.Ghost, Types.Dark],
    abilities: [Abilities.Pressure],
    // Infiltrator is the mainline's hidden one; the other two are
    // this registry's, and both are the stone rather than the ghost:
    // it reaches back out, and nobody it is holding gets to leave
    hiddenAbilities: [Abilities.Infiltrator, Abilities.CursedBody, Abilities.ShadowTag],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 100,
    biomes: [Biome.Badlands, Biome.Bog, Biome.Woodland],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.ConfuseRay, Moves.Curse, Moves.Pursuit, Moves.ShadowSneak, Moves.Spite],
        7: [Moves.FeintAttack],
        13: [Moves.Hypnosis],
        19: [Moves.DreamEater],
        25: [Moves.OminousWind],
        31: [Moves.SuckerPunch],
        37: [Moves.NastyPlot],
        43: [Moves.Memento],
        49: [Moves.DarkPulse],
      },
      teachable: [
        Moves.Attract,
        Moves.CalmMind,
        Moves.Captivate,
        Moves.DarkPulse,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Embargo,
        Moves.Endure,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IcyWind,
        Moves.NaturalGift,
        Moves.OminousWind,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SilverWind,
        Moves.SleepTalk,
        Moves.Snatch,
        Moves.Snore,
        Moves.Spite,
        Moves.Substitute,
        Moves.SuckerPunch,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Thief,
        Moves.Torment,
        Moves.Toxic,
        Moves.Trick,
        Moves.Uproar,
        Moves.WaterPulse,
        Moves.WillOWisp,
      ],
    },
  });
}
