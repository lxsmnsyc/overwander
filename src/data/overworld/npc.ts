import { Items } from '../ids/items';
import type { Moves } from '../ids/moves';
import type { Species } from '../ids/species';
import { getLevelUpMoves } from '../species';

/**
 * The people who pass through a wandering-NPC landmark. The cell is
 * fixed by the chunk seed, the way every landmark is, but who is
 * standing on it is not: every six hours brings somebody else, so the
 * spot is a crossroads rather than a shop.
 *
 * Not all of them are there to help. A Team Rocket grunt is one of the
 * people a crossroads brings, which is why the stop is not a landmark
 * of its own: a player walking up to a wandering cell does not know
 * yet whether they have found a nurse or a fight
 */
const enum Npc {
  /**
   * Takes two compatible pokemon and a fee, and hands back an egg
   */
  Breeder = 0,
  /**
   * Takes an egg and a fee, and warms it half a walk's worth further
   * along than it already was
   */
  DaycareLady = 1,
  /**
   * Looks a party over and hands it back whole: health, statuses and
   * — for a shadow — the shadow itself. She charges nothing, and she
   * does it once per window
   */
  NurseJoy = 2,
  /**
   * Takes one pokemon and a fee, and hands it back thinking half
   * again as well of its owner as it did. The daycare lady's trade,
   * done on the pokemon rather than on the egg
   */
  Groomer = 3,
  /**
   * Carries a crate of balls and medicine and a purse, and is the
   * only one of them a player may deal with more than once while he
   * is standing there. What he sells is fixed for the window; what he
   * buys is anything the market puts a price on
   */
  Vendor = 4,
  /**
   * Takes a Heart Scale and puts back a move the pokemon learned by
   * levelling and has since lost. He is the only way a forgotten
   * level-up move ever comes back, and gold is no use to him
   */
  MoveReminder = 5,
  /**
   * Bars the cell and fights whoever accepts, with three shadows of
   * the biome's own. Beaten, they pay a purse and leave one of their
   * commoners behind; they are the one wanderer a player can lose to
   */
  RocketGrunt = 6,
}

export default Npc;

/**
 * Everyone who wanders, for uniform rolls over the variants
 */
export const NPCS: Npc[] = [
  Npc.Breeder,
  Npc.DaycareLady,
  Npc.NurseJoy,
  Npc.Groomer,
  Npc.Vendor,
  Npc.MoveReminder,
  Npc.RocketGrunt,
];

export const NPC_NAMES: Record<Npc, string> = {
  [Npc.Breeder]: 'Breeder',
  [Npc.DaycareLady]: 'Daycare Lady',
  [Npc.NurseJoy]: 'Nurse Joy',
  [Npc.Groomer]: 'Groomer',
  [Npc.Vendor]: 'Vendor',
  [Npc.MoveReminder]: 'Move Reminder',
  [Npc.RocketGrunt]: 'Team Rocket Grunt',
};

/**
 * What the breeder charges for an egg. It is dear on purpose: an egg
 * bred from two pokemon a player already owns inherits their stats,
 * which is worth more than anything a nest leaves lying around
 */
export const BREEDING_FEE = 5000;

/**
 * What the daycare lady charges to push an egg along
 */
export const DAYCARE_FEE = 2500;

/**
 * What the groomer charges. It is the daycare lady's price for the
 * daycare lady's trade: half of what is left, bought rather than
 * walked for
 */
export const GROOMING_FEE = 2500;

/**
 * How many pokemon Nurse Joy looks at in one visit. It is a party's
 * worth: she is what a player walks to between raids, not a way to put
 * a whole box right in one stop
 */
export const NURSE_CARE_LIMIT = 6;

/**
 * What the Move Reminder charges, and the only thing he takes. He is
 * the one wanderer whose price is not gold: a scale is dug out of the
 * ground and nothing sells one, so what paces him is walking rather
 * than a purse.
 *
 * One move costs **one** of them. There is no constant for the count
 * because there is no choice in it: `learnMove` spends a single item
 * whatever the item is, so a second figure here would only be
 * something to fall out of step with it
 */
export const REMINDER_FEE = Items.HeartScale;

/**
 * What the reminder can put back on a pokemon: everything its species
 * has learned by levelling up to its level, minus the ones it still
 * knows, in the order it learned them.
 *
 * The list is read off the **species standing in front of him** rather
 * than off any history of the pokemon, because there is no history to
 * read — a record stores the four moves it knows and nothing about the
 * ones it dropped. That makes the rule a simple one to say: he can
 * give back anything this species could have known by now.
 *
 * A pre-evolution's list is not walked. An evolved species relists the
 * moves its line starts with at level 1, which is where it actually
 * learns them, so the chain adds nothing but a way for a Charizard to
 * be offered a move a Charizard never learns
 */
export function getRecallableMoves(
  species: Species,
  level: number,
  known: Iterable<Moves>,
): Moves[] {
  const knows = new Set(known);

  return getLevelUpMoves(species, level).filter((move) => !knows.has(move));
}
