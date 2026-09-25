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

/**
 * The dragon that was one and was torn in three: the white half that
 * kept the truth, the black half that kept the ideal, and the husk
 * the two were pulled out of, which has wanted them back ever since
 */

// TM and tutor moves all three share
const TAO_TEACHABLE = [
  Moves.Cut,
  Moves.DoubleTeam,
  Moves.DracoMeteor,
  Moves.DragonClaw,
  Moves.DragonPulse,
  Moves.DragonTail,
  Moves.EarthPower,
  Moves.EchoedVoice,
  Moves.Facade,
  Moves.Fling,
  Moves.Fly,
  Moves.FocusBlast,
  Moves.Frustration,
  Moves.GigaImpact,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.HyperBeam,
  Moves.HyperVoice,
  Moves.LightScreen,
  Moves.Outrage,
  Moves.Payback,
  Moves.Protect,
  Moves.Psychic,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Roost,
  Moves.Round,
  Moves.Safeguard,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Toxic,
  Moves.ZenHeadbutt,
];

// The husk's own machines and tutors, which its fused shapes keep
const KYUREM_TEACHABLE = [
  ...TAO_TEACHABLE,
  Moves.Blizzard,
  Moves.Endeavor,
  Moves.FlashCannon,
  Moves.Hail,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.IronHead,
  Moves.RainDance,
  Moves.SignalBeam,
  Moves.SunnyDay,
];

/** What the husk learns before either dragon is put into it */
const KYUREM_LEVELS: Record<number, Moves[]> = {
  1: [Moves.DragonRage, Moves.IcyWind],
  8: [Moves.Imprison],
  15: [Moves.AncientPower],
  22: [Moves.IceBeam],
  29: [Moves.DragonBreath],
  36: [Moves.Slash],
  43: [Moves.ScaryFace],
  50: [Moves.Glaciate],
  57: [Moves.DragonPulse],
  71: [Moves.Endeavor],
  78: [Moves.Blizzard],
  85: [Moves.Outrage],
  92: [Moves.HyperVoice],
};

/**
 * The two shapes a dragon folded into the husk puts it in. A fusion
 * is kept rather than worn, so each is a species of its own: it takes
 * the swallowed dragon's ability, its two attacking moves, and the
 * stats that dragon was built on
 */
const FUSIONS: {
  species: Species;
  name: string;
  height: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  ability: Abilities;
  gathered: Moves;
  loosed: Moves;
}[] = [
  {
    species: Species.KyuremBlack,
    name: 'Black Kyurem',
    height: 3.3,
    attack: 170,
    defense: 100,
    specialAttack: 120,
    specialDefense: 90,
    ability: Abilities.Teravolt,
    gathered: Moves.FusionBolt,
    loosed: Moves.FreezeShock,
  },
  {
    species: Species.KyuremWhite,
    name: 'White Kyurem',
    height: 3.6,
    attack: 120,
    defense: 90,
    specialAttack: 170,
    specialDefense: 100,
    ability: Abilities.Turboblaze,
    gathered: Moves.FusionFlare,
    loosed: Moves.IceBurn,
  },
];

