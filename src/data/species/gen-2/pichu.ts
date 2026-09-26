import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { AnyTimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { type SpeciesData, registerSpecies } from '../__create';

const PICHU: SpeciesData = {
  dexNumber: 172,
  evolvesInto: [
    {
      species: Species.Pikachu,
      method: EvolutionMethod.Friendship,
    },
  ],
  name: 'Pichu',
  category: 'Tiny Mouse Pokemon',
  height: 0.3,
  weight: 2,
  family: Families.Pikachu,
  stats: {
    [Stats.HP]: 20,
    [Stats.Attack]: 40,
    [Stats.Defense]: 15,
    [Stats.SpecialAttack]: 35,
    [Stats.SpecialDefense]: 35,
    [Stats.Speed]: 60,
  },
  types: [Types.Electric],
  abilities: [Abilities.Static],
  hiddenAbilities: [Abilities.LightningRod],
  // A baby lays no egg of its own: the stage above it does
  eggGroups: [EggGroups.NoEggsDiscovered],
  genderRatio: [1, 1],
  catchRate: 190,
  biomes: [Biome.TemperateForest, Biome.Woodland],
  activeTimes: AnyTimeOfDay,
  learnSet: {
    level: {
      1: [Moves.Charm, Moves.ThunderShock],
      6: [Moves.TailWhip],
      8: [Moves.ThunderWave],
      11: [Moves.SweetKiss],
      18: [Moves.NastyPlot],
    },
    teachable: [
      Moves.Attract,
      Moves.Curse,
      Moves.DefenseCurl,
      Moves.Detect,
      Moves.DoubleTeam,
      Moves.Endure,
      Moves.Flash,
      Moves.Frustration,
      Moves.Headbutt,
      Moves.HiddenPower,
      Moves.IronTail,
      Moves.MudSlap,
      Moves.Protect,
      Moves.RainDance,
      Moves.Rest,
      Moves.Return,
      Moves.Rollout,
      Moves.SleepTalk,
      Moves.Snore,
      Moves.Swagger,
      Moves.Swift,
      Moves.Thunder,
      Moves.Thunderbolt,
      Moves.Toxic,
      Moves.ZapCannon,

      Moves.BodySlam,
      Moves.Counter,
      Moves.DoubleEdge,
      Moves.Facade,
      Moves.LightScreen,
      Moves.MegaKick,
      Moves.MegaPunch,
      Moves.Mimic,
      Moves.SecretPower,
      Moves.SeismicToss,
      Moves.ShockWave,
      Moves.Substitute,
      Moves.Captivate,
      Moves.ChargeBeam,
      Moves.Fling,
      Moves.GrassKnot,
      Moves.MagnetRise,
      Moves.NaturalGift,
      Moves.Round,
      Moves.EchoedVoice,
      Moves.VoltSwitch,
      Moves.WildCharge,
    ],
    egg: [
      Moves.Bide,
      Moves.DoubleSlap,
      Moves.Encore,
      Moves.Present,
      Moves.Reversal,
      Moves.Charge,
      Moves.VoltTackle,
      Moves.Wish,
      Moves.Bestow,
    ],
  },
};

export default function registerPichuSpecies(): void {
  registerSpecies(Species.Pichu, PICHU);
  registerSpecies(Species.PichuSpikyEared, {
    ...PICHU,
    name: 'Spiky-eared Pichu',
    baseForm: false,
    // Pichu's own spread, 65 higher in every stat
    stats: {
      [Stats.HP]: 85,
      [Stats.Attack]: 105,
      [Stats.Defense]: 80,
      [Stats.SpecialAttack]: 100,
      [Stats.SpecialDefense]: 100,
      [Stats.Speed]: 125,
    },
    // It never evolves, as in the games
    evolvesInto: undefined,
    // Met in Ilex Forest, where Celebi is, and only in the mythical band
    biomes: [Biome.TemperateForest],
    // Never hatched, so nothing is inherited
    learnSet: { ...PICHU.learnSet, egg: [] },
  });
}
