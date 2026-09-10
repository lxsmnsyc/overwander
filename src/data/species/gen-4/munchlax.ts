import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * A Snorlax that still has to look for its food: a Munchlax eats
 * whatever it finds and hides the rest in its fur
 */
export default function registerMunchlaxSpecies(): void {
  registerSpecies(Species.Munchlax, {
    dexNumber: 446,
    evolvesInto: [
      {
        species: Species.Snorlax,
        method: EvolutionMethod.Friendship,
      },
    ],
    name: 'Munchlax',
    category: 'Big Eater Pokemon',
    height: 0.6,
    weight: 105.0,
    family: Families.Snorlax,
    stats: {
      [Stats.HP]: 135,
      [Stats.Attack]: 85,
      [Stats.Defense]: 40,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 5,
    },
    types: [Types.Normal],
    abilities: [Abilities.Pickup, Abilities.ThickFat],
    hiddenAbilities: [Abilities.Gluttony],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: [7, 1],
    catchRate: 50,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.TropicalRainforest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Metronome, Moves.OdorSleuth, Moves.Tackle],
        4: [Moves.DefenseCurl],
        9: [Moves.Amnesia],
        12: [Moves.Lick],
        17: [Moves.Recycle],
        20: [Moves.Screech],
        25: [Moves.Stockpile],
        28: [Moves.Swallow],
        33: [Moves.BodySlam],
        36: [Moves.Fling],
        41: [Moves.Rollout],
        44: [Moves.NaturalGift],
        49: [Moves.LastResort],
      },
      teachable: [
        Moves.Attract,
        Moves.Blizzard,
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
        Moves.FocusPunch,
        Moves.Frustration,
        Moves.GunkShot,
        Moves.HiddenPower,
        Moves.IceBeam,
        Moves.IcePunch,
        Moves.IcyWind,
        Moves.LastResort,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Recycle,
        Moves.Rest,
        Moves.Return,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Rollout,
        Moves.Sandstorm,
        Moves.SecretPower,
        Moves.SeedBomb,
        Moves.ShadowBall,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Superpower,
        Moves.Surf,
        Moves.Swagger,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.Uproar,
        Moves.WaterPulse,
        Moves.ZenHeadbutt,
      ],
      egg: [
        Moves.Charm,
        Moves.Curse,
        Moves.DoubleEdge,
        Moves.Lick,
        Moves.Pursuit,
        Moves.Substitute,
        Moves.Whirlwind,
        Moves.ZenHeadbutt,
      ],
    },
  });
}
