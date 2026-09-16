import { hash2 } from './hash';

/** Anything a field of the world is sampled from */
export interface Noise2D {
  noise(x: number, y: number): number;
}

/** What squares the lattice into triangles, and what brings it back */
const SKEW = (Math.sqrt(3) - 1) / 2;
const UNSKEW = (3 - Math.sqrt(3)) / 6;

/**
 * How far one lattice point reaches. Wider than classic simplex's 1/2,
 * which is what the OpenSimplex2S family does to lose the faint
 * triangular grain a narrow kernel leaves in a field this broad
 */
const RADIUS_SQUARED = 2 / 3;

/**
 * Twenty-four directions, turned half a step off the axes so no ridge
 * of the field is ever drawn along a row or a column
 */
const GRADIENT_COUNT = 24;
const GRADIENTS = new Float64Array(GRADIENT_COUNT * 2);

for (let at = 0; at < GRADIENT_COUNT; at++) {
  const angle = ((at + 0.5) / GRADIENT_COUNT) * Math.PI * 2;

  GRADIENTS[at * 2] = Math.cos(angle);
  GRADIENTS[at * 2 + 1] = Math.sin(angle);
}

/** A lattice step, in the unskewed plane the kernel is measured in */
function unskewed(a: number, b: number): [number, number] {
  return [a - (a + b) * UNSKEW, b - (a + b) * UNSKEW];
}

function distanceToSegment(
  px: number,
  py: number,
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
): number {
  const ex = bx - ax;
  const ey = by - ay;
  const along = Math.max(0, Math.min(1, ((px - ax) * ex + (py - ay) * ey) / (ex * ex + ey * ey)));

  return Math.hypot(px - (ax + ex * along), py - (ay + ey * along));
}

function distanceToTriangle(px: number, py: number, corners: [number, number][]): number {
  const [a, b, c] = corners;
  const side = (p: [number, number], q: [number, number]): number =>
    (q[0] - p[0]) * (py - p[1]) - (q[1] - p[1]) * (px - p[0]);
  const ab = side(a, b);
  const bc = side(b, c);
  const ca = side(c, a);

  if ((ab >= 0 && bc >= 0 && ca >= 0) || (ab <= 0 && bc <= 0 && ca <= 0)) {
    return 0;
  }
  return Math.min(
    distanceToSegment(px, py, a, b),
    distanceToSegment(px, py, b, c),
    distanceToSegment(px, py, c, a),
  );
}

/**
 * How many rows and columns a lattice cell is cut into for listing the
 * points that reach it. Finer regions list fewer points, and a sample
 * then tests four or five rather than ten
 */
const REGIONS = 8;

/**
 * The lattice points that can reach anywhere in one region of a cell,
 * as (step, step, x, y) runs. Worked out exactly from the geometry
 * rather than listed by hand, so no point that could reach a sample is
 * ever left out
 */
function reachingPoints(triangles: [number, number][][]): Float64Array {
  const found: number[] = [];
  // A hair wider than the kernel, so rounding never drops a point
  const reach = Math.sqrt(RADIUS_SQUARED) + 1e-9;

  for (let b = -2; b <= 3; b++) {
    for (let a = -2; a <= 3; a++) {
      const [x, y] = unskewed(a, b);

      for (const corners of triangles) {
        if (distanceToTriangle(x, y, corners) < reach) {
          found.push(a, b, x, y);
          break;
        }
      }
    }
  }
  return new Float64Array(found);
}

/** Each region's reaching points, row by column of the skewed cell */
const NEAR: Float64Array[] = [];

for (let row = 0; row < REGIONS; row++) {
  for (let column = 0; column < REGIONS; column++) {
    const left = column / REGIONS;
    const right = (column + 1) / REGIONS;
    const top = row / REGIONS;
    const bottom = (row + 1) / REGIONS;
    const corner = unskewed(left, top);
    const far = unskewed(right, bottom);

    NEAR.push(
      reachingPoints([
        [corner, unskewed(right, top), far],
        [corner, unskewed(left, bottom), far],
      ]),
    );
  }
}

