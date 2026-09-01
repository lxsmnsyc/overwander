import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMisdreavusSpecies(): void {
  registerSpecies(Species.Misdreavus, {
    dexNumber: 200,
    name: 'Misdreavus',
    category: 'Screech Pokemon',
    height: 0.7,
    weight: 1,
    family: Families.Misdreavus,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 60,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 85,
      [Stats.SpecialDefense]: 85,
      [Stats.Speed]: 85,
    },
    types: [Types.Ghost],
    abilities: [Abilities.Levitate],
    eggGroups: [EggGroups.Amorphous],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [Biome.Mountain, Biome.Woodland, Biome.Badlands],
    activeTimes: TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Growl, Moves.Psywave],
        6: [Moves.Spite],
        12: [Moves.ConfuseRay],
        19: [Moves.MeanLook],
        27: [Moves.Psybeam],
        36: [Moves.PainSplit],
        46: [Moves.PerishSong],
      },
      teachable: [
        Moves.Attract,
        Moves.Curse,
        Moves.DefenseCurl,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.Endure,
        Moves.Flash,
        Moves.Frustration,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Swift,
        Moves.Thief,
        Moves.Thunder,
        Moves.Thunderbolt,
        Moves.Toxic,
        Moves.ZapCannon,
      ],
      egg: [Moves.DestinyBond, Moves.Screech],
    },
  });
}
