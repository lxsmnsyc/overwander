import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The bull that settles everything head first, and keeps the rest of
 * the herd at its back while it does
 */
export default function registerBouffalantSpecies(): void {
  registerSpecies(Species.Bouffalant, {
    dexNumber: 626,
    name: 'Bouffalant',
    category: 'Bash Buffalo Pokemon',
    height: 1.6,
    weight: 94.6,
    family: Families.Bouffalant,
    stats: {
      [Stats.HP]: 95,
      [Stats.Attack]: 110,
      [Stats.Defense]: 95,
      [Stats.SpecialAttack]: 40,
      [Stats.SpecialDefense]: 95,
      [Stats.Speed]: 55,
    },
    types: [Types.Normal],
    abilities: [Abilities.Reckless, Abilities.SapSipper],
    hiddenAbilities: [Abilities.Soundproof, Abilities.RockHead],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 45,
    // The open grass it charges through, by day
    biomes: [Biome.Grassland, Biome.Steppe],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Leer, Moves.Pursuit],
        6: [Moves.Rage],
        11: [Moves.FuryAttack],
        16: [Moves.HornAttack],
        21: [Moves.ScaryFace],
        26: [Moves.Revenge],
        31: [Moves.HeadCharge],
        36: [Moves.FocusEnergy],
        41: [Moves.Megahorn],
        46: [Moves.Reversal],
        51: [Moves.Thrash],
        56: [Moves.SwordsDance],
        61: [Moves.GigaImpact],
      },
      teachable: [
        Moves.AerialAce,
        Moves.Amnesia,
        Moves.Attract,
        Moves.Bulldoze,
        Moves.Cut,
        Moves.DoubleTeam,
        Moves.Earthquake,
        Moves.Endeavor,
        Moves.Facade,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.Headbutt,
        Moves.HiddenPower,
        Moves.IronHead,
        Moves.MudShot,
        Moves.MudSlap,
        Moves.Outrage,
        Moves.Payback,
        Moves.PoisonJab,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Retaliate,
        Moves.Return,
        Moves.RockClimb,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Round,
        Moves.SkullBash,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.Stomp,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Superpower,
        Moves.Surf,
        Moves.Swagger,
        Moves.SwordsDance,
        Moves.Taunt,
        Moves.Toxic,
        Moves.Uproar,
        Moves.WildCharge,
        Moves.WorkUp,
        Moves.ZenHeadbutt,
        Moves.Confide,
      ],
      egg: [Moves.Belch],
    },
  });
}