/** The reaching points for a sample, from its place inside its skewed cell */
function nearPoints(skewedX: number, skewedY: number, i: number, j: number): Float64Array {
  const column = Math.min(REGIONS - 1, Math.floor((skewedX - i) * REGIONS));
  const row = Math.min(REGIONS - 1, Math.floor((skewedY - j) * REGIONS));

  return NEAR[row * REGIONS + column];
}

/**
 * The spread of a raw sum and the spread the first generation's Perlin
 * fields had, as matching quantiles of how far a value sits from zero.
 *
 * A single scale was not enough: simplex sums pile up nearer the
 * middle, so matched by spread alone the rivers came out thinner and
 * the extreme biomes all but vanished. Mapping one distribution onto
 * the other keeps every threshold cutting the world in the proportions
 * it was tuned for. Measured over two million samples across five
 * seeds, and checked against fresh seeds in the noise test
 */
const RAW_KNOTS = new Float64Array([
  0, 0.000749745, 0.00149963, 0.00225403, 0.00300943, 0.00375482, 0.00449101, 0.0052425, 0.00599263,
  0.00673087, 0.00747878, 0.00823115, 0.00897497, 0.00972958, 0.0104817, 0.0112223, 0.0119731,
  0.0127165, 0.0134517, 0.0141956, 0.0149499, 0.0156971, 0.0164366, 0.0171886, 0.0179378, 0.0186809,
  0.0194136, 0.0201541, 0.0208891, 0.0216303, 0.0223712, 0.0231147, 0.0238515, 0.0245929, 0.0253314,
  0.026062, 0.0267956, 0.0275807, 0.028425, 0.0293233, 0.0302894, 0.0313174, 0.0324126, 0.0336371,
  0.0349615, 0.0364401, 0.037233, 0.0380896, 0.0390139, 0.0400151, 0.04109, 0.0423113, 0.0437149,
  0.0453573, 0.0475831, 0.0478451, 0.0481181, 0.0484352, 0.0487709, 0.0491629, 0.0496003, 0.0501118,
  0.0507288, 0.0515423, 0.052353, 0.0535903, 0.0548124,
]);
const PERLIN_KNOTS = new Float64Array([
  0, 0.00583441, 0.0123296, 0.0189214, 0.0254956, 0.0323039, 0.0391873, 0.0461564, 0.0531724,
  0.0602862, 0.067672, 0.0753729, 0.0834104, 0.0917587, 0.100377, 0.109068, 0.118097, 0.127328,
  0.136587, 0.146104, 0.155566, 0.16531, 0.175238, 0.185418, 0.195822, 0.206332, 0.21711, 0.227926,
  0.238787, 0.249712, 0.260759, 0.271967, 0.285338, 0.300316, 0.316201, 0.333491, 0.350823,
  0.368295, 0.386304, 0.404294, 0.422265, 0.439904, 0.457193, 0.473532, 0.488321, 0.499887,
  0.506676, 0.517388, 0.530891, 0.548925, 0.56876, 0.58953, 0.614391, 0.647886, 0.698063, 0.707582,
  0.720092, 0.73234, 0.745241, 0.758311, 0.772462, 0.786491, 0.800766, 0.84141, 0.91683, 0.981958,
  1,
]);

/**
 * The same, for a field summed over two octaves, whose raw sums spread
 * differently again. Measured the same way
 */
