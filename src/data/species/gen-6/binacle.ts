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
  Moves.AerialAce,
  Moves.Attract,
  Moves.Blizzard,
  Moves.BrickBreak,
  Moves.Bulldoze,
  Moves.Confide,
  Moves.Cut,
  Moves.Dig,
  Moves.DoubleTeam,
  Moves.DualChop,
  Moves.Earthquake,
  Moves.Embargo,
  Moves.Endeavor,
  Moves.Facade,
  Moves.FalseSwipe,
  Moves.Fling,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.Infestation,
  Moves.IronDefense,
  Moves.NaturePower,
  Moves.Payback,
  Moves.PoisonJab,
  Moves.PowerUpPunch,
  Moves.Protect,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Round,
  Moves.Safeguard,
  Moves.Sandstorm,
  Moves.Scald,
  Moves.SecretPower,
  Moves.ShadowClaw,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.SludgeWave,
  Moves.SmackDown,
  Moves.Snore,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.SwordsDance,
  Moves.Taunt,
  Moves.Thief,
  Moves.Torment,
  Moves.Toxic,
  Moves.WaterPulse,
  Moves.XScissor,
  Moves.Liquidation,
];

// What both shapes learn on the way up
const FAMILY_LEVEL = {
  1: [Moves.Scratch, Moves.SandAttack, Moves.ShellSmash],
  4: [Moves.WaterGun],
  7: [Moves.Withdraw],
  10: [Moves.FurySwipes],
  13: [Moves.Slash],
  18: [Moves.MudSlap],
  20: [Moves.Clamp],
  24: [Moves.RockPolish],
  28: [Moves.AncientPower],
  32: [Moves.HoneClaws],
  37: [Moves.FuryCutter],
};

// The rocks they hold on to, above the tideline
const FAMILY_BIOMES = [Biome.RockyCoast, Biome.Beach];

/**
 * The two hands on a rock, and the seven that hold each other. A
 * Barbaracle is a Binacle's limbs grown into a crew, which is why it
 * argues with itself over where to walk
 */
export default function registerBinacleSpecies(): void {
  registerSpecies(Species.Binacle, {
    dexNumber: 688,
    evolvesInto: [
      {
        species: Species.Barbaracle,
        method: EvolutionMethod.Level,
        level: 39,
      },
    ],
    name: 'Binacle',
    category: 'Two-Handed Pokemon',
    height: 0.5,
    weight: 31.0,
    family: Families.Binacle,
    stats: {
      [Stats.HP]: 42,
      [Stats.Attack]: 52,
      [Stats.Defense]: 67,
      [Stats.SpecialAttack]: 39,
      [Stats.SpecialDefense]: 56,
      [Stats.Speed]: 50,
    },
    types: [Types.Rock, Types.Water],
    habitat: Habitat.Amphibious,
    abilities: [Abilities.ToughClaws, Abilities.Sniper],
    hiddenAbilities: [Abilities.Pickpocket],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 120,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        41: [Moves.NightSlash],
        45: [Moves.RazorShell],
        49: [Moves.CrossChop],
      },
      teachable: [...FAMILY_TEACHABLE],
      egg: [Moves.HelpingHand, Moves.Switcheroo, Moves.Tickle, Moves.WaterSport],
    },
  });
  registerSpecies(Species.Barbaracle, {
    dexNumber: 689,
    name: 'Barbaracle',
    category: 'Collective Pokemon',
    height: 1.3,
    weight: 96.0,
    family: Families.Binacle,
    evolvesFrom: Species.Binacle,
    stats: {
      [Stats.HP]: 72,
      [Stats.Attack]: 105,
      [Stats.Defense]: 115,
      [Stats.SpecialAttack]: 54,
      [Stats.SpecialDefense]: 86,
      [Stats.Speed]: 68,
    },
    types: [Types.Rock, Types.Water],
    habitat: Habitat.Amphibious,
    abilities: [Abilities.ToughClaws, Abilities.Sniper],
    // Solid Rock is this line's invented filler: the mainline gives
    // Barbaracle the three above and nothing else
    hiddenAbilities: [Abilities.Pickpocket, Abilities.SolidRock],
    eggGroups: [EggGroups.Water3],
    genderRatio: [1, 1],
    catchRate: 45,
    biomes: [...FAMILY_BIOMES],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        ...FAMILY_LEVEL,
        44: [Moves.NightSlash],
        48: [Moves.RazorShell],
        55: [Moves.CrossChop],
        60: [Moves.StoneEdge],
        65: [Moves.SkullBash],
      },
      teachable: [
        ...FAMILY_TEACHABLE,
        Moves.BulkUp,
        Moves.DragonClaw,
        Moves.EarthPower,
        Moves.FocusBlast,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.LowKick,
        Moves.Superpower,
        Moves.BrutalSwing,
        Moves.LaserFocus,
      ],
    },
  });
}
