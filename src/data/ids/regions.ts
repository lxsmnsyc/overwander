/**
 * Where a pokemon is from.
 *
 * The numbers are written into nothing on disk (sheets are filed under
 * the region's **name**), so this is free to be renumbered.
 */
const enum Regions {
  /**
   * Not a place: Missingno, an egg and a substitute are drawn like
   * pokemon and belong to no region
   */
  Unknown = 0,
  Kanto = 1,
  Johto = 2,
}

export default Regions;
