import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerPolitoedSpecies(): void {
  registerSpecies(Species.Politoed, {
    dexNumber: 186,
    name: 'Politoed',
    category: 'Frog Pokemon',
    height: 1.1,
    weight: 33.9,
    family: Families.Poliwag,
    evolvesFrom: Species.Poliwhirl,
    stats: {
      [Stats.HP]: 90,
      [Stats.Attack]: 75,
      [Stats.Defense]: 75,
      [Stats.SpecialAttack]: 90,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 70,
    },
    types: [Types.Water],
    abilities: [Abilities.WaterAbsorb, Abilities.Damp],
    hiddenAbilities: [Abilities.Drizzle],
    eggGroups: [EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.DoubleSlap, Moves.Hypnosis, Moves.PerishSong, Moves.WaterGun],
        35: [Moves.PerishSong],
        51: [Moves.Swagger],
      },
      teachable: [
        Moves.Attract,
        Moves.Blizzard,
        Moves.Curse,
        Moves.DefenseCurl,
        Moves.Detect,
        Moves.DoubleTeam,
        Moves.DynamicPunch,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcePunch,
        Moves.IcyWind,
        Moves.MudSlap,
        Moves.Protect,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Strength,
        Moves.Surf,
        Moves.Swagger,
        Moves.Thief,
        Moves.Toxic,
        Moves.Waterfall,
        Moves.Whirlpool,
      ],
    },
  });
}
