import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.Acrobatics,
  Moves.Attract,
  Moves.Covet,
  Moves.Cut,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.Endeavor,
  Moves.Facade,
  Moves.FireBlast,
  Moves.FirePunch,
  Moves.FlameCharge,
  Moves.Flamethrower,
  Moves.Fling,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GastroAcid,
  Moves.GrassKnot,
  Moves.GunkShot,
  Moves.HeatWave,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.Incinerate,
  Moves.IronTail,
  Moves.KnockOff,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.Overheat,
  Moves.Payback,
  Moves.Protect,
  Moves.Recycle,
  Moves.Rest,
  Moves.Return,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.RolePlay,
  Moves.Round,
  Moves.SecretPower,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
  Moves.Uproar,
  Moves.WillOWisp,
  Moves.WorkUp,
  Moves.Confide,
];

/**
 * The fire monkey: the tuft on its head is the fire, and a Simisear
 * throws off enough of it to be felt across the room
 */
export default function registerPansearSpecies(): void {
  registerSpecies(Species.Pansear, {
    dexNumber: 513,
    evolvesInto: [
      {
        species: Species.Simisear,
        method: EvolutionMethod.UsedItem,
        item: Items.FireStone,
      },
    ],
    name: 'Pansear',
    category: 'High Temp Pokemon',
    height: 0.6,
    weight: 11,
    family: Families.Pansear,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 53,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 53,
      [Stats.SpecialDefense]: 48,
      [Stats.Speed]: 64,
    },
    types: [Types.Fire],
    abilities: [Abilities.Gluttony],
    hiddenAbilities: [Abilities.Blaze],
    eggGroups: [EggGroups.Field],
    // Seven males to every female, the way the whole trio is handed out
    genderRatio: [7, 1],
    catchRate: 190,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch, Moves.PlayNice],
        4: [Moves.Leer],
        7: [Moves.Lick],
        10: [Moves.Incinerate],
        13: [Moves.FurySwipes],
        16: [Moves.Yawn],
        19: [Moves.Bite],
        22: [Moves.FlameBurst],
        25: [Moves.Amnesia],
        28: [Moves.Fling],
        31: [Moves.Acrobatics],
        34: [Moves.FireBlast],
        37: [Moves.Recycle],
        40: [Moves.NaturalGift],
        43: [Moves.Crunch],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Astonish,
        Moves.Covet,
        Moves.FirePunch,
        Moves.FireSpin,
        Moves.FlareBlitz,
        Moves.HeatWave,
        Moves.LowKick,
        Moves.NastyPlot,
        Moves.RolePlay,
        Moves.Tickle,
        Moves.DisarmingVoice,
      ],
    },
  });
  registerSpecies(Species.Simisear, {
    dexNumber: 514,
    name: 'Simisear',
    category: 'Ember Pokemon',
    height: 1,
    weight: 28,
    family: Families.Pansear,
    evolvesFrom: Species.Pansear,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 98,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 98,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 101,
    },
    types: [Types.Fire],
    abilities: [Abilities.Gluttony],
    // The line reaches only two, so both of the last slots are
    // invented: Flash Fire is the monkey drinking its own element, and
    // Moxie is what 98 Attack at 101 Speed is built to do
    hiddenAbilities: [Abilities.Blaze, Abilities.FlashFire, Abilities.Moxie],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 75,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      // A stone evolution learns nothing further on its own, beyond
      // the heat it comes into
      level: {
        1: [Moves.Leer, Moves.Lick, Moves.FurySwipes, Moves.FlameBurst],
        10: [Moves.FlameCharge],
        28: [Moves.Amnesia],
        46: [Moves.Overheat],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BrickBreak,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.RockSlide,
        Moves.Superpower,
        Moves.PowerUpPunch,
      ],
    },
  });
}
