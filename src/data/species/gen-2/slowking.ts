import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerSlowkingSpecies(): void {
  registerSpecies(Species.Slowking, {
    dexNumber: 199,
    name: 'Slowking',
    category: 'Royal Pokemon',
    height: 2,
    weight: 79.5,
    family: Families.Slowpoke,
    evolvesFrom: Species.Slowpoke,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 75,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 110,
      [Stats.Speed]: 30,
    },
    types: [Types.Water, Types.Psychic],
    abilities: [Abilities.Oblivious, Abilities.OwnTempo],
    // Analytic is this registry's rather than the mainline's,
    // filling it to four: 30 Speed means it is always the one thinking
    // last
    hiddenAbilities: [Abilities.Regenerator, Abilities.Analytic],
    eggGroups: [EggGroups.Monster, EggGroups.Water1],
    genderRatio: [1, 1],
    catchRate: 70,
    biomes: [Biome.Beach, Biome.Swamp, Biome.Mangrove],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Curse, Moves.Tackle],
        6: [Moves.Growl],
        15: [Moves.WaterGun],
        20: [Moves.Confusion],
        29: [Moves.Disable],
        34: [Moves.Headbutt],
        43: [Moves.Swagger],
        48: [Moves.Psychic],
      },
      teachable: [
        Moves.Attract,
        Moves.Blizzard,
        Moves.Curse,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.DreamEater,
        Moves.DynamicPunch,
        Moves.Earthquake,
        Moves.Endure,
        Moves.FireBlast,
        Moves.Flamethrower,
        Moves.Flash,
        Moves.Frustration,
        Moves.FuryCutter,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IceBeam,
        Moves.IcePunch,
        Moves.IcyWind,
        Moves.IronTail,
        Moves.MudSlap,
        Moves.Nightmare,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Psychic,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.ShadowBall,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Strength,
        Moves.SunnyDay,
        Moves.Surf,
        Moves.Swagger,
        Moves.Swift,
        Moves.Toxic,
        Moves.Whirlpool,
        Moves.ZapCannon,
      ],
    },
  });
}
