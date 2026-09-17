import {
  BufferGeometry,
  CustomBlending,
  DoubleSide,
  DynamicDrawUsage,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  RawShaderMaterial,
  Vector2,
  Vector3,
} from 'three';

/**
 * Move effects in the battle scene, written fresh every frame.
 *
 * Everything is placed in field units (`x` across, `y` up, `z` away) and
 * drawn through the field camera, so a spark thrown behind a pokemon is
 * smaller, higher and hidden by it. Shapes are worked out per pixel from
 * the quad's own coordinates rather than sampled from art, so they stay
 * sharp at any size and need no sheet.
 */

/** A place in the field, in field units. */
export type Spot = [x: number, y: number, z: number];

/** Anchor, corner, uv, tint and look: sixteen floats a vertex. */
const STRIDE = 16;

const ROOM = 512;

/** What the fragment shader draws a quad as. */
const enum Shape {
  Glow = 0,
  Ring = 1,
  Streak = 2,
  Star = 3,
  Shard = 4,
  Ribbon = 5,
  Bubble = 6,
  Leaf = 7,
  Pit = 8,
  Heart = 9,
  Pane = 10,
  Puff = 11,
}

const VERTEX = `
precision highp float;
uniform mat4 projectionMatrix;
uniform vec2 reach;
uniform vec3 toward;
attribute vec3 anchor;
attribute vec2 corner;
attribute vec2 uv;
attribute vec4 tint;
attribute vec4 look;
varying vec2 pass_uv;
varying vec4 pass_tint;
varying vec3 pass_look;

void main() {
  pass_uv = uv;
  pass_tint = tint;
  pass_look = vec3(look.x, look.z, uv.x);
  bool lying = look.y > 0.5;
  vec3 at = lying ? anchor + vec3(corner.x, 0.0, corner.y) : anchor;
  vec4 clip = projectionMatrix * vec4(at, 1.0);
  // Judged a little nearer the camera than it stands, so an effect on a
  // pokemon is not cut in half by that pokemon's own picture
  vec4 nearer = projectionMatrix * vec4(at + toward * look.w, 1.0);

  clip.z = nearer.z / nearer.w * clip.w;
  if (!lying) {
    // Added before the divide, which is what shrinks it with distance
    clip.xy += corner * reach;
  }
  gl_Position = clip;
}`;