export default function registerTaoTrioSpecies(): void {
  registerSpecies(Species.Reshiram, {
    dexNumber: 643,
    name: 'Reshiram',
    category: 'Vast White Pokemon',
    height: 3.2,
    weight: 330.0,
    family: Families.Reshiram,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 120,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 150,
      [Stats.SpecialDefense]: 120,
      [Stats.Speed]: 90,
    },
    types: [Types.Dragon, Types.Fire],
    abilities: [Abilities.Turboblaze],
    // Turboblaze is all the mainline gives it, so the other three are
    // this registry's: the fire it is made of, the weight a legendary
    // puts on a fight, and a flame that catches twice as often
    hiddenAbilities: [Abilities.FlashFire, Abilities.Pressure, Abilities.SereneGrace],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Taiga, Biome.Tundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.DragonRage, Moves.FireFang],
        8: [Moves.Imprison],
        15: [Moves.AncientPower],
        22: [Moves.Flamethrower],
        29: [Moves.DragonBreath],
        36: [Moves.Slash],
        43: [Moves.Extrasensory],
        50: [Moves.FusionFlare],
        54: [Moves.DragonPulse],
        71: [Moves.Crunch],
        78: [Moves.FireBlast],
        85: [Moves.Outrage],
        92: [Moves.HyperVoice],
        100: [Moves.BlueFlare],
      },
      teachable: [
        ...TAO_TEACHABLE,
        Moves.FireBlast,
        Moves.FlameCharge,
        Moves.Flamethrower,
        Moves.HeatWave,
        Moves.Incinerate,
        Moves.Overheat,
        Moves.SolarBeam,
        Moves.SunnyDay,
        Moves.Tailwind,
        Moves.WillOWisp,
      ],
    },
  });
  registerSpecies(Species.Zekrom, {
    dexNumber: 644,
    name: 'Zekrom',
    category: 'Deep Black Pokemon',
    height: 2.9,
    weight: 345.0,
    family: Families.Zekrom,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 150,
      [Stats.Defense]: 120,
      [Stats.SpecialAttack]: 120,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 90,
    },
    types: [Types.Dragon, Types.Electric],
    abilities: [Abilities.Teravolt],
    // Teravolt is all the mainline gives it, so the other three are
    // this registry's: the current it eats, the weight a legendary
    // puts on a fight, and a blow thrown without hedging it
    hiddenAbilities: [Abilities.MotorDrive, Abilities.Pressure, Abilities.SheerForce],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Taiga, Biome.Tundra],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.DragonRage, Moves.ThunderFang],
        8: [Moves.Imprison],
        15: [Moves.AncientPower],
        22: [Moves.Thunderbolt],
        29: [Moves.DragonBreath],
        36: [Moves.Slash],
        43: [Moves.ZenHeadbutt],
        50: [Moves.FusionBolt],
        54: [Moves.DragonClaw],
        71: [Moves.Crunch],
        78: [Moves.Thunder],
        85: [Moves.Outrage],
        92: [Moves.HyperVoice],
        100: [Moves.BoltStrike],
      },
      teachable: [
        ...TAO_TEACHABLE,
        Moves.ChargeBeam,
        Moves.Flash,
        Moves.FlashCannon,
        Moves.MagnetRise,
        Moves.RainDance,
        Moves.SignalBeam,
        Moves.Tailwind,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.VoltSwitch,
        Moves.WildCharge,
      ],
    },
  });
  registerSpecies(Species.Kyurem, {
    dexNumber: 646,
    name: 'Kyurem',
    category: 'Boundary Pokemon',
    height: 3.0,
    weight: 325.0,
    family: Families.Kyurem,
    stats: {
      [Stats.HP]: 125,
      [Stats.Attack]: 130,
      [Stats.Defense]: 90,
      [Stats.SpecialAttack]: 130,
      [Stats.SpecialDefense]: 90,
      [Stats.Speed]: 95,
    },
    types: [Types.Dragon, Types.Ice],
    abilities: [Abilities.Pressure],
    // Pressure is all the mainline gives it, so the other three are
    // this registry's: the cold it drags in, what that cold mends,
    // and the look that empties a room
    hiddenAbilities: [Abilities.SnowWarning, Abilities.IceBody, Abilities.Intimidate],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Tundra, Biome.Glacier],
    activeTimes: AnyTimeOfDay,
    // A dragon is folded into it with the splicers, and pulled back
    // out with the same pair
    evolvesInto: [
      {
        species: Species.KyuremBlack,
        method: EvolutionMethod.UsedItem,
        item: Items.DnaSplicers,
      },
      {
        species: Species.KyuremWhite,
        method: EvolutionMethod.UsedItem,
        item: Items.DnaSplicers,
      },
    ],
    learnSet: {
      level: KYUREM_LEVELS,
      teachable: [...KYUREM_TEACHABLE],
    },
  });

  for (const fusion of FUSIONS) {
    registerSpecies(fusion.species, {
      dexNumber: 646,
      name: fusion.name,
      category: 'Boundary Pokemon',
      height: fusion.height,
      weight: 325.0,
      family: Families.Kyurem,
      baseForm: false,
      evolvesFrom: Species.Kyurem,
      evolvesInto: [
        {
          species: Species.Kyurem,
          method: EvolutionMethod.UsedItem,
          item: Items.DnaSplicers,
        },
      ],
      stats: {
        [Stats.HP]: 125,
        [Stats.Attack]: fusion.attack,
        [Stats.Defense]: fusion.defense,
        [Stats.SpecialAttack]: fusion.specialAttack,
        [Stats.SpecialDefense]: fusion.specialDefense,
        [Stats.Speed]: 95,
      },
      types: [Types.Dragon, Types.Ice],
      abilities: [fusion.ability],
      eggGroups: [EggGroups.NoEggsDiscovered],
      genderRatio: undefined,
      catchRate: 3,
      // Fused into rather than met, so no pool stages one
      biomes: [],
      activeTimes: AnyTimeOfDay,
      learnSet: {
        level: {
          ...KYUREM_LEVELS,
          43: [fusion.gathered],
          50: [fusion.loosed],
        },
        teachable: [...KYUREM_TEACHABLE],
      },
    });
  }
}
