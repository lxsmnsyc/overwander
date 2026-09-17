import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AerialAce,
  Moves.Attract,
  Moves.Captivate,
  Moves.Cut,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Endure,
  Moves.Facade,
  Moves.Flash,
  Moves.Frustration,
  Moves.FuryCutter,
  Moves.Headbutt,
  Moves.HiddenPower,
  Moves.IronTail,
  Moves.KnockOff,
  Moves.LastResort,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Payback,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.ShockWave,
  Moves.SleepTalk,
  Moves.Snatch,
  Moves.Snore,
  Moves.Substitute,
  Moves.SuckerPunch,
  Moves.SunnyDay,
  Moves.SuperFang,
  Moves.Swagger,
  Moves.Swift,
  Moves.Taunt,
  Moves.Thief,
  Moves.Thunder,
  Moves.Thunderbolt,
  Moves.Torment,
  Moves.Toxic,
  Moves.UTurn,
  Moves.WaterPulse,
];

/**
 * The cat that purrs while it is being fed and claws the moment it is
 * not. A Purugly takes whatever nest it likes the look of and sleeps
 * in it
 */
export default function registerGlameowSpecies(): void {
  registerSpecies(Species.Glameow, {
    dexNumber: 431,
    evolvesInto: [
      {
        species: Species.Purugly,
        method: EvolutionMethod.Level,
        level: 38,
      },
    ],
    name: 'Glameow',
    category: 'Catty Pokemon',
    height: 0.5,
    weight: 3.9,
    family: Families.Glameow,
    stats: {
      [Stats.HP]: 49,
      [Stats.Attack]: 55,
      [Stats.Defense]: 42,
      [Stats.SpecialAttack]: 42,
      [Stats.SpecialDefense]: 37,
      [Stats.Speed]: 85,
    },
    types: [Types.Normal],
    abilities: [Abilities.Limber, Abilities.OwnTempo],
    hiddenAbilities: [Abilities.KeenEye],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 3],
    catchRate: 190,
    biomes: [Biome.Grassland, Biome.Shrubland, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.FakeOut],
        5: [Moves.Scratch],
        8: [Moves.Growl],
        13: [Moves.Hypnosis],
        17: [Moves.FeintAttack],
        20: [Moves.FurySwipes],
        25: [Moves.Charm],
        29: [Moves.Assist],
        32: [Moves.Captivate],
        37: [Moves.Slash],
        41: [Moves.SuckerPunch],
        45: [Moves.Attract],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Assurance,
        Moves.Bite,
        Moves.FakeTears,
        Moves.Flail,
        Moves.QuickAttack,
        Moves.SandAttack,
        Moves.TailWhip,
      ],
    },
  });
  registerSpecies(Species.Purugly, {
    dexNumber: 432,
    name: 'Purugly',
    category: 'Tiger Cat Pokemon',
    height: 1.0,
    weight: 43.8,
    family: Families.Glameow,
    evolvesFrom: Species.Glameow,
    stats: {
      [Stats.HP]: 71,
      [Stats.Attack]: 82,
      [Stats.Defense]: 64,
      [Stats.SpecialAttack]: 64,
      [Stats.SpecialDefense]: 59,
      [Stats.Speed]: 112,
    },
    types: [Types.Normal],
    abilities: [Abilities.ThickFat, Abilities.OwnTempo],
    hiddenAbilities: [Abilities.Defiant],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 3],
    catchRate: 75,
    biomes: [Biome.Grassland, Biome.Shrubland, Biome.Woodland],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.FakeOut, Moves.Growl, Moves.Scratch],
        5: [Moves.Scratch],
        8: [Moves.Growl],
        13: [Moves.Hypnosis],
        17: [Moves.FeintAttack],
        20: [Moves.FurySwipes],
        25: [Moves.Charm],
        29: [Moves.Assist],
        32: [Moves.Captivate],
        37: [Moves.Slash],
        38: [Moves.Swagger],
        45: [Moves.BodySlam],
        53: [Moves.Attract],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.Roar,
        Moves.Rollout,
      ],
    },
  });
}