const FRAGMENT = `
precision highp float;
varying vec2 pass_uv;
varying vec4 pass_tint;
varying vec3 pass_look;

float hash(float n) {
  return fract(sin(n * 91.345) * 47453.5453);
}

void main() {
  vec2 p = pass_uv;
  float r = length(p);
  float shape = floor(pass_look.x);
  float param = clamp((fract(pass_look.x) - 0.1) / 0.8, 0.0, 1.0) * 4.0;
  float alpha = 0.0;
  float hot = 0.0;
  vec3 colour = pass_tint.rgb;

  if (shape < 0.5) {
    // A soft ball of light, white at the middle by as much as asked
    alpha = pow(max(0.0, 1.0 - r), 1.6);
    hot = pow(max(0.0, 1.0 - r * 2.2), 2.0) * param;
  } else if (shape < 1.5) {
    // A ring, with a faint glow either side of the band
    // A ring's setting is packed four times over, as every setting is
    float width = max(0.02, param * 0.25);
    float band = abs(r - (1.0 - width));
    alpha = (1.0 - smoothstep(width * 0.35, width, band)) + exp(-band * band * 60.0) * 0.35;
    alpha *= step(r, 1.0);
    hot = (1.0 - smoothstep(0.0, width * 0.4, band)) * 0.6;
  } else if (shape < 2.5) {
    // A streak along x, pointed at both ends
    float across = abs(p.y) / max(0.05, 1.0 - abs(p.x));
    alpha = max(0.0, 1.0 - across) * (1.0 - smoothstep(0.7, 1.0, abs(p.x)));
    hot = pow(max(0.0, 1.0 - across * 2.5), 2.0) * 0.8;
  } else if (shape < 3.5) {
    // Four points and a core
    float x = max(0.0, 1.0 - abs(p.y) * 9.0 / max(0.1, 1.0 - abs(p.x)));
    float y = max(0.0, 1.0 - abs(p.x) * 9.0 / max(0.1, 1.0 - abs(p.y)));
    float core = pow(max(0.0, 1.0 - r * 2.0), 2.0);
    alpha = max(max(x, y) * step(r, 1.0), core);
    hot = core;
  } else if (shape < 4.5) {
    // A broken piece: a triangle pointing up, lit down its left face
    float slope = (1.0 - p.y) * 0.5;
    float edge = min(slope - abs(p.x), p.y + 1.0);
    alpha = smoothstep(0.0, 0.08, edge);
    colour = mix(colour * 0.62, colour, step(p.x, 0.0));
    hot = step(p.x, 0.0) * smoothstep(0.1, 0.0, abs(p.x + slope * 0.5)) * 0.5;
  } else if (shape < 5.5) {
    // A beam or bolt seen side on, bright down its spine and rippling along it
    float across = abs(p.y);
    float flow = 0.8 + 0.2 * sin(pass_look.z * 38.0 - param * 25.0);
    alpha = pow(max(0.0, 1.0 - across), 1.4) * flow;
    // White down the spine only where it is light: a vine has no glow
    hot = exp(-across * across * 14.0) * (0.15 + 0.85 * pass_look.y);
  } else if (shape < 6.5) {
    // A bubble: a thin shell, a faint fill and a highlight
    float shell = 1.0 - smoothstep(0.08, 0.16, abs(r - 0.86));
    float shine = 1.0 - smoothstep(0.1, 0.22, length(p - vec2(-0.38, 0.38)));
    alpha = max(max(shell, 0.18), shine) * step(r, 1.0);
    hot = shine;
  } else if (shape < 7.5) {
    // A leaf along x, with a darker rib down the middle
    float width = 0.55 * (1.0 - p.x * p.x);
    float edge = width - abs(p.y);
    alpha = smoothstep(0.0, 0.06, edge);
    colour = mix(colour * 0.7, colour, smoothstep(0.0, 0.08, abs(p.y)));
    hot = smoothstep(0.2, 0.0, abs(p.y - width * 0.5)) * 0.25;
  } else if (shape < 8.5) {
    // The ground torn open along x, ragged at its lips, dark within
    float lip = sin(3.14159 * (p.x + 1.0) * 0.5);
    float rag = (hash(floor((p.x + 1.0) * 8.0)) - 0.5) * 0.18;
    float edge = lip * param * 0.22 + rag * lip - abs(p.y);
    alpha = smoothstep(0.0, 0.05, edge);
    colour = mix(colour, vec3(0.02, 0.015, 0.01), smoothstep(0.02, 0.2, edge));
  } else if (shape < 9.5) {
    // A heart, lobes up. Cubed by hand: pow is undefined below zero
    vec2 q = vec2(p.x, p.y + 0.15) * 1.25;
    float d = q.x * q.x + q.y * q.y - 1.0;
    float f = d * d * d - q.x * q.x * q.y * q.y * q.y;
    alpha = 1.0 - smoothstep(-0.02, 0.02, f);
    hot = (1.0 - smoothstep(0.08, 0.2, length(p - vec2(-0.35, 0.3)))) * 0.7;
  } else if (shape < 10.5) {
    // A pane of glass: a faint face, bright edges and a fine sheen across it
    float rim = smoothstep(0.86, 0.97, max(abs(p.x), abs(p.y)));
    alpha = 0.22 + 0.05 * sin(p.y * 40.0) + rim * 0.75;
    hot = rim * 0.45;
  } else {
    // A ball of cloud: a firm edge, and shaded darker underneath
    alpha = 1.0 - smoothstep(0.86, 1.0, r);
    colour *= 0.7 + 0.3 * smoothstep(-1.0, 0.8, p.y);
  }

  colour = mix(colour, vec3(1.0), clamp(hot, 0.0, 1.0) * 0.85);
  float seen = clamp(alpha, 0.0, 1.0) * pass_tint.a;
  // Premultiplied. Light covers only by as much as it is bright: with no
  // alpha at all, a clear stretch of the canvas composites it as nothing
  float cover = seen * (1.0 - pass_look.y);
  float glare = seen * pass_look.y * max(colour.r, max(colour.g, colour.b));

  gl_FragColor = vec4(colour * seen, cover + glare);
}`;

