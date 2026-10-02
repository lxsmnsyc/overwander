import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Items } from '../../ids/items';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// Every shape learns the same, since each is the one Necrozma
const NECROZMA_LEVEL = {
  1: [
    Moves.ChargeBeam,
    Moves.Confusion,
    Moves.MetalClaw,
    Moves.MirrorShot,
    Moves.Moonlight,
    Moves.MorningSun,
  ],
  7: [Moves.Slash],
  13: [Moves.StoredPower],
  19: [Moves.RockBlast],
  23: [Moves.NightSlash],
  31: [Moves.Gravity],
  37: [Moves.PsychoCut],
  43: [Moves.PowerGem],
  47: [Moves.Autotomize],
  50: [Moves.PhotonGeyser],
  53: [Moves.StealthRock],
  59: [Moves.IronDefense],
  67: [Moves.WringOut],
  73: [Moves.PrismaticLaser],
};

const NECROZMA_TEACHABLE = [
  Moves.AerialAce,
  Moves.AllySwitch,
  Moves.BrickBreak,
  Moves.BrutalSwing,
  Moves.Bulldoze,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.Confide,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DragonPulse,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Embargo,
  Moves.Facade,
  Moves.FlashCannon,
  Moves.Fling,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.Gravity,
  Moves.GyroBall,
  Moves.HeatWave,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.HyperVoice,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.KnockOff,
  Moves.LightScreen,
  Moves.MagnetRise,
  Moves.Outrage,
  Moves.Protect,
  Moves.Psychic,
  Moves.Psyshock,
  Moves.Recycle,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockTomb,
  Moves.Round,
  Moves.ShadowClaw,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.SmartStrike,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Substitute,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.ThunderWave,
  Moves.Toxic,
  Moves.TrickRoom,
  Moves.XScissor,
];

/**
 * The prism that lost its light, the two shapes it takes with the sun
 * or the moon folded into it, and the one it bursts into to let the
 * light back out
 */
export default function registerNecrozmaSpecies(): void {
  registerSpecies(Species.Necrozma, {
    dexNumber: 800,
    evolvesInto: [
      {
        species: Species.NecrozmaDuskMane,
        method: EvolutionMethod.UsedItem,
        item: Items.NSolarizer,
      },
      {
        species: Species.NecrozmaDawnWings,
        method: EvolutionMethod.UsedItem,
        item: Items.NLunarizer,
      },
    ],
    name: 'Necrozma',
    category: 'Prism Pokemon',
    height: 2.4,
    weight: 230.0,
    family: Families.Necrozma,
    stats: {
      [Stats.HP]: 97,
      [Stats.Attack]: 107,
      [Stats.Defense]: 101,
      [Stats.SpecialAttack]: 127,
      [Stats.SpecialDefense]: 89,
      [Stats.Speed]: 79,
    },
    types: [Types.Psychic],
    abilities: [Abilities.PrismArmor],
    // Prism Armor is all the mainline gives it, so the other three are
    // this registry's
    hiddenAbilities: [Abilities.TintedLens, Abilities.MirrorArmor, Abilities.Levitate],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 255,
    biomes: [Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: NECROZMA_LEVEL,
      teachable: [...NECROZMA_TEACHABLE],
    },
  });

  registerSpecies(Species.NecrozmaDuskMane, {
    dexNumber: 800,
    name: 'Dusk Mane Necrozma',
    category: 'Prism Pokemon',
    height: 3.8,
    weight: 460.0,
    family: Families.Necrozma,
    baseForm: false,
    evolvesFrom: Species.Necrozma,
    evolvesInto: [
      {
        species: Species.Necrozma,
        method: EvolutionMethod.UsedItem,
        item: Items.NSolarizer,
      },
    ],
    stats: {
      [Stats.HP]: 97,
      [Stats.Attack]: 157,
      [Stats.Defense]: 127,
      [Stats.SpecialAttack]: 113,
      [Stats.SpecialDefense]: 109,
      [Stats.Speed]: 77,
    },
    types: [Types.Psychic, Types.Steel],
    abilities: [Abilities.PrismArmor],
    hiddenAbilities: [Abilities.TintedLens, Abilities.MirrorArmor, Abilities.Levitate],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 255,
    // Fused into rather than met, so no pool stages one
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: NECROZMA_LEVEL,
      teachable: [...NECROZMA_TEACHABLE],
    },
  });

  registerSpecies(Species.NecrozmaDawnWings, {
    dexNumber: 800,
    name: 'Dawn Wings Necrozma',
    category: 'Prism Pokemon',
    height: 4.2,
    weight: 350.0,
    family: Families.Necrozma,
    baseForm: false,
    evolvesFrom: Species.Necrozma,
    evolvesInto: [
      {
        species: Species.Necrozma,
        method: EvolutionMethod.UsedItem,
        item: Items.NLunarizer,
      },
    ],
    stats: {
      [Stats.HP]: 97,
      [Stats.Attack]: 113,
      [Stats.Defense]: 109,
      [Stats.SpecialAttack]: 157,
      [Stats.SpecialDefense]: 127,
      [Stats.Speed]: 77,
    },
    types: [Types.Psychic, Types.Ghost],
    abilities: [Abilities.PrismArmor],
    hiddenAbilities: [Abilities.TintedLens, Abilities.MirrorArmor, Abilities.Levitate],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 255,
    // Fused into rather than met, so no pool stages one
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: NECROZMA_LEVEL,
      teachable: [...NECROZMA_TEACHABLE],
    },
  });

  // Burst into for a fight by a fused shape holding its crystal, and
  // never kept
  registerSpecies(Species.NecrozmaUltra, {
    dexNumber: 800,
    name: 'Ultra Necrozma',
    category: 'Prism Pokemon',
    height: 7.5,
    weight: 230.0,
    family: Families.Necrozma,
    baseForm: false,
    worn: true,
    stats: {
      [Stats.HP]: 97,
      [Stats.Attack]: 167,
      [Stats.Defense]: 97,
      [Stats.SpecialAttack]: 167,
      [Stats.SpecialDefense]: 97,
      [Stats.Speed]: 129,
    },
    types: [Types.Psychic, Types.Dragon],
    abilities: [Abilities.PrismArmor],
    hiddenAbilities: [Abilities.TintedLens, Abilities.MirrorArmor, Abilities.Levitate],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 255,
    biomes: [],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: NECROZMA_LEVEL,
      teachable: [...NECROZMA_TEACHABLE],
    },
  });
}
