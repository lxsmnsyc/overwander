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
 * A bug that died three hundred million years ago, dug up and fitted
 * with a cannon. The four Drives are held rather than used: each one
 * loads the cannon with a different element and repaints the machine
 * around it
 */

const GENESECT_STATS = {
  [Stats.HP]: 71,
  [Stats.Attack]: 120,
  [Stats.Defense]: 95,
  [Stats.SpecialAttack]: 120,
  [Stats.SpecialDefense]: 95,
  [Stats.Speed]: 99,
};

const GENESECT_LEVELS = {
  1: [
    Moves.QuickAttack,
    Moves.Screech,
    Moves.FuryCutter,
    Moves.MetalClaw,
    Moves.MagnetRise,
    Moves.TechnoBlast,
  ],
  11: [Moves.LockOn],
  18: [Moves.FlameCharge],
  22: [Moves.MagnetBomb],
  29: [Moves.Slash],
  33: [Moves.MetalSound],
  40: [Moves.SignalBeam],
  42: [Moves.XScissor],
  44: [Moves.TriAttack],
  55: [Moves.BugBuzz],
  62: [Moves.SimpleBeam],
  66: [Moves.ZapCannon],
  73: [Moves.HyperBeam],
  77: [Moves.SelfDestruct],
};

const GENESECT_TEACHABLE = [
  Moves.AerialAce,
  Moves.AllySwitch,
  Moves.Assurance,
  Moves.BlazeKick,
  Moves.Blizzard,
  Moves.BugBite,
  Moves.BugBuzz,
  Moves.ChargeBeam,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.Electroweb,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Explosion,
  Moves.Facade,
  Moves.FlameCharge,
  Moves.Flamethrower,
  Moves.Flash,
  Moves.FlashCannon,
  Moves.Fly,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GigaImpact,
  Moves.Gravity,
  Moves.GunkShot,
  Moves.HiddenPower,
  Moves.HoneClaws,
  Moves.HyperBeam,
  Moves.IceBeam,
  Moves.IronDefense,
  Moves.IronHead,
  Moves.LastResort,
  Moves.LeechLife,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.MagnetRise,
  Moves.Protect,
  Moves.Psychic,
  Moves.Recycle,
  Moves.Reflect,
  Moves.Rest,
  Moves.Return,
  Moves.RockPolish,
  Moves.Round,
  Moves.Screech,
  Moves.SecretPower,
  Moves.SelfDestruct,
  Moves.ShadowClaw,
  Moves.ShockWave,
  Moves.SignalBeam,
  Moves.SleepTalk,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.StruggleBug,
  Moves.Substitute,
  Moves.Swagger,
  Moves.Swift,
  Moves.Telekinesis,
  Moves.Thunder,
  Moves.ThunderWave,
  Moves.Thunderbolt,
  Moves.Toxic,
  Moves.TriAttack,
  Moves.UTurn,
  Moves.XScissor,
  Moves.ZenHeadbutt,
];

/** Each cassette's shape. The machine stays Bug and Steel in all of
 * them: the Drive loads the cannon, it does not rebuild the bug */
const GENESECT_SHAPES: [species: Species, name: string][] = [
  [Species.GenesectDouse, 'Genesect Douse'],
  [Species.GenesectShock, 'Genesect Shock'],
  [Species.GenesectBurn, 'Genesect Burn'],
  [Species.GenesectChill, 'Genesect Chill'],
];

export default function registerGenesectSpecies(): void {
  registerSpecies(Species.Genesect, {
    dexNumber: 649,
    name: 'Genesect',
    category: 'Paleozoic Pokemon',
    height: 1.5,
    weight: 82.5,
    family: Families.Genesect,
    stats: { ...GENESECT_STATS },
    types: [Types.Bug, Types.Steel],
    abilities: [Abilities.Download],
    // Analytic, Synchronize and Adaptability are this registry's
    // rather than the mainline's: a machine reads what it is aimed
    // at, hands back whatever is done to it, and is built entirely
    // for the shot it was built for
    hiddenAbilities: [Abilities.Analytic, Abilities.Synchronize, Abilities.Adaptability],
    eggGroups: [EggGroups.NoEggsDiscovered],
    genderRatio: undefined,
    catchRate: 3,
    biomes: [Biome.Desert],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: { ...GENESECT_LEVELS },
      teachable: [...GENESECT_TEACHABLE],
    },
  });

  for (const [species, name] of GENESECT_SHAPES) {
    registerSpecies(species, {
      dexNumber: 649,
      name,
      baseForm: false,
      // Worn rather than met: a Drive in the slot is what repaints
      // it, so the dex fills the shape in the day the bare one is
      worn: true,
      category: 'Paleozoic Pokemon',
      height: 1.5,
      weight: 82.5,
      family: Families.Genesect,
      stats: { ...GENESECT_STATS },
      types: [Types.Bug, Types.Steel],
      abilities: [Abilities.Download],
      hiddenAbilities: [],
      eggGroups: [EggGroups.NoEggsDiscovered],
      genderRatio: undefined,
      catchRate: 3,
      // Worn rather than met, so no pool stages one
      biomes: [],
      activeTimes: AnyTimeOfDay,
      learnSet: {
        level: { ...GENESECT_LEVELS },
        teachable: [...GENESECT_TEACHABLE],
      },
    });
  }
}
