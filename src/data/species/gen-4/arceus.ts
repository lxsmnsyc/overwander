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
 * The one that was there first, and the seventeen shapes a Plate puts
 * it in. Multitype is not battle machinery here: the shape carries
 * the type, so what an Arceus is is whichever stone it is holding
 */

// The one hundred moves every shape of it is taught
const ARCEUS_TEACHABLE = [
  Moves.AerialAce,
  Moves.AncientPower,
  Moves.AquaTail,
  Moves.Avalanche,
  Moves.Blizzard,
  Moves.BrickBreak,
  Moves.Brine,
  Moves.BulletSeed,
  Moves.CalmMind,
  Moves.ChargeBeam,
  Moves.Cut,
  Moves.DarkPulse,
  Moves.Defog,
  Moves.Dive,
  Moves.DoubleTeam,
  Moves.DracoMeteor,
  Moves.DragonClaw,
  Moves.DragonPulse,
  Moves.DreamEater,
  Moves.EarthPower,
  Moves.Earthquake,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Facade,
  Moves.FireBlast,
  Moves.Flamethrower,
  Moves.Flash,
  Moves.FlashCannon,
  Moves.Fly,
  Moves.FocusBlast,
  Moves.Frustration,
  Moves.FuryCutter,
  Moves.GigaDrain,
  Moves.GigaImpact,
  Moves.GrassKnot,
  Moves.Hail,
  Moves.HeatWave,
  Moves.HiddenPower,
  Moves.HyperBeam,
  Moves.IceBeam,
  Moves.IcyWind,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.IronTail,
  Moves.LastResort,
  Moves.LightScreen,
  Moves.MudSlap,
  Moves.NaturalGift,
  Moves.OminousWind,
  Moves.Outrage,
  Moves.Overheat,
  Moves.Payback,
  Moves.PoisonJab,
  Moves.Protect,
  Moves.PsychUp,
  Moves.Psychic,
  Moves.RainDance,
  Moves.Recycle,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.Roar,
  Moves.RockClimb,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RockTomb,
  Moves.Safeguard,
  Moves.Sandstorm,
  Moves.SecretPower,
  Moves.ShadowBall,
  Moves.ShadowClaw,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SilverWind,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.StealthRock,
  Moves.StoneEdge,
  Moves.Strength,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Surf,
  Moves.Swagger,
  Moves.Swift,
  Moves.SwordsDance,
  Moves.Thunder,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.Twister,
  Moves.WaterPulse,
  Moves.Waterfall,
  Moves.WillOWisp,
  Moves.XScissor,
  Moves.ZenHeadbutt,
];

/** The stats it has in every shape, which are the same six numbers */
const ARCEUS_STATS = {
  [Stats.HP]: 120,
  [Stats.Attack]: 120,
  [Stats.Defense]: 120,
  [Stats.SpecialAttack]: 120,
  [Stats.SpecialDefense]: 120,
  [Stats.Speed]: 120,
};

/** The level list every shape of it walks */
const ARCEUS_LEVELS = {
  1: [Moves.CosmicPower, Moves.NaturalGift, Moves.Punishment, Moves.SeismicToss],
  10: [Moves.Gravity],
  20: [Moves.EarthPower],
  30: [Moves.HyperVoice],
  40: [Moves.ExtremeSpeed],
  50: [Moves.Refresh],
  60: [Moves.FutureSight],
  70: [Moves.Recover],
  80: [Moves.HyperBeam],
  90: [Moves.PerishSong],
  100: [Moves.Judgment],
};

/** Each shape, and the type its own Plate paints it */
const ARCEUS_SHAPES: [species: Species, name: string, type: Types][] = [
  [Species.ArceusBug, 'Arceus Bug', Types.Bug],
  [Species.ArceusDark, 'Arceus Dark', Types.Dark],
  [Species.ArceusDragon, 'Arceus Dragon', Types.Dragon],
  [Species.ArceusElectric, 'Arceus Electric', Types.Electric],
  [Species.ArceusFighting, 'Arceus Fighting', Types.Fighting],
  [Species.ArceusFire, 'Arceus Fire', Types.Fire],
  [Species.ArceusFlying, 'Arceus Flying', Types.Flying],
  [Species.ArceusGhost, 'Arceus Ghost', Types.Ghost],
  [Species.ArceusGrass, 'Arceus Grass', Types.Grass],
  [Species.ArceusGround, 'Arceus Ground', Types.Ground],
  [Species.ArceusIce, 'Arceus Ice', Types.Ice],
  [Species.ArceusPoison, 'Arceus Poison', Types.Poison],
  [Species.ArceusPsychic, 'Arceus Psychic', Types.Psychic],
  [Species.ArceusRock, 'Arceus Rock', Types.Rock],
  [Species.ArceusSteel, 'Arceus Steel', Types.Steel],
  [Species.ArceusWater, 'Arceus Water', Types.Water],
  [Species.ArceusFairy, 'Arceus Fairy', Types.Fairy],
];

export default function registerArceusSpecies(): void {
  registerSpecies(Species.Arceus, {
    dexNumber: 493,
    name: 'Arceus',
    category: 'Alpha Pokemon',
    height: 3.2,
    weight: 320,
    family: Families.Arceus,
    stats: { ...ARCEUS_STATS },
    types: [Types.Normal],
    abilities: [Abilities.Multitype],
    // The other three are this registry's: standing in front of it is
    // expensive, it has an answer to whatever it is not wearing, and
    // whatever it is wearing it is entirely
    hiddenAbilities: [Abilities.MoldBreaker, Abilities.Filter, Abilities.Adaptability],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Mountain],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: { ...ARCEUS_LEVELS },
      teachable: [...ARCEUS_TEACHABLE],
    },
  });

  for (const [species, name, type] of ARCEUS_SHAPES) {
    registerSpecies(species, {
      dexNumber: 493,
      name,
      baseForm: false,
      // Worn rather than met: a Plate in its hands is what paints it,
      // so the dex fills the shape in the day the bare one is
      worn: true,
      category: 'Alpha Pokemon',
      height: 3.2,
      weight: 320,
      family: Families.Arceus,
      stats: { ...ARCEUS_STATS },
      types: [type],
      abilities: [Abilities.Multitype],
      hiddenAbilities: [],
      eggGroups: [EggGroups.NoEggsDiscovered],
      genderRatio: undefined,
      catchRate: 3,
      // Worn rather than met, so no pool stages one
      biomes: [],
      activeTimes: AnyTimeOfDay,
      learnSet: {
        level: { ...ARCEUS_LEVELS },
        teachable: [...ARCEUS_TEACHABLE],
      },
    });
  }
}
