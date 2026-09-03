import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by all three birds
const BIRD_TEACHABLE = [
  Moves.Toxic,
  Moves.RazorWind,
  Moves.Whirlwind,
  Moves.TakeDown,
  Moves.DoubleEdge,
  Moves.HyperBeam,
  Moves.Rage,
  Moves.Mimic,
  Moves.DoubleTeam,
  Moves.Reflect,
  Moves.Bide,
  Moves.Swift,
  Moves.SkyAttack,
  Moves.Rest,
  Moves.Substitute,
  Moves.Fly,
  Moves.Roar,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.MudSlap,
  Moves.Detect,
  Moves.Sandstorm,
  Moves.Endure,
  Moves.Swagger,
  Moves.SteelWing,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.SunnyDay,
  Moves.RockSmash,
];

export default function registerLegendaryBirdSpecies(): void {
  registerSpecies(Species.Articuno, {
    dexNumber: 144,
    name: 'Articuno',
    category: 'Freeze Pokemon',
    height: 1.7,
    weight: 55.4,
    family: Families.Articuno,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 85,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 95,
      [Stats.SpecialDefense]: 125,
      [Stats.Speed]: 85,
    },
    types: [Types.Ice, Types.Flying],
    abilities: [Abilities.Pressure],
    hiddenAbilities: [Abilities.SnowCloak, Abilities.IceBody, Abilities.SnowWarning],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Glacier, Biome.AlpineTundra, Biome.PolarOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.IceBeam, Moves.Gust, Moves.PowderSnow],
        13: [Moves.Mist],
        25: [Moves.Agility],
        37: [Moves.MindReader],
        51: [Moves.Blizzard],
        61: [Moves.Reflect],
        85: [Moves.SheerCold],
      },
      teachable: [
        ...BIRD_TEACHABLE,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.BubbleBeam,
        Moves.WaterGun,
        Moves.Surf,
        Moves.IcyWind,

        Moves.AerialAce,
        Moves.Facade,
        Moves.SecretPower,
        Moves.WaterPulse,
      ],
    },
  });

  registerSpecies(Species.Zapdos, {
    dexNumber: 145,
    name: 'Zapdos',
    category: 'Electric Pokemon',
    height: 1.6,
    weight: 52.6,
    family: Families.Zapdos,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 90,
      [Stats.Defense]: 85,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 100,
    },
    types: [Types.Electric, Types.Flying],
    abilities: [Abilities.Pressure],
    hiddenAbilities: [Abilities.Static, Abilities.LightningRod, Abilities.Drizzle],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.ThunderShock, Moves.DrillPeck, Moves.Peck],
        13: [Moves.ThunderWave],
        25: [Moves.Agility],
        37: [Moves.Detect],
        51: [Moves.Thunder],
        60: [Moves.LightScreen],
        61: [Moves.Charge],
      },
      teachable: [
        ...BIRD_TEACHABLE,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.ThunderWave,
        Moves.Flash,
        Moves.ZapCannon,

        Moves.AerialAce,
        Moves.Facade,
        Moves.SecretPower,
        Moves.ShockWave,
      ],
    },
  });

  registerSpecies(Species.Moltres, {
    dexNumber: 146,
    name: 'Moltres',
    category: 'Flame Pokemon',
    height: 2,
    weight: 60,
    family: Families.Moltres,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 100,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 125,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 90,
    },
    types: [Types.Fire, Types.Flying],
    abilities: [Abilities.Pressure],
    hiddenAbilities: [Abilities.FlameBody, Abilities.Drought, Abilities.FlashFire],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain, Biome.Desert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Peck, Moves.FireSpin, Moves.WingAttack, Moves.Ember],
        25: [Moves.Agility],
        37: [Moves.Endure],
        49: [Moves.Flamethrower],
        51: [Moves.Leer],
        60: [Moves.SkyAttack],
        61: [Moves.Safeguard],
        73: [Moves.HeatWave],
      },
      teachable: [
        ...BIRD_TEACHABLE,
        Moves.FireBlast,
        Moves.Flamethrower,
        Moves.AerialAce,
        Moves.Facade,
        Moves.Overheat,
        Moves.SecretPower,
      ],
    },
  });
}
