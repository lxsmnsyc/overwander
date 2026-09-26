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
 * The poodle, in the coat it grows itself. The nine trims a groomer
 * cuts are held back until they are drawn, so there is one shape here
 * and the salon comes later
 */
export default function registerFurfrouSpecies(): void {
  registerSpecies(Species.Furfrou, {
    dexNumber: 676,
    name: 'Furfrou',
    category: 'Poodle Pokemon',
    height: 1.2,
    weight: 28.0,
    family: Families.Furfrou,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 80,
      [Stats.Defense]: 60,
      [Stats.SpecialAttack]: 65,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 102,
    },
    types: [Types.Normal],
    abilities: [Abilities.FurCoat],
    // All three are this line's invented fillers: the mainline gives
    // Furfrou nothing but Fur Coat
    hiddenAbilities: [Abilities.CuteCharm, Abilities.Scrappy, Abilities.QuickFeet],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 160,
    biomes: [Biome.Grassland, Biome.Woodland, Biome.Shrubland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day | TimeOfDay.Evening,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Growl],
        5: [Moves.SandAttack],
        9: [Moves.BabyDollEyes],
        12: [Moves.Headbutt],
        15: [Moves.TailWhip],
        22: [Moves.Bite],
        27: [Moves.OdorSleuth],
        33: [Moves.Retaliate],
        35: [Moves.TakeDown],
        38: [Moves.Charm],
        42: [Moves.SuckerPunch],
        48: [Moves.CottonGuard],
      },
      teachable: [
        Moves.Attract,
        Moves.ChargeBeam,
        Moves.Confide,
        Moves.DarkPulse,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.EchoedVoice,
        Moves.Endeavor,
        Moves.Facade,
        Moves.Flash,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HyperVoice,
        Moves.IronTail,
        Moves.LastResort,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Retaliate,
        Moves.Return,
        Moves.Roar,
        Moves.RockSmash,
        Moves.RolePlay,
        Moves.Round,
        Moves.SecretPower,
        Moves.SleepTalk,
        Moves.Snarl,
        Moves.Snore,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Surf,
        Moves.Swagger,
        Moves.ThunderWave,
        Moves.Toxic,
        Moves.UTurn,
        Moves.Uproar,
        Moves.WildCharge,
        Moves.ZenHeadbutt,
      ],
      egg: [Moves.Captivate, Moves.Mimic, Moves.Refresh, Moves.RolePlay, Moves.WorkUp],
    },
  });
}
