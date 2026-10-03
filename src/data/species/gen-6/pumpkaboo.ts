import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { EvolutionMethod, Species } from '../../ids/species';
import { registerSpecies } from '../__create';

// TM, HM and tutor moves shared by every size
const FAMILY_TEACHABLE = [
  Moves.AllySwitch,
  Moves.Attract,
  Moves.BulletSeed,
  Moves.ChargeBeam,
  Moves.Confide,
  Moves.DarkPulse,
  Moves.DoubleTeam,
  Moves.DreamEater,
  Moves.Endure,
  Moves.EnergyBall,
  Moves.Explosion,
  Moves.Facade,
  Moves.FireBlast,
  Moves.FlameCharge,
  Moves.Flamethrower,
  Moves.Flash,
  Moves.FoulPlay,
  Moves.Frustration,
  Moves.GigaDrain,
  Moves.GrassKnot,
  Moves.GyroBall,
  Moves.Hex,
  Moves.HiddenPower,
  Moves.Imprison,
  Moves.Incinerate,
  Moves.LightScreen,
  Moves.MagicCoat,
  Moves.MysticalFire,
  Moves.NaturePower,
  Moves.PainSplit,
  Moves.Protect,
  Moves.Psychic,
  Moves.Rest,
  Moves.Return,
  Moves.RockSlide,
  Moves.RockSmash,
  Moves.RolePlay,
  Moves.Round,
  Moves.Safeguard,
  Moves.ScaryFace,
  Moves.SecretPower,
  Moves.SeedBomb,
  Moves.ShadowBall,
  Moves.SkillSwap,
  Moves.SleepTalk,
  Moves.SludgeBomb,
  Moves.Snore,
  Moves.SolarBeam,
  Moves.Spite,
  Moves.Substitute,
  Moves.SunnyDay,
  Moves.Swagger,
  Moves.Synthesis,
  Moves.Telekinesis,
  Moves.Thief,
  Moves.Toxic,
  Moves.Trick,
  Moves.TrickRoom,
  Moves.WillOWisp,
  Moves.WorrySeed,
];

// What every size learns, however big the pumpkin grew
const FAMILY_LEVEL = {
  11: [Moves.WorrySeed],
  12: [Moves.RazorLeaf],
  16: [Moves.LeechSeed],
  20: [Moves.BulletSeed],
  32: [Moves.SeedBomb],
  36: [Moves.ShadowBall],
  42: [Moves.PainSplit],
};

// The fields and hedges the pumpkins sit in after dark
const FAMILY_BIOMES = [Biome.Grassland, Biome.Woodland];

/**
 * How big the pumpkin grew, which it keeps for life: a bigger one is
 * slower and harder to finish. The small and large sizes wait until
 * their grown shapes are drawn, so two of the four are here
 */
const SIZES: {
  pumpkaboo: Species;
  gourgeist: Species;
  name: string;
  pumpkaboo_hp: number;
  pumpkaboo_speed: number;
  pumpkaboo_size: [height: number, weight: number];
  gourgeist_hp: number;
  gourgeist_attack: number;
  gourgeist_speed: number;
  gourgeist_size: [height: number, weight: number];
}[] = [
  {
    pumpkaboo: Species.Pumpkaboo,
    gourgeist: Species.Gourgeist,
    name: '',
    pumpkaboo_hp: 49,
    pumpkaboo_speed: 51,
    pumpkaboo_size: [0.4, 5.0],
    gourgeist_hp: 65,
    gourgeist_attack: 90,
    gourgeist_speed: 84,
    gourgeist_size: [0.9, 12.5],
  },
  {
    pumpkaboo: Species.PumpkabooSuper,
    gourgeist: Species.GourgeistSuper,
    name: 'Super',
    pumpkaboo_hp: 59,
    pumpkaboo_speed: 41,
    pumpkaboo_size: [0.8, 15.0],
    gourgeist_hp: 85,
    gourgeist_attack: 100,
    gourgeist_speed: 54,
    gourgeist_size: [1.7, 39.0],
  },
];