/**
 * The shape and its one setting (a glow's white-hot share, a ring's width),
 * as one float. The setting rides in the middle of the fraction, clear of
 * both whole numbers, so the shape never rounds into the next one
 */
function packed(shape: Shape, param: number): number {
  return shape + 0.1 + 0.8 * Math.max(0, Math.min(1, param / 4));
}

const tints = new Map<string, [number, number, number]>();

function tintOf(colour: string): [number, number, number] {
  let known = tints.get(colour);

  if (known == null) {
    known = [
      Number.parseInt(colour.slice(1, 3), 16) / 255,
      Number.parseInt(colour.slice(3, 5), 16) / 255,
      Number.parseInt(colour.slice(5, 7), 16) / 255,
    ];
    tints.set(colour, known);
  }
  return known;
}

/** Corners of a quad in ring order, and the uv each is given. */
const QUAD = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [1, -1],
  [-1, -1],
] as const;

export interface Light {
  /** How much it adds rather than covers, from 0 (paint) to 1 (light). Light by default */
  add?: number;
}

export default class EffectBatch {
  readonly mesh: Mesh<BufferGeometry, RawShaderMaterial>;
  private vertices = new Float32Array(ROOM * 6 * STRIDE);
  private buffer = EffectBatch.bufferOf(this.vertices);
  private filled = 0;
  private readonly reach = new Vector2(1, 1);
  private readonly toward = new Vector3(0, 0, -1);
  /** The field camera row by row, for laying a ribbon across the picture */
  private matrix: number[] = [];
  private screen = { width: 1, height: 1 };
  private lens = 1;
  private yaw = 0;
  /** How far toward the camera the next shapes are judged, in field units */
  private lift = 0;

