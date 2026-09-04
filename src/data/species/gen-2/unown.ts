import { Stats } from '../../constants/stats';
import { Types } from '../../constants/types';
import Abilities from '../../ids/abilities';
import { AnyTimeOfDay, WILD_BIOMES } from '../../ids/biome';
import EggGroups from '../../ids/egg-groups';
import Families from '../../ids/families';
import { Moves } from '../../ids/moves';
import { UNOWN_FORMS, unownLetter } from '../../ids/species';
import { registerSpecies } from '../__create';

/**
 * The twenty-eight unowns, in alphabet order.
 *
 * The mainline gives the whole set one ability, Levitate, and one
 * move. What fills the other three slots is this registry's: two
 * every unown shares, and **one the shape itself stands for**, so a
 * letter is worth hunting for its own sake rather than for the
 * scoreboard. All three are hidden, the way an invented ability is,
 * so the ordinary roll is still a plain Levitate
 */

/**
 * Shared by all twenty-eight. Magic Guard because a written symbol is
 * unmarked by anything that is not a blow, and Pressure because a
 * ruin wall of them wears down whatever walks in
 */
const SHARED = [Abilities.MagicGuard, Abilities.Pressure];

/**
 * What each shape stands for, in alphabet order. **None of them is a
 * self-buff**: a letter is a thing an unown is, not a stat it wears,
 * so every one of these protects, reads, blocks or gives back rather
 * than raising anything.
 *
 * Most are the letter itself. Five stand for what the character means
 * instead: X, Y and Z start no ability the mainline has ever printed,
 * J's only one raises its own Attack, and the two marks are not
 * letters at all.
 *
 * - J, the hook, which will not be pulled loose
 * - X, the crossing-out: nobody's ability works
 * - Y, the wishbone: whoever pulls at it gets the loss back
 * - Z, the letter sleep is written in
 * - `!`, the shout that makes something back off
 * - `?`, the question already answered
 */
const SIGNATURES: Abilities[] = [
  Abilities.Anticipation,
  Abilities.BattleArmor,
  Abilities.CursedBody,
  Abilities.Damp,
  Abilities.EarlyBird,
  Abilities.Frisk,
  Abilities.Gluttony,
  Abilities.Harvest,
  Abilities.Illuminate,
  Abilities.SuctionCups,
  Abilities.KeenEye,
  Abilities.Limber,
  Abilities.Multiscale,
  Abilities.NaturalCure,
  Abilities.OwnTempo,
  Abilities.Prankster,
  Abilities.QueenlyMajesty,
  Abilities.Regenerator,
  Abilities.Synchronize,
  Abilities.Telepathy,
  Abilities.Unaware,
  Abilities.VitalSpirit,
  Abilities.WonderSkin,
  Abilities.NeutralizingGas,
  Abilities.MirrorArmor,
  Abilities.Comatose,
  Abilities.Intimidate,
  Abilities.Forewarn,
];

export default function registerUnownSpecies(): void {
  for (const [at, species] of UNOWN_FORMS.entries()) {
    const letter = unownLetter(species) ?? '';

    registerSpecies(species, {
      dexNumber: 201,
      name: at === 0 ? 'Unown' : `Unown ${letter}`,
      category: 'Symbol Pokemon',
      height: 0.5,
      weight: 5,
      family: Families.Unown,
      baseForm: at === 0 ? undefined : false,
      stats: {
        [Stats.HP]: 48,
        [Stats.Attack]: 72,
        [Stats.Defense]: 48,
        [Stats.SpecialAttack]: 72,
        [Stats.SpecialDefense]: 48,
        [Stats.Speed]: 48,
      },
      types: [Types.Psychic],
      abilities: [Abilities.Levitate],
      hiddenAbilities: [SIGNATURES[at], ...SHARED],
      eggGroups: [EggGroups.NoEggsDiscovered],
      genderRatio: undefined,
      catchRate: 225,
      // Everywhere, and rarely: an unown is drawn from the prized
      // band, so living in every biome is what makes one letter a
      // month rather than a walk to the right place
      biomes: WILD_BIOMES,
      activeTimes: AnyTimeOfDay,
      learnSet: {
        level: {
          1: [Moves.HiddenPower],
        },
        teachable: [],
      },
    });
  }
}
