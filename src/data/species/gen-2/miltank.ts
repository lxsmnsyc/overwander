import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

export default function registerMiltankSpecies(): void {
  registerSpecies(Species.Miltank, {
    dexNumber: 241,
    name: 'Miltank',
    category: 'Milk Cow Pokemon',
    height: 1.2,
    weight: 75.5,
    family: Families.Miltank,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 80,
      [Stats.Defense]: 105,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 70,
      [Stats.Speed]: 100,
    },
    types: [Types.Normal],
    abilities: [Abilities.ThickFat, Abilities.Scrappy],
    // Serene Grace is this registry's rather than the mainline's,
    // filling it to four: Stomp and Body Slam are its own moves, and
    // it is fast enough to spend the flinch
    hiddenAbilities: [Abilities.SapSipper, Abilities.SereneGrace],
    eggGroups: [EggGroups.Field],
    genderRatio: [0, 1],
    catchRate: 45,
    biomes: [Biome.Grassland, Biome.Steppe, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Tackle],
        4: [Moves.Growl],
        8: [Moves.DefenseCurl],
        13: [Moves.Stomp],
        19: [Moves.MilkDrink],
        26: [Moves.Bide],
        34: [Moves.Rollout],
        43: [Moves.BodySlam],
        53: [Moves.HealBell],
      },
      teachable: [
        Moves.Toxic,
        Moves.IceBeam,
        Moves.Blizzard,
        Moves.IcyWind,
        Moves.Thunderbolt,
        Moves.Thunder,
        Moves.ZapCannon,
        Moves.ShadowBall,
        Moves.Surf,
        Moves.Earthquake,
        Moves.Sandstorm,
        Moves.SunnyDay,
        Moves.RainDance,
        Moves.HyperBeam,
        Moves.FirePunch,
        Moves.IcePunch,
        Moves.ThunderPunch,
        Moves.DynamicPunch,
        Moves.DoubleTeam,
        Moves.Rest,
        Moves.Snore,
        Moves.Curse,
        Moves.Protect,
        Moves.Endure,
        Moves.Rollout,
        Moves.Swagger,
        Moves.Attract,
        Moves.SleepTalk,
        Moves.Return,
        Moves.Frustration,
        Moves.HiddenPower,
        Moves.IronTail,
        Moves.DefenseCurl,
        Moves.Headbutt,
        Moves.MudSlap,
        Moves.RockSmash,
        Moves.Strength,
        Moves.PsychUp,
        Moves.SweetScent,
      ],
      egg: [Moves.Present, Moves.Reversal, Moves.SeismicToss],
    },
  });
}