const FRACTAL_KNOTS = new Float64Array([
  0, 0.000657641, 0.0013462, 0.00204782, 0.00274025, 0.00344554, 0.00416119, 0.00488941, 0.00561636,
  0.00634408, 0.00708347, 0.00782591, 0.0085764, 0.00933278, 0.0101028, 0.010879, 0.0116565,
  0.0124365, 0.0132331, 0.0140331, 0.0148454, 0.0156645, 0.0164825, 0.0173246, 0.0181705, 0.0190253,
  0.0198961, 0.0207805, 0.0216721, 0.0225874, 0.0235091, 0.0244483, 0.0254097, 0.0263984, 0.0273992,
  0.028428, 0.0294888, 0.0305726, 0.0317091, 0.0328836, 0.0341186, 0.0354334, 0.036832, 0.0383564,
  0.0400279, 0.0418993, 0.0429344, 0.0440396, 0.0452305, 0.0465362, 0.0480005, 0.0496651, 0.0516452,
  0.0541103, 0.0575336, 0.0579862, 0.0584843, 0.0590358, 0.0596307, 0.0603269, 0.0611455, 0.0621978,
  0.0635899, 0.0658577, 0.0679624, 0.0719122, 0.0804963,
]);

/** How many buckets a spread's knots are indexed by */
const BUCKETS = 1024;

/**
 * A matched spread: its knots, plus the knot each bucket of raw size
 * starts from, so a sample walks one or two knots instead of searching
 * all of them. The answer is the same as a search's
 */
interface Spread {
  knots: Float64Array;
  starts: Uint8Array;
  scale: number;
}

function indexSpread(knots: Float64Array): Spread {
  const last = knots.length - 1;
  const scale = BUCKETS / knots[last];
  const starts = new Uint8Array(BUCKETS);
  let low = 0;

  for (let bucket = 0; bucket < BUCKETS; bucket++) {
    while (low < last - 1 && knots[low + 1] <= bucket / scale) {
      low++;
    }
    starts[bucket] = low;
  }
  return { knots, starts, scale };
}

const RAW_SPREAD = indexSpread(RAW_KNOTS);
const FRACTAL_SPREAD = indexSpread(FRACTAL_KNOTS);

/** A raw sum moved onto the Perlin spread, keeping its sign */
function matchSpread(raw: number, { knots, starts, scale }: Spread): number {
  const size = raw < 0 ? -raw : raw;
  const last = knots.length - 1;
  let matched: number;

  if (size >= knots[last]) {
    matched = PERLIN_KNOTS[last];
  } else {
    let low = starts[Math.floor(size * scale)];

    while (knots[low + 1] <= size) {
      low++;
    }
    const along = (size - knots[low]) / (knots[low + 1] - knots[low]);

    matched = PERLIN_KNOTS[low] + along * (PERLIN_KNOTS[low + 1] - PERLIN_KNOTS[low]);
  }
  return raw < 0 ? -matched : matched;
}

/** Large odd multipliers that spread a lattice step across the whole word */
const PRIME_X = 0x5205402b;
const PRIME_Y = 0x598cd327;
const PRIME_MIX = 0x27d4eb2d;

/**
 * Where a lattice point's gradient sits in `GRADIENTS`. One multiply
 * rather than a full hash per point, the way OpenSimplex2 picks its
 * gradients: this runs a few times for every sample of every field,
 * and a Murmur hash here made the second generation twice as slow as
 * the first. The top 16 bits are scaled onto the 24 directions, which
 * spreads them evenly without a modulo
 */
function gradientAt(key: number, i: number, j: number): number {
  let hash = Math.imul(key ^ Math.imul(i, PRIME_X) ^ Math.imul(j, PRIME_Y), PRIME_MIX);

  hash ^= hash >>> 15;
  return (((hash >>> 16) * GRADIENT_COUNT) >>> 16) * 2;
}

