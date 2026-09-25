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
 * The anteater: the flame at the end of its tongue is what it opens a
 * nest with, and the nest it opens is a Durant's
 */
export default function registerHeatmorSpecies(): void {
  registerSpecies(Species.Heatmor, {
    dexNumber: 631,
    name: 'Heatmor',
    category: 'Anteater Pokemon',
    height: 1.4,
    weight: 58,
    family: Families.Heatmor,
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 97,
      [Stats.Defense]: 66,
      [Stats.SpecialAttack]: 105,
      [Stats.SpecialDefense]: 66,
      [Stats.Speed]: 65,
    },
    types: [Types.Fire],
    abilities: [Abilities.Gluttony, Abilities.FlashFire],
    // Sheer Force is the invented fourth: the line reaches three, and
    // almost everything it throws carries a burn chance it can spend
    hiddenAbilities: [Abilities.WhiteSmoke, Abilities.SheerForce],
    eggGroups: [EggGroups.Field],
    genderRatio: [1, 1],
    catchRate: 90,
    // The same badlands the ants work, after they have gone in
    biomes: [Biome.Badlands, Biome.Volcano],
    activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
    learnSet: {
      level: {
        1: [Moves.Tackle, Moves.Lick, Moves.HoneClaws, Moves.Incinerate, Moves.Inferno],
        5: [Moves.FurySwipes],
        6: [Moves.OdorSleuth],
        11: [Moves.Bind],
        15: [Moves.BugBite],
        16: [Moves.FireSpin],
        20: [Moves.Stockpile, Moves.SpitUp, Moves.Swallow],
        25: [Moves.Slash],
        26: [Moves.Snatch],
        31: [Moves.FlameBurst],
        44: [Moves.Amnesia],
        47: [Moves.Flamethrower],
        60: [Moves.FlareBlitz],
      },
      teachable: [
        Moves.AerialAce,
        Moves.Amnesia,
        Moves.Attract,
        Moves.BodySlam,
        Moves.Cut,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.DrainPunch,
        Moves.Endure,
        Moves.Facade,
        Moves.FireBlast,
        Moves.FirePunch,
        Moves.FireSpin,
        Moves.FlareBlitz,
        Moves.Flamethrower,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.Frustration,
        Moves.GigaDrain,
        Moves.GigaImpact,
        Moves.HeatWave,
        Moves.HiddenPower,
        Moves.HoneClaws,
        Moves.Incinerate,
        Moves.LowKick,
        Moves.Overheat,
        Moves.Protect,
        Moves.RainDance,
        Moves.Rest,
        Moves.Return,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Round,
        Moves.SecretPower,
        Moves.ShadowClaw,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Superpower,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Thief,
        Moves.ThunderPunch,
        Moves.Toxic,
        Moves.WillOWisp,
      ],
      egg: [
        Moves.BodySlam,
        Moves.Curse,
        Moves.FeintAttack,
        Moves.HeatWave,
        Moves.NightSlash,
        Moves.Pursuit,
        Moves.SleepTalk,
        Moves.SuckerPunch,
        Moves.Tickle,
        Moves.Wrap,
      ],
    },
  });
}
