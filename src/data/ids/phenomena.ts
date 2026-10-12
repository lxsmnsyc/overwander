/**
 * Something happening on a patch of ground rather than something
 * buried in it.
 *
 * A phenomenon is the one landmark whose *kind* is rolled rather than
 * fixed: the cell is the chunk's own like every other landmark, but
 * what is going on there is drawn from what the biome can host and
 * changes every hour. Water ripples where there is water; dust rises
 * where there is dust; a shadow passes over open country.
 *
 * Every one of them can turn out to be a pokemon — the uncommon and
 * rare bands only, so a phenomenon is worth walking to — and every one
 * but the grotto can turn out to be something to carry home instead.
 * What that something is is the phenomenon's own: what a dust cloud
 * kicks up is not what washes up on a ripple.
 *
 * Which biomes host each and what each is called is data, in
 * `src/data/overworld/biome-phenomena.yaml`
 */
const enum Phenomenon {
  /**
   * A tucked-away hollow. It is the only one with no item in it at
   * all: what a grotto hides is a pokemon, and once in a great while
   * an egg of the biome's own
   */
  HiddenGrotto = 0,
  /**
   * Dust rising off dry ground. The richest of them: what it kicks up
   * is anything the ground had in it — a gem, a stone, a plate or a
   * valuable
   */
  DustCloud = 1,
  /**
   * A ring spreading on open water. What surfaces is a valuable: the
   * pearls and star pieces the sea keeps
   */
  RipplingWater = 2,
  /**
   * Something passing overhead. What it drops is a wing, which is the
   * only training a pokemon ever gets that its levels did not pay for
   */
  FlyingShadow = 3,
}

export { Phenomenon };
export default Phenomenon;
