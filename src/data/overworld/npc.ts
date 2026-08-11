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
}

export default Npc;

/**
 * Everyone who wanders, for uniform rolls over the variants
 */
export const NPCS: Npc[] = [Npc.Breeder, Npc.DaycareLady];

export const NPC_NAMES: Record<Npc, string> = {
  [Npc.Breeder]: 'Breeder',
  [Npc.DaycareLady]: 'Daycare Lady',
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
