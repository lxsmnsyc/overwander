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
  Moves.EnergyBall,
  Moves.Facade,
  Moves.Flash,
  Moves.Fling,
  Moves.FocusPunch,
  Moves.Frustration,
  Moves.GastroAcid,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.GunkShot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.IronTail,
  Moves.KnockOff,
  Moves.LowKick,
  Moves.LowSweep,
  Moves.NaturePower,
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
  Moves.SeedBomb,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Synthesis,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
  Moves.Uproar,
  Moves.WorkUp,
  Moves.WorrySeed,
];

/**
 * The grass monkey: the leaf on its head is medicine to anybody who
 * eats it, and a Simisage swings the thorny tail it grows into
 */
export default function registerPansageSpecies(): void {
  registerSpecies(Species.Pansage, {
    dexNumber: 511,
    evolvesInto: [
      {
        species: Species.Simisage,
        method: EvolutionMethod.UsedItem,
        item: Items.LeafStone,
      },
    ],
    name: 'Pansage',
    category: 'Grass Monkey Pokemon',
    height: 0.6,
    weight: 10.5,
    family: Families.Pansage,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 53,
      [Stats.Defense]: 48,
      [Stats.SpecialAttack]: 53,
      [Stats.SpecialDefense]: 48,
      [Stats.Speed]: 64,
    },
    types: [Types.Grass],
    abilities: [Abilities.Gluttony],
    hiddenAbilities: [Abilities.Overgrow],
    eggGroups: [EggGroups.Field],
    // Seven males to every female, the way the whole trio is handed out
    genderRatio: [7, 1],
    catchRate: 190,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [Moves.Scratch],
        4: [Moves.Leer],
        7: [Moves.Lick],
        10: [Moves.VineWhip],
        13: [Moves.FurySwipes],
        16: [Moves.LeechSeed],
        19: [Moves.Bite],
        22: [Moves.SeedBomb],
        25: [Moves.Torment],
        28: [Moves.Fling],
        31: [Moves.Acrobatics],
        34: [Moves.GrassKnot],
        37: [Moves.Recycle],
        40: [Moves.NaturalGift],
        43: [Moves.Crunch],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [
        Moves.Astonish,
        Moves.BulletSeed,
        Moves.Covet,
        Moves.GrassWhistle,
        Moves.LeafStorm,
        Moves.LowKick,
        Moves.MagicalLeaf,
        Moves.NastyPlot,
        Moves.RolePlay,
        Moves.Tickle,
      ],
    },
  });
  registerSpecies(Species.Simisage, {
    dexNumber: 512,
    name: 'Simisage',
    category: 'Thorn Monkey Pokemon',
    height: 1.1,
    weight: 30.5,
    family: Families.Pansage,
    evolvesFrom: Species.Pansage,
    stats: {
      [Stats.HP]: 75,
      [Stats.Attack]: 98,
      [Stats.Defense]: 63,
      [Stats.SpecialAttack]: 98,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 101,
    },
    types: [Types.Grass],
    abilities: [Abilities.Gluttony],
    // The line reaches only two, so both of the last slots are
    // invented: Sap Sipper is the monkey drinking its own element, the
    // way its brothers do, and Harvest answers what Gluttony spends
    hiddenAbilities: [Abilities.Overgrow, Abilities.SapSipper, Abilities.Harvest],
    eggGroups: [EggGroups.Field],
    genderRatio: [7, 1],
    catchRate: 75,
    biomes: [Biome.TemperateForest, Biome.Woodland],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      // A stone evolution learns nothing further on its own, beyond
      // the thorns it comes into
      level: {
        1: [Moves.Leer, Moves.Lick, Moves.FurySwipes, Moves.SeedBomb],
        10: [Moves.VineWhip],
        28: [Moves.GigaDrain],
        46: [Moves.LeafStorm],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BrickBreak,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.RockSlide,
        Moves.Superpower,
      ],
    },
  });
}
