/**
 * The ground a battle is fought on: a plane with no edges.
 *
 * [`board.ts`](../board.ts) projects a **chunk** — sixteen cells by
 * sixteen, with a known middle and known corners — and everything it
 * does follows from the board being bounded. It fits the whole thing
 * into the picture, and it fits it again at every angle, so a board
 * turned forty-five degrees shrinks to keep its corners on screen.
 *
 * A battle has no corners. There is no cell anybody stands on, nothing
 * is placed by grid reference, and the only things on the ground are
 * the pokemon and however far apart they are standing. Fitting is
 * exactly the wrong behaviour: a fight between two pokemon and a fight
 * between a boss and twelve are the same field seen from the same
 * height, and a camera that zoomed out when the lobby filled up would
 * make every raid look like a different game.
 *
 * So this is the same camera over an **unbounded** plane. The tilt and
 * the lens are the overworld's, because the two are the same world and
 * a battle that looked flatter than the field it started on would say
 * they were not. What is gone is the fitting: a field point is placed
 * by how far it is from the middle in field units, and how many pixels
 * a field unit is worth is the caller's to decide.
 *
 * Coordinates are `x` across and `z` away — `z` positive is further
 * off, toward the horizon, which is the direction the camera is
 * looking. There is no `y`: everything here is on the ground, and how
 * tall a pokemon is drawn is a matter for whatever draws it.
 */

/**
 * How far the ground is tilted away from the camera, in degrees.
 *
 * Shallower than the overworld's sixty, and deliberately so. The two
 * are the same world, but they are not the same **shape**: a chunk is
 * square and a battle is a ring of parties around a boss, and a ring
 * on the ground is as deep as it is wide while the canvas is close to
 * two to one. Steeply tilted, depth costs nearly a full unit of screen
 * for every unit of ground, and a circle either runs off the bottom or
 * has to be shrunk until the pokemon are specks.
 *
 * The fix belongs to the **camera**, not to the world. Standing lower
 * compresses depth without touching what is standing on the ground, so
 * the ring stays a ring — it is a circle drawn in perspective rather
 * than an ellipse drawn to fit
 */
export const PITCH = 38;

/** How much of the field's depth survives that tilt. */
const DEPTH = Math.sin((PITCH * Math.PI) / 180);

/**
 * How far the camera stands back, in field units.
 *
 * The overworld says this in board widths, which a board has and a
 * field does not, so it is said here in the same units everything else
 * on the field is measured in. It is what makes the far side of a
 * fight narrower than the near side.
 *
 * It has to be **large against the field's own depth**, and a battle
 * is much deeper than a chunk: a lobby is forty units front to back,
 * where a chunk is sixteen cells. Set as close in as the overworld's
 * is, the near party comes out three times the size of the far one and
 * halfway off the bottom of the screen. This keeps the near side
 * comfortably under twice the far side, which reads as depth without
 * reading as a fisheye
 */
const FOCAL = 60;

/**
 * How near the horizon a point may come before it stops being drawn.
 *
 * At the horizon the perspective divides by nothing and a pokemon
 * standing there is infinitely large; a little short of it, one is
 * merely enormous. Nothing on a battlefield is ever legitimately that
 * far away, so a point past this is a mistake somewhere and is better
 * dropped than drawn a thousand pixels tall
 */
const HORIZON = FOCAL / DEPTH - 1;

/** A place on the ground, in field units from the middle. */
export interface FieldPoint {
  x: number;
  z: number;
}

/** Where a field point lands on the canvas, and how big things are there. */
export interface FieldProjection {
  x: number;
  y: number;
  /**
   * The whole of the third dimension: something twice as far off is
   * drawn half the size, and a pokemon standing there takes the same
   * factor
   */
  scale: number;
  /**
   * Whether it is in front of the camera at all. A point past the
   * horizon has no honest place on the picture
   */
  visible: boolean;
}

/** Where the camera is standing and how much of the field it shows. */
export interface FieldView {
  /** The canvas, in its own drawing coordinates. */
  width: number;
  height: number;
  /**
   * How many pixels one field unit is worth at the middle of the
   * field. Bigger is closer in
   */
  unit: number;
  /**
   * Which way round the field is being looked at, in radians, turning
   * about its middle.
   *
   * The turn happens **before** the tilt, which is what makes it a
   * camera walking around the fight rather than the picture being spun
   * on the screen: whoever swings toward the viewer is drawn nearer
   * and larger as they come
   */
  yaw: number;
  /**
   * How far down the canvas the middle of the field sits, as a
   * fraction of its height.
   *
   * The middle of the picture by default, because the middle of the
   * field is the thing the fight is about — the boss in a raid, the
   * gap between the two sides in a duel — and what a fight is about
   * belongs in the middle of the frame. Depth is what says the field
   * runs away from the viewer; it does not need to be pushed down the
   * screen as well
   */
  horizon?: number;
}