  constructor() {
    const material = new RawShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: { reach: { value: this.reach }, toward: { value: this.toward } },
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: DoubleSide,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
      blendSrcAlpha: OneFactor,
      blendDstAlpha: OneMinusSrcAlphaFactor,
    });

    this.mesh = new Mesh(new BufferGeometry(), material);
    this.mesh.frustumCulled = false;
    this.attach();
  }

  private static bufferOf(vertices: Float32Array): InterleavedBuffer {
    const buffer = new InterleavedBuffer(vertices, STRIDE);

    buffer.setUsage(DynamicDrawUsage);
    return buffer;
  }

  private attach(): void {
    const geometry = this.mesh.geometry;

    geometry.setAttribute('anchor', new InterleavedBufferAttribute(this.buffer, 3, 0));
    geometry.setAttribute('corner', new InterleavedBufferAttribute(this.buffer, 2, 3));
    geometry.setAttribute('uv', new InterleavedBufferAttribute(this.buffer, 2, 5));
    geometry.setAttribute('tint', new InterleavedBufferAttribute(this.buffer, 4, 7));
    geometry.setAttribute('look', new InterleavedBufferAttribute(this.buffer, 4, 11));
  }

  /**
   * Empty it for a frame seen through `matrix` (the field camera, row by
   * row). `lens` is the camera's focal length in element pixels, so a
   * field unit at camera distance `w` is `lens / w` pixels across
   */
  begin(
    matrix: number[],
    lens: number,
    screen: { width: number; height: number },
    yaw: number,
  ): void {
    this.matrix = matrix;
    this.lens = lens;
    this.screen = screen;
    this.yaw = yaw;
    this.reach.set((2 * lens) / screen.width, (2 * lens) / screen.height);
    this.toward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    this.filled = 0;
    this.lift = 0;
  }

  /** How far toward the camera what follows is judged, so it clears the body it is on */
  near(units: number): void {
    this.lift = units;
  }

  /** Which way the camera's right is along the ground, for spreading things across the picture */
  get across(): [x: number, z: number] {
    return [Math.cos(this.yaw), -Math.sin(this.yaw)];
  }

  /** Which way is away from the camera along the ground */
  get away(): [x: number, z: number] {
    return [Math.sin(this.yaw), Math.cos(this.yaw)];
  }

  /** A soft ball of light. `hot` is how white its middle burns, from 0 to 1 */
  glow(at: Spot, radius: number, colour: string, alpha: number, hot = 1, light: Light = {}): void {
    this.square(at, radius, 0, packed(Shape.Glow, hot * 4), colour, alpha, light.add ?? 1, false);
  }

  /** The same light lying on the ground: a pool under a fire, a flash on the floor */
  pool(at: Spot, radius: number, colour: string, alpha: number, light: Light = {}): void {
    this.square(at, radius, 0, packed(Shape.Glow, 0), colour, alpha, light.add ?? 1, true);
  }

  /** A ring facing the camera. `width` is the band's share of the radius, up to 1 */
  ring(
    at: Spot,
    radius: number,
    width: number,
    colour: string,
    alpha: number,
    light: Light = {},
  ): void {
    this.square(at, radius, 0, packed(Shape.Ring, width * 4), colour, alpha, light.add ?? 1, false);
  }

  /** A ring lying on the ground, spreading along it */
  ripple(
    at: Spot,
    radius: number,
    width: number,
    colour: string,
    alpha: number,
    light: Light = {},
  ): void {
    this.square(at, radius, 0, packed(Shape.Ring, width * 4), colour, alpha, light.add ?? 1, true);
  }

  /** A streak through a point, `angle` turned on the picture with up positive */
  streak(
    at: Spot,
    length: number,
    width: number,
    angle: number,
    colour: string,
    alpha: number,
    light: Light = {},
  ): void {
    this.quad(at, length, width, angle, packed(Shape.Streak, 0), colour, alpha, light.add ?? 1);
  }

  /** A streak drawn from where something was a moment ago to where it is */
  trail(from: Spot, to: Spot, width: number, colour: string, alpha: number): void {
    const [ax, ay] = this.onPicture(from);
    const [bx, by] = this.onPicture(to);
    const middle: Spot = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
    const length = Math.hypot(bx - ax, by - ay) / this.worthAt(middle);

    this.streak(
      middle,
      Math.max(width, length / 2 + width),
      width,
      Math.atan2(by - ay, bx - ax),
      colour,
      alpha,
    );
  }

  /** A four-pointed glint */
  star(
    at: Spot,
    size: number,
    turn: number,
    colour: string,
    alpha: number,
    light: Light = {},
  ): void {
    this.quad(at, size, size, turn, packed(Shape.Star, 0), colour, alpha, light.add ?? 1);
  }

  /** A broken piece of something solid: rock, ice, earth */
  shard(
    at: Spot,
    size: number,
    turn: number,
    colour: string,
    alpha: number,
    light: Light = {},
  ): void {
    this.quad(at, size, size, turn, packed(Shape.Shard, 0), colour, alpha, light.add ?? 0);
  }

  heart(at: Spot, size: number, turn: number, colour: string, alpha: number): void {
    this.quad(at, size, size, turn, packed(Shape.Heart, 0), colour, alpha, 0.2);
  }

  /** A ring drawn as an oval turned on the picture, with radii `across` and `up` */
  oval(
    at: Spot,
    across: number,
    up: number,
    turn: number,
    width: number,
    colour: string,
    alpha: number,
  ): void {
    this.quad(at, across, up, turn, packed(Shape.Ring, width * 4), colour, alpha, 1);
  }

  /** A flat pane through four spots in the field, in ring order from its top left */
  panel(corners: [Spot, Spot, Spot, Spot], colour: string, alpha: number): void {
    if (alpha <= 0) {
      return;
    }
    const [red, green, blue] = tintOf(colour);

    this.room();
    for (const corner of [0, 1, 2, 0, 2, 3]) {
      const u = corner === 0 || corner === 3 ? -1 : 1;
      const v = corner <= 1 ? 1 : -1;

      this.vertex(
        corners[corner],
        0,
        0,
        u,
        v,
        red,
        green,
        blue,
        alpha,
        packed(Shape.Pane, 0),
        0.5,
        1,
        0,
      );
    }
  }

  /** Which way the line from one spot to another runs on the picture, up positive */
  angleOn(from: Spot, to: Spot): number {
    const [ax, ay] = this.onPicture(from);
    const [bx, by] = this.onPicture(to);

    return Math.atan2(by - ay, bx - ax);
  }

  /** A ball of cloud facing the camera. Paint by default, since a cloud covers */
  puff(at: Spot, radius: number, colour: string, alpha: number, light: Light = {}): void {
    this.square(at, radius, 0, packed(Shape.Puff, 0), colour, alpha, light.add ?? 0, false);
  }

  bubble(at: Spot, radius: number, colour: string, alpha: number): void {
    this.square(at, radius, 0, packed(Shape.Bubble, 0), colour, alpha, 0.5, false);
  }

  leaf(at: Spot, size: number, turn: number, colour: string, alpha: number): void {
    this.quad(at, size, size, turn, packed(Shape.Leaf, 0), colour, alpha, 0);
  }

  /** The ground split open across the picture: `half` along it and `open` from 0 to 1 */
  pit(at: Spot, half: number, open: number, colour: string, alpha: number): void {
    const [x, z] = this.across;
    const [ax, az] = this.away;

    this.lay(at, half, x, z, ax, az, packed(Shape.Pit, open * 4), colour, alpha, 0);
  }

  /**
   * A band of light through a run of points: a beam, a bolt, a jet.
   * `width` is across the band in field units, and `flow` moves the ripple along it
   */
  ribbon(
    path: Spot[],
    width: number,
    colour: string,
    alpha: number,
    flow = 0,
    light: Light = {},
  ): void {
    if (path.length < 2) {
      return;
    }
    const sides: [number, number][] = [];

    for (let at = 0; at < path.length; at += 1) {
      const [px, py] = this.onPicture(path[Math.max(0, at - 1)]);
      const [nx, ny] = this.onPicture(path[Math.min(path.length - 1, at + 1)]);
      const length = Math.hypot(nx - px, ny - py) || 1;

      // Square to the band on the picture, in the camera's right and up
      sides.push([(-(ny - py) / length) * width * 0.5, ((nx - px) / length) * width * 0.5]);
    }
    const look = packed(Shape.Ribbon, flow % 4);
    const [red, green, blue] = tintOf(colour);

    for (let at = 0; at < path.length - 1; at += 1) {
      const from = at / (path.length - 1);
      const to = (at + 1) / (path.length - 1);
      const ends = [
        [path[at], sides[at], from, 1],
        [path[at + 1], sides[at + 1], to, 1],
        [path[at + 1], sides[at + 1], to, -1],
        [path[at], sides[at], from, 1],
        [path[at + 1], sides[at + 1], to, -1],
        [path[at], sides[at], from, -1],
      ] as const;

      this.room();
      for (const [spot, side, along, way] of ends) {
        this.vertex(
          spot,
          side[0] * way,
          side[1] * way,
          along,
          way,
          red,
          green,
          blue,
          alpha,
          look,
          light.add ?? 1,
          0,
          this.lift,
        );
      }
    }
  }

  /** Hand over what was written this frame. */
  end(): void {
    this.buffer.clearUpdateRanges();
    if (this.filled > 0) {
      this.buffer.addUpdateRange(0, this.filled * STRIDE);
      this.buffer.needsUpdate = true;
    }
    this.mesh.geometry.setDrawRange(0, this.filled);
    this.mesh.visible = this.filled > 0;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  /** Where a spot lands on the element, in pixels with up positive */
  private onPicture(spot: Spot): [number, number] {
    const m = this.matrix;
    const w = m[12] * spot[0] + m[13] * spot[1] + m[14] * spot[2] + m[15];
    const x = m[0] * spot[0] + m[1] * spot[1] + m[2] * spot[2] + m[3];
    const y = m[4] * spot[0] + m[5] * spot[1] + m[6] * spot[2] + m[7];

    return [((x / w) * this.screen.width) / 2, ((y / w) * this.screen.height) / 2];
  }

  /** How many element pixels a field unit is worth at a spot */
  private worthAt(spot: Spot): number {
    const m = this.matrix;
    const w = m[12] * spot[0] + m[13] * spot[1] + m[14] * spot[2] + m[15];

    return this.lens / Math.max(1e-6, w);
  }

  private square(
    at: Spot,
    radius: number,
    turn: number,
    look: number,
    colour: string,
    alpha: number,
    add: number,
    lying: boolean,
  ): void {
    if (lying) {
      this.lay(at, radius, 1, 0, 0, 1, look, colour, alpha, add);
      return;
    }
    this.quad(at, radius, radius, turn, look, colour, alpha, add);
  }

  private quad(
    at: Spot,
    long: number,
    wide: number,
    turn: number,
    look: number,
    colour: string,
    alpha: number,
    add: number,
  ): void {
    if (alpha <= 0 || long <= 0 || wide <= 0) {
      return;
    }
    const [red, green, blue] = tintOf(colour);
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);

    this.room();
    for (const [u, v] of QUAD) {
      const x = u * long;
      const y = v * wide;

      this.vertex(
        at,
        x * cos - y * sin,
        x * sin + y * cos,
        u,
        v,
        red,
        green,
        blue,
        alpha,
        look,
        add,
        0,
        this.lift,
      );
    }
  }

  /** A quad flat on the ground, its uv x along (ux, uz) and y along (vx, vz) */
  private lay(
    at: Spot,
    size: number,
    ux: number,
    uz: number,
    vx: number,
    vz: number,
    look: number,
    colour: string,
    alpha: number,
    add = 1,
  ): void {
    if (alpha <= 0 || size <= 0) {
      return;
    }
    const [red, green, blue] = tintOf(colour);
    // On the floor, or a ring laid level round something above it
    const ground: Spot = [at[0], Math.max(0.02, at[1]), at[2]];

    this.room();
    for (const [u, v] of QUAD) {
      this.vertex(
        ground,
        (u * ux + v * vx) * size,
        (u * uz + v * vz) * size,
        u,
        v,
        red,
        green,
        blue,
        alpha,
        look,
        add,
        1,
        0,
      );
    }
  }

  private vertex(
    at: Spot,
    cornerX: number,
    cornerY: number,
    u: number,
    v: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
    look: number,
    add: number,
    lying: number,
    lift: number,
  ): void {
    const to = this.filled * STRIDE;
    const into = this.vertices;

    into[to] = at[0];
    into[to + 1] = at[1];
    into[to + 2] = at[2];
    into[to + 3] = cornerX;
    into[to + 4] = cornerY;
    into[to + 5] = u;
    into[to + 6] = v;
    into[to + 7] = red;
    into[to + 8] = green;
    into[to + 9] = blue;
    into[to + 10] = Math.max(0, Math.min(1, alpha));
    into[to + 11] = look;
    into[to + 12] = lying;
    into[to + 13] = add;
    into[to + 14] = lift;
    this.filled += 1;
  }

  private room(): void {
    if ((this.filled + 6) * STRIDE <= this.vertices.length) {
      return;
    }
    const grown = new Float32Array(this.vertices.length * 2);

    grown.set(this.vertices);
    this.vertices = grown;
    this.buffer = EffectBatch.bufferOf(grown);
    this.mesh.geometry.dispose();
    this.attach();
  }
}
