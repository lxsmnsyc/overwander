import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Habitat, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by the whole family
const FAMILY_TEACHABLE = [
  Moves.AquaTail,
  Moves.Attract,
  Moves.Bounce,
  Moves.Confide,
  Moves.Cut,
  Moves.Dive,
  Moves.DoubleTeam,
  Moves.DragonPulse,
  Moves.Facade,
  Moves.FlashCannon,
  Moves.Frustration,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.IronTail,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.Round,
  Moves.Scald,
  Moves.SecretPower,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.SludgeWave,
  Moves.SmackDown,
  Moves.Snore,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Toxic,
  Moves.UTurn,
  Moves.Venoshock,
  Moves.WaterPulse,
  Moves.Waterfall,
];

// The shot it learns to fire, whichever size the claw is
const FAMILY_LEVEL = {
  1: [Moves.WaterGun, Moves.Splash],
  7: [Moves.WaterSport],
  9: [Moves.ViceGrip],
  12: [Moves.Bubble],
  16: [Moves.Flail],
  20: [Moves.BubbleBeam],
  25: [Moves.SwordsDance],
  30: [Moves.Crabhammer],
  34: [Moves.WaterPulse],
};

// The open water they shoot across, both stages alike
const FAMILY_BIOMES = [Biome.CoralReef, Biome.Ocean];

/**
 * The pistol shrimp. It fires water hard enough to crack a rock, and
 * the claw only gets bigger
 */
export default function registerClauncherSpecies(): void {
  registerSpecies(Species.Clauncher, {
    dexNumber: 692,
    evolvesInto: [
      {
        species: Species.Clawitzer,
        method: EvolutionMethod.Level,
        level: 37,
      },
    ],
    name: 'Clauncher',
    category: 'Water Gun Pokemon',
    height: 0.5,
    weight: 8.3,
    family: Families.Clauncher,
    stats: {
      [Stats.HP]: 50,
      [Stats.Attack]: 53,
      [Stats.Defense]: 62,
      [Stats.SpecialAttack]: 58,
      [Stats.SpecialDefense]: 63,
      [Stats.Speed]: 44,
    },
    types: [Types.Water],
    habitat: Habitat.Water,
    abilities: [Abilities.MegaLauncher],
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 225,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        39: [Moves.SmackDown],
        43: [Moves.AquaJet],
        48: [Moves.MuddyWater],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.AquaJet, Moves.Crabhammer, Moves.Endure, Moves.Entrainment, Moves.HelpingHand],
    },
  });
  registerSpecies(Species.Clawitzer, {
    dexNumber: 693,
    name: 'Clawitzer',
    category: 'Howitzer Pokemon',
    height: 1.3,
    weight: 35.3,
    family: Families.Clauncher,
    evolvesFrom: Species.Clauncher,
    stats: {
      [Stats.HP]: 71,
      [Stats.Attack]: 73,
      [Stats.Defense]: 88,
      [Stats.SpecialAttack]: 120,
      [Stats.SpecialDefense]: 89,
      [Stats.Speed]: 59,
    },
    types: [Types.Water],
    habitat: Habitat.Water,
    abilities: [Abilities.MegaLauncher],
    // All three are this line's invented fillers: the mainline gives
    // Clawitzer the launcher and nothing else
    hiddenAbilities: [Abilities.Sniper, Abilities.Analytic, Abilities.Torrent],
    eggGroups: [EggGroups.Water1, EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 55,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        1: [Moves.WaterGun, Moves.Splash, Moves.HealPulse],
        42: [Moves.SmackDown],
        47: [Moves.AquaJet],
        53: [Moves.MuddyWater],
        57: [Moves.DarkPulse],
        63: [Moves.DragonPulse],
        67: [Moves.AuraSphere],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.DarkPulse,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.ShadowBall,
        Moves.Liquidation,
        Moves.LaserFocus,
      ],
    },
  });
}