const DEFAULT_HORIZON = 0.5;

/**
 * A field point turned about the middle of the field.
 *
 * Before the tilt, so the far side stays far
 */
function turn(point: FieldPoint, yaw: number): FieldPoint {
  if (yaw === 0) {
    return point;
  }

  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);

  return { x: point.x * cos - point.z * sin, z: point.x * sin + point.z * cos };
}

/**
 * How much bigger or smaller than the middle of the field things are
 * at a depth. Positive `z` is further off, so it divides by more
 */
export function scaleAt(z: number): number {
  return FOCAL / (FOCAL + z * DEPTH);
}

/**
 * Where a place on the ground lands on the canvas.
 *
 * There is no fitting and no bounds: a point a hundred units off to
 * the side is projected honestly and comes out off the edge of the
 * picture, which is what an unbounded field means
 */
export default function projectField(point: FieldPoint, view: FieldView): FieldProjection {
  const turned = turn(point, view.yaw);
  const middle = view.height * (view.horizon ?? DEFAULT_HORIZON);

  if (turned.z >= HORIZON) {
    return { x: view.width / 2, y: middle, scale: 0, visible: false };
  }

  const scale = scaleAt(turned.z);

  return {
    x: view.width / 2 + turned.x * scale * view.unit,
    // Depth reads down the screen as it comes toward the viewer, which
    // is why the sign is what it is: a larger `z` is further up the
    // picture, not further down it
    y: middle - turned.z * DEPTH * scale * view.unit,
    scale,
    visible: true,
  };
}

/**
 * Which place on the ground is under a point on the canvas.
 *
 * The same transform read backwards rather than a search. Nothing
 * presses the battlefield yet, but a camera that can be dragged round
 * is one step from a field that can be pointed at, and the arithmetic
 * is worth having written down once
 */
export function unprojectField(x: number, y: number, view: FieldView): FieldPoint | null {
  const middle = view.height * (view.horizon ?? DEFAULT_HORIZON);
  const py = (middle - y) / view.unit;

  /**
   * With `s` for the scale at that depth, the forward transform is
   *
   *     py = z * DEPTH * FOCAL / (FOCAL + z * DEPTH)
   *
   * which rearranges to the line below. A `py` at or past the focal
   * length is the horizon itself, where the two never meet
   */
  const limit = FOCAL;

  if (py >= limit) {
    return null;
  }

  const z = (py * FOCAL) / (DEPTH * (FOCAL - py));

  if (z >= HORIZON) {
    return null;
  }

  const scale = scaleAt(z);
  const fx = (x - view.width / 2) / (scale * view.unit);
  const cos = Math.cos(-view.yaw);
  const sin = Math.sin(-view.yaw);

  return { x: fx * cos - z * sin, z: fx * sin + z * cos };
}

/**
 * How wide a ring has to be to hold a given number of things without
 * crowding them.
 *
 * A ring of a fixed size is fine until the lobby fills up: the
 * distance between neighbours on a circle is `2r·sin(π/n)`, so it
 * falls away as fast as parties arrive, and past eight or so they are
 * standing on each other. Rather than a rule about eight, this is the
 * geometry itself — the ring keeps its size while the spacing is
 * comfortable and grows exactly as fast as it has to once it is not
 *
 * @param count how many go round it
 * @param minimum the size it keeps while there is room
 * @param gap how far apart neighbours must be, in field units
 */
export function ringRadius(count: number, minimum: number, gap: number): number {
  if (count < 2) {
    return minimum;
  }

  const chord = 2 * Math.sin(Math.PI / count);

  return Math.max(minimum, gap / chord);
}

/**
 * Where each of a group stands when they are drawn as a ring.
 *
 * A side is a **circle** rather than a row, which is the whole point
 * of a field with depth: a row of six is six pokemon in a line
 * whatever the camera does, and a ring of six turns into a ring as the
 * camera comes round it. One alone stands at the middle of its circle
 * rather than on the edge of it, since a ring of one is a pokemon
 * standing slightly off from where it ought to be
 */
export function ringOf(count: number, centre: FieldPoint, radius: number): FieldPoint[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [centre];
  }

  const places: FieldPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    // Started from the near side and going round, so the first of a
    // party is the one nearest the viewer rather than the one hidden
    // behind the others. Nearest is the **smallest** `z`: the axis
    // counts away from the camera, so the near edge of a ring is its
    // centre minus the radius
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;

    places.push({
      x: centre.x + Math.cos(angle) * radius,
      z: centre.z + Math.sin(angle) * radius,
    });
  }
  return places;
}
