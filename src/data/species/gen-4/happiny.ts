import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay, TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * A Chansey before it has an egg to carry: a Happiny finds a round
 * white stone instead and will not be told the difference
 */
export default function registerHappinySpecies(): void {
  registerSpecies(Species.Happiny, {
    dexNumber: 440,
    evolvesInto: [
      {
        species: Species.Chansey,
        method: EvolutionMethod.Level | EvolutionMethod.HeldItem | EvolutionMethod.TimeOfDay,
        level: 15,
        item: Items.OvalStone,
        time: TimeOfDay.Morning | TimeOfDay.Day,
      },
    ],
    name: 'Happiny',
    category: 'Playhouse Pokemon',
    height: 0.6,
    weight: 24.4,
    family: Families.Chansey,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 5,
      [Stats.Defense]: 5,
      [Stats.SpecialAttack]: 15,
      [Stats.SpecialDefense]: 65,
      [Stats.Speed]: 30,
    },
    types: [Types.Normal],
    abilities: [Abilities.NaturalCure, Abilities.SereneGrace],
    hiddenAbilities: [Abilities.FriendGuard],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [0, 1],
    catchRate: 130,
    biomes: [Biome.Grassland, Biome.Shrubland, Biome.TemperateForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Charm, Moves.Pound],
        5: [Moves.Copycat],
        9: [Moves.Refresh],
        12: [Moves.SweetKiss],
      },
      teachable: [
        Moves.Attract,
        Moves.Captivate,
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
        Moves.Frustration,
        Moves.GrassKnot,
        Moves.Hail,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.IcyWind,
        Moves.LastResort,
        Moves.LightScreen,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Recycle,
        Moves.Rest,
        Moves.Return,
        Moves.Rollout,
        Moves.Safeguard,
        Moves.SecretPower,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.ThunderWave,
        Moves.Toxic,
        Moves.Uproar,
        Moves.WaterPulse,
        Moves.ZenHeadbutt,
      ],
      egg: [
        Moves.Aromatherapy,
        Moves.Counter,
        Moves.Gravity,
        Moves.HealBell,
        Moves.HelpingHand,
        Moves.LastResort,
        Moves.Metronome,
        Moves.Present,
        Moves.Substitute,
      ],
    },
  });
}
