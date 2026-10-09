import { Types } from '../constants/types';
import { Moves } from '../ids/moves';
import { Species } from '../ids/species';
import { maxPowerOf } from './max-moves';

/**
 * The G-Max Moves: what a Gigantamax throws in place of the Max Move
 * of one type. The battle side is in `src/battle/moves/gmax-moves.ts`
 * https://bulbapedia.bulbagarden.net/wiki/G-Max_Move
 */

/** Each species with a Gigantamax form, with its G-Max Move and that move's type */
export const GMAX_SPECIES = new Map<Species, { move: Moves; type: Types }>([
  [Species.Venusaur, { move: Moves.GMaxVineLash, type: Types.Grass }],
  [Species.Charizard, { move: Moves.GMaxWildfire, type: Types.Fire }],
  [Species.Blastoise, { move: Moves.GMaxCannonade, type: Types.Water }],
  [Species.Butterfree, { move: Moves.GMaxBefuddle, type: Types.Bug }],
  [Species.Pikachu, { move: Moves.GMaxVoltCrash, type: Types.Electric }],
  // The Kantonian one only: neither regional Meowth has a Gigantamax form
  [Species.Meowth, { move: Moves.GMaxGoldRush, type: Types.Normal }],
  [Species.Machamp, { move: Moves.GMaxChiStrike, type: Types.Fighting }],
  [Species.Gengar, { move: Moves.GMaxTerror, type: Types.Ghost }],
  [Species.Kingler, { move: Moves.GMaxFoamBurst, type: Types.Water }],
  [Species.Lapras, { move: Moves.GMaxResonance, type: Types.Ice }],
  [Species.Eevee, { move: Moves.GMaxCuddle, type: Types.Normal }],
  [Species.Snorlax, { move: Moves.GMaxReplenish, type: Types.Normal }],
  [Species.Garbodor, { move: Moves.GMaxMalodor, type: Types.Poison }],
  [Species.Melmetal, { move: Moves.GMaxMeltdown, type: Types.Steel }],
  [Species.Rillaboom, { move: Moves.GMaxDrumSolo, type: Types.Grass }],
  [Species.Cinderace, { move: Moves.GMaxFireball, type: Types.Fire }],
  [Species.Inteleon, { move: Moves.GMaxHydrosnipe, type: Types.Water }],
  [Species.Corviknight, { move: Moves.GMaxWindRage, type: Types.Flying }],
  [Species.Orbeetle, { move: Moves.GMaxGravitas, type: Types.Psychic }],
  [Species.Drednaw, { move: Moves.GMaxStonesurge, type: Types.Water }],
  // Not registered yet: the row is ready for the day Coalossal lands
  [Species.Coalossal, { move: Moves.GMaxVolcalith, type: Types.Rock }],
  [Species.Flapple, { move: Moves.GMaxTartness, type: Types.Grass }],
  [Species.Appletun, { move: Moves.GMaxSweetness, type: Types.Grass }],
  [Species.Sandaconda, { move: Moves.GMaxSandblast, type: Types.Ground }],
  [Species.Toxtricity, { move: Moves.GMaxStunShock, type: Types.Electric }],
  [Species.ToxtricityLowKey, { move: Moves.GMaxStunShock, type: Types.Electric }],
  [Species.Centiskorch, { move: Moves.GMaxCentiferno, type: Types.Fire }],
  [Species.Hatterene, { move: Moves.GMaxSmite, type: Types.Fairy }],
  [Species.Grimmsnarl, { move: Moves.GMaxSnooze, type: Types.Dark }],
  [Species.Alcremie, { move: Moves.GMaxFinale, type: Types.Fairy }],
  [Species.AlcremieBerry, { move: Moves.GMaxFinale, type: Types.Fairy }],
  [Species.AlcremieLove, { move: Moves.GMaxFinale, type: Types.Fairy }],
  [Species.AlcremieStar, { move: Moves.GMaxFinale, type: Types.Fairy }],
  [Species.AlcremieClover, { move: Moves.GMaxFinale, type: Types.Fairy }],
  [Species.AlcremieFlower, { move: Moves.GMaxFinale, type: Types.Fairy }],
  [Species.AlcremieRibbon, { move: Moves.GMaxFinale, type: Types.Fairy }],
  // Not registered yet, like Coalossal
  [Species.Copperajah, { move: Moves.GMaxSteelsurge, type: Types.Steel }],
  [Species.Duraludon, { move: Moves.GMaxDepletion, type: Types.Dragon }],
  [Species.Urshifu, { move: Moves.GMaxOneBlow, type: Types.Dark }],
  [Species.UrshifuRapidStrike, { move: Moves.GMaxRapidFlow, type: Types.Water }],
]);

/** Every G-Max Move. None of them is learned, copied, called or remembered */
export const G_MAX_MOVES = new Set<Moves>();

for (const { move } of GMAX_SPECIES.values()) {
  G_MAX_MOVES.add(move);
}

/** Whether a species has a Gigantamax form, which is what Max Mushrooms ask */
export function canGigantamax(species: Species): boolean {
  return GMAX_SPECIES.has(species);
}

/**
 * The G-Max Move a Gigantamax of this species throws for a damaging
 * move of this type, or null where its Max Move stays the plain one
 */
export function getGMaxMove(species: Species, type: Types): Moves | null {
  const entry = GMAX_SPECIES.get(species);

  return entry?.type === type ? entry.move : null;
}

/** The three that hit at 160 whatever they replace, and through any ability */
export const FIXED_G_MAX_MOVES = new Set<Moves>([
  Moves.GMaxDrumSolo,
  Moves.GMaxFireball,
  Moves.GMaxHydrosnipe,
]);

/**
 * What a G-Max Move hits with for the move it replaces: the Max Move
 * table, so the two never disagree. No move known at all reads as the
 * table's lowest
 */
export function gMaxPowerOf(base: Moves | undefined, type: Types): number {
  if (base != null) {
    return maxPowerOf(base);
  }
  return type === Types.Fighting || type === Types.Poison ? 70 : 90;
}
