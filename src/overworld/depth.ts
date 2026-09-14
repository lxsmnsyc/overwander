/**
 * Which layer of the world a reading is of.
 *
 * Its own module rather than a name on `World`, because everything
 * that reads the ground has to know it: the fields, the ground, the
 * towns and the caves all ask, and every one of them is something
 * `World` itself is built out of. Kept here, none of them has to
 * import the thing that imports them.
 *
 * The two layers share every noise field and every coordinate. A cave
 * is the same place underneath rather than a map of its own, which is
 * what makes a mouth line up with the crag it is cut into.
 */
export const enum Depth {
  Surface = 0,
  Cave = 1,
}

/** Every layer, for anything that has to answer for both */
export const DEPTHS: Depth[] = [Depth.Surface, Depth.Cave];
