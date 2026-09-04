import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerCelebiSpecies(): void {
  registerSpecies(Species.Celebi, {
    dexNumber: 251,
    name: 'Celebi',
    category: 'Time Travel Pokemon',
    height: 0.6,
    weight: 5,
    family: Families.Celebi,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 100,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 100,
    },
    types: [Types.Psychic, Types.Grass],
    abilities: [Abilities.NaturalCure],
    // Anticipation, Regenerator and Healer are this registry's rather
    // than the mainline's: it arrives already knowing, and the forest
    // it has been in comes back
    hiddenAbilities: [Abilities.Anticipation, Abilities.Regenerator, Abilities.Healer],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 45,
    biomes: [Biome.TemperateForest],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Confusion, Moves.HealBell, Moves.LeechSeed, Moves.Recover],
        10: [Moves.Safeguard],
        20: [Moves.AncientPower],
        30: [Moves.FutureSight],
        40: [Moves.BatonPass],
        50: [Moves.PerishSong],
      },
      teachable: [
        Moves.Toxic,
        Moves.Psychic,
        Moves.SolarBeam,
        Moves.GigaDrain,
        Moves.ShadowBall,
        Moves.HyperBeam,
        Moves.Flash,
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
        Moves.DefenseCurl,
        Moves.SweetScent,
        Moves.Swift,
      ],
    },
  });
}
