import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The prince of the sea and what its egg comes to. Phione is not an
 * evolution and never becomes a Manaphy: it is what a Manaphy lays,
 * which is the only way one is ever met
 */

// Everything Phione is taught, which Manaphy is taught as well
const SEA_TEACHABLE = [
  Moves.AncientPower,
  Moves.Blizzard,
  Moves.Bounce,
  Moves.Brine,
  Moves.Dive,
  Moves.DoubleTeam,
  Moves.Endure,
  Moves.Facade,
  Moves.Fling,
  Moves.Frustration,
  Moves.GrassKnot,
  Moves.Hail,
  Moves.HelpingHand,
  Moves.HiddenPower,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.KnockOff,
  Moves.LastResort,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.Protect,
  Moves.PsychUp,
  Moves.RainDance,
  Moves.Rest,
  Moves.Return,
  Moves.Safeguard,
  Moves.SecretPower,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.Substitute,
  Moves.Surf,
  Moves.Swagger,
  Moves.Swift,
  Moves.Toxic,
  Moves.UTurn,
  Moves.Uproar,
  Moves.WaterPulse,
  Moves.Waterfall,
];

export default function registerManaphySpecies(): void {
  registerSpecies(Species.Phione, {
    dexNumber: 489,
    name: 'Phione',
    category: 'Sea Drifter Pokemon',
    height: 0.4,
    weight: 3.1,
    family: Families.Manaphy,
    stats: {
      [Stats.HP]: 80,
      [Stats.Attack]: 80,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 80,
      [Stats.SpecialDefense]: 80,
      [Stats.Speed]: 80,
    },
    types: [Types.Water],
    abilities: [Abilities.Hydration],
    // The other three are this registry's: it goes where the water
    // goes, and the sac on its head is what keeps it up
    hiddenAbilities: [Abilities.SwiftSwim, Abilities.RainDish, Abilities.StormDrain],
    eggGroups: [EggGroups.Water1, EggGroups.Fairy],
    genderRatio: undefined,
    catchRate: 30,
    biomes: [Biome.Ocean, Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.WaterSport],
        9: [Moves.Charm],
        16: [Moves.Supersonic],
        24: [Moves.BubbleBeam],
        31: [Moves.AcidArmor],
        39: [Moves.Whirlpool],
        46: [Moves.WaterPulse],
        54: [Moves.AquaRing],
        61: [Moves.Dive],
        69: [Moves.RainDance],
      },
      teachable: [...SEA_TEACHABLE],
    },
  });
  registerSpecies(Species.Manaphy, {
    dexNumber: 490,
    name: 'Manaphy',
    category: 'Seafaring Pokemon',
    height: 0.3,
    weight: 1.4,
    family: Families.Manaphy,
    // Its egg is a Phione and never another Manaphy, which is what
    // the mainline does and the only way to a Phione at all
    eggSpecies: Species.Phione,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 100,
      [Stats.Defense]: 100,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 100,
    },
    types: [Types.Water],
    abilities: [Abilities.Hydration],
    // The other three are this registry's: the sea does it no harm,
    // and Heart Swap is a bond read two ways
    hiddenAbilities: [Abilities.WaterAbsorb, Abilities.Healer, Abilities.FriendGuard],
    eggGroups: [EggGroups.Water1, EggGroups.Fairy],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.DeepOcean],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Bubble, Moves.TailGlow, Moves.WaterSport],
        9: [Moves.Charm],
        16: [Moves.Supersonic],
        24: [Moves.BubbleBeam],
        31: [Moves.AcidArmor],
        39: [Moves.Whirlpool],
        46: [Moves.WaterPulse],
        54: [Moves.AquaRing],
        61: [Moves.Dive],
        69: [Moves.RainDance],
        76: [Moves.HeartSwap],
      },
      teachable: [
        ...SEA_TEACHABLE,
        Moves.CalmMind,
        Moves.EnergyBall,
        Moves.Flash,
        Moves.GigaImpact,
        Moves.HyperBeam,
        Moves.LightScreen,
        Moves.Psychic,
        Moves.Reflect,
        Moves.ShadowBall,
        Moves.SkillSwap,
      ],
    },
  });
}
