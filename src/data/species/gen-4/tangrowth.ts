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
 * A Tangela that stopped counting its vines: a Tangrowth grows two
 * arms out of the tangle and takes whatever comes near
 */
export default function registerTangrowthSpecies(): void {
  registerSpecies(Species.Tangrowth, {
    dexNumber: 465,
    name: 'Tangrowth',
    category: 'Vine Pokemon',
    height: 2.0,
    weight: 128.6,
    family: Families.Tangela,
    evolvesFrom: Species.Tangela,
    stats: {
      [Stats.HP]: 100,
      [Stats.Attack]: 100,
      [Stats.Defense]: 125,
      [Stats.SpecialAttack]: 110,
      [Stats.SpecialDefense]: 50,
      [Stats.Speed]: 50,
    },
    types: [Types.Grass],
    abilities: [Abilities.Chlorophyll, Abilities.LeafGuard],
    // Sap Sipper is this registry's rather than the mainline's: the
    // line reaches three abilities and needs four, and a ball of vines
    // feeds on what other plants throw at it
    hiddenAbilities: [Abilities.Regenerator, Abilities.SapSipper],
    eggGroups: [EggGroups.Grass],
    genderRatio: [1, 1],
    catchRate: 30,
    biomes: [Biome.TropicalRainforest, Biome.TemperateRainforest, Biome.Swamp],
    activeTimes: AnyTimeOfDay,
    learnSet: {
      level: {
        1: [Moves.Constrict, Moves.Ingrain],
        5: [Moves.SleepPowder],
        8: [Moves.Absorb],
        12: [Moves.Growth],
        15: [Moves.PoisonPowder],
        19: [Moves.VineWhip],
        22: [Moves.Bind],
        26: [Moves.MegaDrain],
        29: [Moves.StunSpore],
        33: [Moves.AncientPower],
        36: [Moves.KnockOff],
        40: [Moves.NaturalGift],
        43: [Moves.Slam],
        47: [Moves.Tickle],
        50: [Moves.WringOut],
        54: [Moves.PowerWhip],
        57: [Moves.Block],
      },
      teachable: [
        Moves.AerialAce,
        Moves.AncientPower,
        Moves.Attract,
        Moves.BrickBreak,
        Moves.BulletSeed,
        Moves.Captivate,
        Moves.Cut,
        Moves.DoubleTeam,
        Moves.Earthquake,
        Moves.Endure,
        Moves.EnergyBall,
        Moves.Facade,
        Moves.Flash,
        Moves.Fling,
        Moves.FocusBlast,
        Moves.Frustration,
        Moves.GigaDrain,
        Moves.GigaImpact,
        Moves.GrassKnot,
        Moves.HiddenPower,
        Moves.HyperBeam,
        Moves.KnockOff,
        Moves.MudSlap,
        Moves.NaturalGift,
        Moves.Payback,
        Moves.PoisonJab,
        Moves.Protect,
        Moves.PsychUp,
        Moves.Reflect,
        Moves.Rest,
        Moves.Return,
        Moves.RockSlide,
        Moves.RockSmash,
        Moves.RockTomb,
        Moves.SecretPower,
        Moves.SeedBomb,
        Moves.ShockWave,
        Moves.SleepTalk,
        Moves.SludgeBomb,
        Moves.Snore,
        Moves.SolarBeam,
        Moves.Strength,
        Moves.Substitute,
        Moves.SunnyDay,
        Moves.Swagger,
        Moves.SwordsDance,
        Moves.Synthesis,
        Moves.Thief,
        Moves.Toxic,
      ],
    },
  });
}
