import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// GSC TM/HM moves shared by both
const DUO_TEACHABLE = [
  Moves.Toxic,
  Moves.Fly,
  Moves.Strength,
  Moves.Earthquake,
  Moves.Psychic,
  Moves.ShadowBall,
  Moves.GigaDrain,
  Moves.DragonBreath,
  Moves.SteelWing,
  Moves.HyperBeam,
  Moves.ZapCannon,
  Moves.DoubleTeam,
  Moves.Rest,
  Moves.Snore,
  Moves.Curse,
  Moves.Protect,
  Moves.Detect,
  Moves.DreamEater,
  Moves.Nightmare,
  Moves.Endure,
  Moves.Swagger,
  Moves.SleepTalk,
  Moves.Return,
  Moves.Frustration,
  Moves.HiddenPower,
  Moves.RainDance,
  Moves.SunnyDay,
  Moves.Sandstorm,
  Moves.PsychUp,
  Moves.MudSlap,
  Moves.RockSmash,
  Moves.Roar,
  Moves.Swift,
  Moves.Thunder,
];

// Both learn the same list at the same levels, either side of their
// own signature move
const DUO_LEVEL = {
  11: [Moves.Safeguard],
  22: [Moves.Gust],
  33: [Moves.Recover],
  66: [Moves.Swift],
  77: [Moves.Whirlwind],
  88: [Moves.AncientPower],
  99: [Moves.FutureSight],
};

export default function registerTowerDuoSpecies(): void {
  registerSpecies(Species.Lugia, {
    dexNumber: 249,
    name: 'Lugia',
    category: 'Diving Pokemon',
    height: 5.2,
    weight: 216,
    family: Families.Lugia,
    stats: {
      [Stats.HP]: 106,
      [Stats.Attack]: 90,
      [Stats.Defense]: 130,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 154,
      [Stats.Speed]: 110,
    },
    types: [Types.Psychic, Types.Flying],
    abilities: [Abilities.Pressure],
    // Drizzle and Marvel Scale are this registry's rather than the
    // mainline's: a beat of its wings is a forty day storm, and it
    // sleeps at the bottom of the sea to keep from starting one
    hiddenAbilities: [Abilities.Multiscale, Abilities.Drizzle, Abilities.MarvelScale],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.DeepOcean, Biome.Ocean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Aeroblast],
        ...DUO_LEVEL,
        44: [Moves.HydroPump],
        55: [Moves.RainDance],
      },
      teachable: [
        ...DUO_TEACHABLE,
        Moves.Surf,
        Moves.Waterfall,
        Moves.Whirlpool,
        Moves.IcyWind,
        Moves.Blizzard,
        Moves.IronTail,
        Moves.Headbutt,
      ],
    },
  });

  registerSpecies(Species.HoOh, {
    dexNumber: 250,
    name: 'Ho-Oh',
    category: 'Rainbow Pokemon',
    height: 3.8,
    weight: 199,
    family: Families.HoOh,
    stats: {
      [Stats.HP]: 106,
      [Stats.Attack]: 130,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 154,
      [Stats.Speed]: 90,
    },
    types: [Types.Fire, Types.Flying],
    abilities: [Abilities.Pressure],
    // Healer and Drought are this registry's rather than the
    // mainline's: it brings back what died, and a rainbow wants the
    // sun behind it
    hiddenAbilities: [Abilities.Regenerator, Abilities.Healer, Abilities.Drought],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain, Biome.Volcano],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.SacredFire],
        ...DUO_LEVEL,
        44: [Moves.FireBlast],
        55: [Moves.SunnyDay],
      },
      teachable: [...DUO_TEACHABLE, Moves.FireBlast, Moves.SolarBeam, Moves.Flash],
    },
  });
}