/** One octave's raw sum, before its spread is matched */
function latticeSum(x: number, y: number, key: number): number {
  const skew = (x + y) * SKEW;
  const skewedX = x + skew;
  const skewedY = y + skew;
  const i = Math.floor(skewedX);
  const j = Math.floor(skewedY);
  const unskew = (i + j) * UNSKEW;
  const x0 = x - (i - unskew);
  const y0 = y - (j - unskew);
  const points = nearPoints(skewedX, skewedY, i, j);
  let value = 0;

  for (let at = 0; at < points.length; at += 4) {
    const dx = x0 - points[at + 2];
    const dy = y0 - points[at + 3];
    const falloff = RADIUS_SQUARED - dx * dx - dy * dy;

    if (falloff <= 0) {
      continue;
    }

    const gradient = gradientAt(key, i + points[at], j + points[at + 1]);
    const squared = falloff * falloff;

    value += squared * squared * (GRADIENTS[gradient] * dx + GRADIENTS[gradient + 1] * dy);
  }
  return value;
}

/** How much quieter each octave is than the one below it */
const PERSISTENCE = 0.5;

/** What moves one octave's lattice off another's, so they never line up */
const OCTAVE_SALT = 0x9e3779b1;

/**
 * Seeded 2D simplex noise with hashed gradients: smooth values in
 * [-1, 1] spread the way the first generation's fields were, and no
 * permutation table, so the field never repeats short of the hash's
 * own width.
 *
 * `salt` keeps two fields of one world apart without a second seed.
 * `octaves` adds finer detail at half the frequency and half the
 * weight, for a field whose edges are walked along rather than seen
 * from afar
 */
export default class SimplexNoise implements Noise2D {
  /** Each octave's lattice key, folded from the seed and salt once */
  readonly first: number;
  private readonly second: number;

  constructor(
    seed: number,
    salt: number,
    private readonly octaves: 1 | 2 = 1,
  ) {
    this.first = hash2(seed, salt) | 0;
    this.second = hash2(seed, salt ^ OCTAVE_SALT) | 0;
  }

  noise(x: number, y: number): number {
    if (this.octaves === 1) {
      return matchSpread(latticeSum(x, y, this.first), RAW_SPREAD);
    }
    return matchSpread(this.fractal(x, y), FRACTAL_SPREAD);
  }

  /** The raw two-octave sum, before its spread is matched */
  fractal(x: number, y: number): number {
    return latticeSum(x, y, this.first) + PERSISTENCE * latticeSum(x * 2, y * 2, this.second);
  }
}

/**
 * Several one-octave fields read at the same point, in one pass over
 * the lattice. Only the gradients differ between them, so the climate's
 * three fields cost little more than one. Each value is what that
 * field's own `noise` would answer
 */
export class SimplexStack {
  private readonly keys: Int32Array;

  constructor(fields: SimplexNoise[]) {
    this.keys = new Int32Array(fields.length);
    for (const [at, field] of fields.entries()) {
      this.keys[at] = field.first;
    }
  }

  /** Writes each field's value at the point into `out`, in the order the fields were given */
  noiseInto(x: number, y: number, out: Float64Array): void {
    const { keys } = this;
    const skew = (x + y) * SKEW;
    const skewedX = x + skew;
    const skewedY = y + skew;
    const i = Math.floor(skewedX);
    const j = Math.floor(skewedY);
    const unskew = (i + j) * UNSKEW;
    const x0 = x - (i - unskew);
    const y0 = y - (j - unskew);
    const points = nearPoints(skewedX, skewedY, i, j);

    out.fill(0, 0, keys.length);
    for (let at = 0; at < points.length; at += 4) {
      const dx = x0 - points[at + 2];
      const dy = y0 - points[at + 3];
      const falloff = RADIUS_SQUARED - dx * dx - dy * dy;

      if (falloff <= 0) {
        continue;
      }

      const squared = falloff * falloff;
      const weight = squared * squared;
      const pointI = i + points[at];
      const pointJ = j + points[at + 1];

      for (let field = 0; field < keys.length; field++) {
        const gradient = gradientAt(keys[field], pointI, pointJ);

        out[field] += weight * (GRADIENTS[gradient] * dx + GRADIENTS[gradient + 1] * dy);
      }
    }
    for (let field = 0; field < keys.length; field++) {
      out[field] = matchSpread(out[field], RAW_SPREAD);
    }
  }
}
