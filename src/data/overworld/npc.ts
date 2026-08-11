/**
 * The people who pass through a wandering-NPC landmark. The cell is
 * fixed by the chunk seed, the way every landmark is, but who is
 * standing on it is not: every six hours brings somebody else, so the
 * spot is a crossroads rather than a shop
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
}

export default Npc;

/**
 * Everyone who wanders, for uniform rolls over the variants
 */
export const NPCS: Npc[] = [Npc.Breeder, Npc.DaycareLady, Npc.NurseJoy, Npc.Groomer, Npc.Vendor];

export const NPC_NAMES: Record<Npc, string> = {
  [Npc.Breeder]: 'Breeder',
  [Npc.DaycareLady]: 'Daycare Lady',
  [Npc.NurseJoy]: 'Nurse Joy',
  [Npc.Groomer]: 'Groomer',
  [Npc.Vendor]: 'Vendor',
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
