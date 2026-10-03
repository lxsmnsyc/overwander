/**
 * The people who answer to a syndicate's boss. Like Giovanni they are the grunt's
 * landmark wearing a rarer face rather than a role of their own, and
 * they stand between him and the rank and file in every way: what
 * they field, what level it fights at, and how often one is met.
 *
 * A mark is recorded against the number, so one is appended and never
 * renumbered. Who each is lives in `src/data/overworld/executives.yaml`
 */
const enum Executive {
  Archer = 0,
  Ariana = 1,
  Proton = 2,
  Petrel = 3,
  Tabitha = 4,
  Courtney = 5,
  Matt = 6,
  Shelly = 7,
  Mars = 8,
  Jupiter = 9,
  Saturn = 10,
  Colress = 11,
  Zinzolin = 12,
  Xerosic = 13,
  Aliana = 14,
  Bryony = 15,
  Celosia = 16,
  Mable = 17,
}

export { Executive };
export default Executive;