export default function registerPumpkabooSpecies(): void {
  // One pumpkin under every size, so each is registered off the same
  // shape rather than written out again
  for (const size of SIZES) {
    const plain = size.pumpkaboo === Species.Pumpkaboo;
    const named = (stage: string): string => (plain ? stage : `${size.name} ${stage}`);

    registerSpecies(size.pumpkaboo, {
      dexNumber: 710,
      evolvesInto: [
        {
          species: size.gourgeist,
          method: EvolutionMethod.Trade,
        },
      ],
      name: named('Pumpkaboo'),
      category: 'Pumpkin Pokemon',
      height: size.pumpkaboo_size[0],
      weight: size.pumpkaboo_size[1],
      family: Families.Pumpkaboo,
      ...(plain ? {} : { baseForm: false }),
      stats: {
        [Stats.HP]: size.pumpkaboo_hp,
        [Stats.Attack]: 66,
        [Stats.Defense]: 70,
        [Stats.SpecialAttack]: 44,
        [Stats.SpecialDefense]: 55,
        [Stats.Speed]: size.pumpkaboo_speed,
      },
      types: [Types.Ghost, Types.Grass],
      abilities: [Abilities.Pickup, Abilities.Frisk],
      hiddenAbilities: [Abilities.Insomnia],
      eggGroups: [EggGroups.Amorphous],
      genderRatio: [1, 1],
      catchRate: 120,
      biomes: [...FAMILY_BIOMES],
      activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
      learnSet: {
        level: {
          1: [Moves.Astonish, Moves.ConfuseRay, Moves.Trick, Moves.TrickOrTreat],
          4: [Moves.ScaryFace, Moves.ShadowSneak],
          ...FAMILY_LEVEL,
        },
        teachable: [...FAMILY_TEACHABLE],
        egg: [Moves.Bestow, Moves.Curse, Moves.DestinyBond, Moves.Disable],
      },
    });
    registerSpecies(size.gourgeist, {
      dexNumber: 711,
      name: named('Gourgeist'),
      category: 'Pumpkin Pokemon',
      height: size.gourgeist_size[0],
      weight: size.gourgeist_size[1],
      family: Families.Pumpkaboo,
      evolvesFrom: size.pumpkaboo,
      ...(plain ? {} : { baseForm: false }),
      stats: {
        [Stats.HP]: size.gourgeist_hp,
        [Stats.Attack]: size.gourgeist_attack,
        [Stats.Defense]: 122,
        [Stats.SpecialAttack]: 58,
        [Stats.SpecialDefense]: 75,
        [Stats.Speed]: size.gourgeist_speed,
      },
      types: [Types.Ghost, Types.Grass],
      abilities: [Abilities.Pickup, Abilities.Frisk],
      // Cursed Body is this line's invented filler, and Trevenant's as
      // well: the two the versions keep apart answer a move the same way
      hiddenAbilities: [Abilities.Insomnia, Abilities.CursedBody],
      eggGroups: [EggGroups.Amorphous],
      genderRatio: [1, 1],
      catchRate: 60,
      biomes: [...FAMILY_BIOMES],
      activeTimes: TimeOfDay.Evening | TimeOfDay.Night,
      learnSet: {
        level: {
          1: [
            Moves.Astonish,
            Moves.ConfuseRay,
            Moves.Trick,
            Moves.TrickOrTreat,
            Moves.ScaryFace,
            Moves.ShadowSneak,
            Moves.Explosion,
            Moves.Moonblast,
            Moves.PhantomForce,
          ],
          ...FAMILY_LEVEL,
        },
        teachable: [
          ...FAMILY_TEACHABLE,
          Moves.FocusBlast,
          Moves.GigaImpact,
          Moves.HyperBeam,
          Moves.NastyPlot,
          Moves.PhantomForce,
          Moves.PowerWhip,
        ],
      },
    });
  }
}
