import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import Biome, { TimeOfDay } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { Species } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The iron ant: it nests in colonies and armours itself against the
 * one thing that comes for the nest, which is a Heatmor
 */
export default function registerDurantSpecies(): void {
  registerSpecies(Species.Durant, {
    dexNumber: 632,
    name: 'Durant',
    category: 'Iron Ant Pokemon',
    height: 0.3,
    weight: 33,
    family: Families.Durant,
    stats: {
      [Stats.HP]: 58,
      [Stats.Attack]: 109,
      [Stats.Defense]: 112,
      [Stats.SpecialAttack]: 48,
      [Stats.SpecialDefense]: 48,
      [Stats.Speed]: 109,
    },
    types: [Types.Bug, Types.Steel],
    abilities: [Abilities.Swarm, Abilities.Hustle],
    // Compound Eyes is the invented fourth: the line reaches three, and
    // it hands back the accuracy the Hustle beside it takes away
    hiddenAbilities: [Abilities.Truant, Abilities.CompoundEyes],
    eggGroups: [EggGroups.Bug],
    genderRatio: [1, 1],
    catchRate: 90,
    biomes: [Biome.Badlands, Biome.Mountain],
    activeTimes: TimeOfDay.Morning | TimeOfDay.Day,
    learnSet: {
      level: {
        1: [
          Moves.ViceGrip,
          Moves.Guillotine,
          Moves.SandAttack,
          Moves.Bite,
          Moves.FuryCutter,
          Moves.MetalSound,
          Moves.IronDefense,
        ],
        6: [Moves.Agility],
        8: [Moves.MetalClaw],
        12: [Moves.BeatUp],
        16: [Moves.BugBite],
        21: [Moves.Crunch],
        26: [Moves.IronHead],
        28: [Moves.Dig],
        32: [Moves.XScissor],
        36: [Moves.Entrainment],
      },
      teachable: [
        Moves.AerialAce,
        Moves.Agility,
        Moves.Attract,
        Moves.BatonPass,
        Moves.BeatUp,
        Moves.Crunch,
        Moves.Cut,
        Moves.Dig,
        Moves.DoubleTeam,
        Moves.Endure,
        Moves.EnergyBall,
        Moves.Facade,
        Moves.FlashCannon,
        Moves.Frustration,
        Moves.GigaImpact,
        Moves.HelpingHand,
        Moves.HiddenPower,
        Moves.HoneClaws,
        Moves.IronDefense,
        Moves.IronHead,
        Moves.Protect,
        Moves.Rest,
        Moves.Retaliate,
        Moves.Return,
        Moves.RockPolish,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.Round,
        Moves.Sandstorm,
        Moves.Screech,
        Moves.SecretPower,
        Moves.ShadowClaw,
        Moves.SleepTalk,
        Moves.Snore,
        Moves.StoneEdge,
        Moves.Strength,
        Moves.StruggleBug,
        Moves.Substitute,
        Moves.Superpower,
        Moves.Swagger,
        Moves.ThunderFang,
        Moves.ThunderWave,
        Moves.Toxic,
        Moves.XScissor,
        Moves.Confide,
      ],
      egg: [
        Moves.BatonPass,
        Moves.Endure,
        Moves.FeintAttack,
        Moves.Flail,
        Moves.MetalBurst,
        Moves.RockClimb,
        Moves.Screech,
        Moves.StruggleBug,
        Moves.ThunderFang,
      ],
    },
  });
}
