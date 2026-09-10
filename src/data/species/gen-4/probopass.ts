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
 * A Nosepass that grew a face of its own: a Probopass sends its three
 * small noses out and works whatever they find from where it stands
 */
export default function registerProbopassSpecies(): void {
  registerSpecies(Species.Probopass, {
    dexNumber: 476,
    name: 'Probopass',
    category: 'Compass Pokemon',
    height: 1.4,
    weight: 340.0,
    family: Families.Nosepass,
    evolvesFrom: Species.Nosepass,
    stats: {
      [Stats.HP]: 60,
      [Stats.Attack]: 55,
      [Stats.Defense]: 145,
      [Stats.SpecialAttack]: 75,
      [Stats.SpecialDefense]: 150,
      [Stats.Speed]: 40,
    },
    types: [Types.Rock, Types.Steel],
    abilities: [Abilities.Sturdy, Abilities.MagnetPull],
    // Levitate is this registry's rather than the mainline's: the
    // three small noses hang in the air around it, and Ground is the
    // worst thing a Rock and Steel type meets
    hiddenAbilities: [Abilities.SandForce, Abilities.Levitate],
    eggGroups: [EggGroups.Mineral],
    genderRatio: [1, 1],
    catchRate: 60,
    biomes: [Biome.Mountain, Biome.Badlands],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [
          Moves.Block,
          Moves.Gravity,
          Moves.IronDefense,
          Moves.MagnetBomb,
          Moves.MagnetRise,
          Moves.Tackle,
        ],
        7: [Moves.IronDefense],
        13: [Moves.MagnetBomb],
        19: [Moves.Block],
        25: [Moves.ThunderWave],
        31: [Moves.RockSlide],
        37: [Moves.Sandstorm],
        43: [Moves.Rest],
        49: [Moves.PowerGem],
        55: [Moves.Discharge],
        61: [Moves.StoneEdge],
        67: [Moves.ZapCannon],
        73: [Moves.LockOn],
        79: [Moves.EarthPower],
      },
      teachable: [
        Moves.AncientPower,
        Moves.Attract,
        Moves.Captivate,
        Moves.DoubleTeam,
        Moves.EarthPower,
        Moves.Earthquake,
        Moves.Endure,
        Moves.Explosion,
        Moves.Facade,
        Moves.FirePunch,
        Moves.FlashCannon,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.IcePunch,
        Moves.IronDefense,
        Moves.IronHead,
        Moves.MagnetRise,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Protect,
        Moves.Rest,
        Moves.Return,
        Moves.RockPolish,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Rollout,
        Moves.Sandstorm,
        Moves.SecretPower,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.StealthRock,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.Taunt,
        Moves.Thunder,
        Moves.ThunderPunch,
        Moves.ThunderWave,
        Moves.Thunderbolt,
        Moves.Torment,
        Moves.Toxic,
      ],
    },
  });
}
