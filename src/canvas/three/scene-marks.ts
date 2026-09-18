import {
  BufferGeometry,
  CustomBlending,
  DoubleSide,
  DstColorFactor,
  DynamicDrawUsage,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  LinearFilter,
  type Material,
  Mesh,
  NearestFilter,
  OneFactor,
  OneMinusSrcAlphaFactor,
  OneMinusSrcColorFactor,
  RawShaderMaterial,
  Texture,
  Vector2,
} from 'three';
import parseColour from '../gl/colour';
import type { QuadBlend, QuadPoint, QuadSampling, QuadSheet, QuadSource } from '../gl/quad-batch';

/**
 * The flat marks of the board, drawn inside the scene.
 *
 * Everything that is not the country or a thing standing on it is a
 * quad on the page: the grid, the highlight, a shadow, the hour's
 * light, the weather, the compass. They were written into a layer of
 * their own under the scene, where the ground then covered them, so
 * they are written here instead and depth-tested against it: a mark
 * lying on a cell is hidden by a cliff in front of that cell and
 * covered by whatever stands on it.
 *
 * The page's own coordinates go in, exactly as the batched layer took
 * them, and `depth` says how near the viewer the marks that follow
 * are. That is the only thing a caller has to add: a mark on the
 * ground is given the cell it lies on, and a mark on the glass is
 * given the front or the back of the scene.
 */

/** Position, texture coordinate and tint: nine floats a vertex. */
const STRIDE = 9;

/** How many quads a layer starts with. It grows, and never shrinks */
const ROOM = 1024;

/** How near the viewer the glass is: in front of everything drawn */
const GLASS = -0.99;

/** Ring order in, two triangles out: the first corner is shared by both, so each starts there */
const RING = [0, 1, 2, 0, 2, 3] as const;

/**
 * Corners reused by every line and triangle. A quad is copied into the
 * buffer the moment it is written, so nothing holds on to these
 */
const EDGE: QuadPoint[] = [
  { x: 0, y: 0 },
  { x: 0, y: 0 },
  { x: 0, y: 0 },
  { x: 0, y: 0 },
];
const TRIANGLE: QuadPoint[] = [EDGE[0], EDGE[0], EDGE[0], EDGE[0]];

const VERTEX = `
uniform vec2 viewport;
attribute vec3 spot;
attribute vec2 uv;
attribute vec4 tint;
varying vec2 pass_uv;
varying vec4 pass_tint;

void main() {
  pass_uv = uv;
  pass_tint = tint;
  // Canvas pixels to clip space, with y flipped: the page counts down
  // from the top and the device counts up from the bottom
  vec2 clip = spot.xy / viewport * 2.0 - 1.0;

  gl_Position = vec4(clip.x, -clip.y, spot.z, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D sheet;
varying vec2 pass_uv;
varying vec4 pass_tint;

void main() {
  gl_FragColor = texture2D(sheet, pass_uv) * pass_tint;
}`;

/** The same, for a picture that hides what is behind it: its see-through pixels are left out */
const SOLID_FRAGMENT = `
precision mediump float;
uniform sampler2D sheet;
varying vec2 pass_uv;
varying vec4 pass_tint;

void main() {
  vec4 picked = texture2D(sheet, pass_uv);

  if (picked.a < 0.5) {
    discard;
  }
  gl_FragColor = picked * pass_tint;
}`;

/** One stretch of the buffer drawn from a single sheet, one way. */
interface Run {
  sheet: QuadSheet | null;
  sampling: QuadSampling;
  blend: QuadBlend;
  /** Whether it writes depth, so an effect behind it is hidden */
  solid: boolean;
  start: number;
  length: number;
}

/** The white pixel a flat colour is drawn from. */
function blankSheet(): HTMLCanvasElement {
  const made = document.createElement('canvas');

  made.width = 1;
  made.height = 1;

  const paint = made.getContext('2d');

  if (paint != null) {
    paint.fillStyle = '#ffffff';
    paint.fillRect(0, 0, 1, 1);
  }
  return made;
}

/**
 * One sheet of marks: a buffer, and the mesh it is drawn from.
 *
 * Two of them, because the marks are not all at one place in the
 * picture. The board's own marks are drawn before the pieces standing
 * on it, so a pokemon covers the grid line under its feet the way it
 * always did; the hour's light and the weather are drawn after
 * everything, since they are the glass the world is seen through
 */
/** A buffer the marks are written straight into, laid out as the shader reads it */
function markBuffer(vertices: Float32Array): InterleavedBuffer {
  const buffer = new InterleavedBuffer(vertices, STRIDE);

  // Rewritten every frame, so the driver is told to expect it
  buffer.setUsage(DynamicDrawUsage);
  return buffer;
}

class MarkLayer {
  readonly mesh: Mesh<BufferGeometry, Material[]>;
  vertices = new Float32Array(ROOM * 6 * STRIDE);
  filled = 0;
  readonly runs: Run[] = [];
  private buffer = markBuffer(this.vertices);

  constructor(order: number) {
    this.mesh = new Mesh<BufferGeometry, Material[]>(new BufferGeometry(), []);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = order;
    this.attach();
  }

  /** Point the shader's three attributes at their stretches of the one buffer */
  private attach(): void {
    const geometry = this.mesh.geometry;

    geometry.setAttribute('spot', new InterleavedBufferAttribute(this.buffer, 3, 0));
    geometry.setAttribute('uv', new InterleavedBufferAttribute(this.buffer, 2, 3));
    geometry.setAttribute('tint', new InterleavedBufferAttribute(this.buffer, 4, 5));
  }

  room(): void {
    if ((this.filled + 6) * STRIDE <= this.vertices.length) {
      return;
    }
    const grown = new Float32Array(this.vertices.length * 2);

    grown.set(this.vertices);
    this.vertices = grown;
    this.buffer = markBuffer(grown);
    // A GPU buffer cannot be resized, so the old one is let go before the bigger one is attached
    this.mesh.geometry.dispose();
    this.attach();
  }

  /** Hand over whatever has been written, one group per run. */
  finish(materialOf: (run: Run) => RawShaderMaterial): void {
    const geometry = this.mesh.geometry;

    // Only what this frame wrote is uploaded, not the whole buffer
    this.buffer.clearUpdateRanges();
    if (this.filled > 0) {
      this.buffer.addUpdateRange(0, this.filled * STRIDE);
      this.buffer.needsUpdate = true;
    }
    geometry.setDrawRange(0, this.filled);
    geometry.clearGroups();

    const drawn: Material[] = [];

    for (const run of this.runs) {
      geometry.addGroup(run.start, run.length, drawn.length);
      drawn.push(materialOf(run));
    }
    this.mesh.material = drawn;
    this.mesh.visible = this.filled > 0;
  }
}

/** How many sheets are held before unused ones start being let go */
const SHEET_LIMIT = 64;

/** How many frames a sheet may go undrawn before it is let go, as the flat batch does */
const SHEET_PATIENCE = 600;

export default class SceneMarks {
  /** The board's own marks, and the ones on the glass in front of it */
  private readonly board = new MarkLayer(1);
  private readonly glazing = new MarkLayer(3);
  /** Which of the two is being written into */
  private on = this.board;
  private readonly viewport = new Vector2(1, 1);
  private readonly ids = new WeakMap<object, string>();
  private named = 0;
  private readonly textures = new Map<string, Texture>();
  private readonly materials = new Map<string, RawShaderMaterial>();
  /** The frame each sheet was last drawn on, by its texture key */
  private readonly used = new Map<string, number>();
  private frame = 0;
  private readonly blank = blankSheet();
  /** How near the viewer whatever is written next lies */
  private near = 0;
  /** And how near its top edge is, for a picture standing up in the world */
  private high = 0;
  /** Whether what is written next hides what is drawn behind it later */
  private solidity = false;
  private carryX = 0;
  private carryY = 0;
  private carryAlpha = 1;
  private carryScale = 1;

  /** The meshes they are drawn from, for the scene to hold */
  get meshes(): Mesh<BufferGeometry, Material[]>[] {
    return [this.board.mesh, this.glazing.mesh];
  }

  /** Size the layer and empty it. */
  begin(width: number, height: number): void {
    this.viewport.set(width, height);

    for (const layer of [this.board, this.glazing]) {
      layer.filled = 0;
      layer.runs.length = 0;
    }
    this.on = this.board;
    this.near = 0;
    this.solidity = false;
    this.carry(0, 0);
  }

  /**
   * Whatever is written from here is on the glass: in front of the
   * whole world rather than lying somewhere in it
   */
  glass(): void {
    this.on = this.glazing;
    this.near = GLASS;
    this.high = GLASS;
  }

  /**
   * How near the viewer the marks that follow lie, in clip space: -1 at
   * the front of the scene and 1 at the back. A mark on the ground is
   * given the depth of the cell it lies on, brought a hair nearer so
   * it is not in a tie with the ground it is drawn over
   */
  depth(near: number): void {
    this.on = this.board;
    this.near = near;
    this.high = near;
  }

  /**
   * The depths of a picture standing up on the board: `foot` where it
   * meets the ground and `top` at the top of its box.
   *
   * A sprite is drawn as a flat quad on the page, but it stands in the
   * world, and how near the viewer it is changes up its own height: a
   * tree in front of a step is behind the step at its roots and in
   * front of it at its crown. Given both, the depth across the picture
   * is what an upright thing would have, while the picture itself is
   * drawn square to the page and undistorted
   */
  standing(foot: number, top: number): void {
    this.on = this.board;
    this.near = foot;
    this.high = top;
  }

  /**
   * Whether what follows writes depth. Only a pokemon's own picture
   * should: a move effect behind it is then hidden by it
   */
  opaque(on: boolean): void {
    this.solidity = on;
  }

  /** Where everything written from here lands, until it is called again */
  carry(x: number, y: number, alpha = 1, scale = 1): void {
    this.carryX = x;
    this.carryY = y;
    this.carryAlpha = alpha;
    this.carryScale = scale;
  }

  quad(
    sheet: QuadSheet,
    source: QuadSource,
    corners: QuadPoint[],
    alpha = 1,
    colour?: string,
    sampling: QuadSampling = 'pixels',
    blend: QuadBlend = 'over',
  ): void {
    const tint = colour == null ? null : parseColour(colour);

    if (colour != null && tint == null) {
      return;
    }
    const opacity = alpha * (tint == null ? 1 : tint[3]);
    // An image reports its laid-out size as `width`; the size that
    // matters is the one it was decoded at
    const width = ('naturalWidth' in sheet ? sheet.naturalWidth : sheet.width) || 1;
    const height = ('naturalHeight' in sheet ? sheet.naturalHeight : sheet.height) || 1;

    this.write(
      sheet,
      sampling,
      blend,
      corners,
      source.x / width,
      source.y / height,
      (source.x + source.width) / width,
      (source.y + source.height) / height,
      opacity * (tint == null ? 1 : tint[0]),
      opacity * (tint == null ? 1 : tint[1]),
      opacity * (tint == null ? 1 : tint[2]),
      opacity,
    );
  }

  solid(colour: string, corners: QuadPoint[], alpha = 1, blend: QuadBlend = 'over'): void {
    const read = parseColour(colour);

    if (read == null) {
      return;
    }
    const opacity = read[3] * alpha;

    this.write(
      null,
      'pixels',
      blend,
      corners,
      0,
      0,
      1,
      1,
      read[0] * opacity,
      read[1] * opacity,
      read[2] * opacity,
      opacity,
    );
  }

  line(
    colour: string,
    from: QuadPoint,
    to: QuadPoint,
    width: number,
    alpha = 1,
    blend: QuadBlend = 'over',
  ): void {
    const across = to.x - from.x;
    const down = to.y - from.y;
    const span = Math.hypot(across, down);

    if (span === 0) {
      return;
    }
    const nx = (-down / span) * width * 0.5;
    const ny = (across / span) * width * 0.5;

    EDGE[0].x = from.x + nx;
    EDGE[0].y = from.y + ny;
    EDGE[1].x = to.x + nx;
    EDGE[1].y = to.y + ny;
    EDGE[2].x = to.x - nx;
    EDGE[2].y = to.y - ny;
    EDGE[3].x = from.x - nx;
    EDGE[3].y = from.y - ny;
    this.solid(colour, EDGE, alpha, blend);
  }

  outline(colour: string, corners: QuadPoint[], width: number, alpha = 1): void {
    for (let corner = 0; corner < corners.length; corner++) {
      this.line(colour, corners[corner], corners[(corner + 1) % corners.length], width, alpha);
    }
  }

  triangle(colour: string, corners: QuadPoint[], alpha = 1, blend: QuadBlend = 'over'): void {
    TRIANGLE[0] = corners[0];
    TRIANGLE[1] = corners[1];
    TRIANGLE[2] = corners[2];
    TRIANGLE[3] = corners[2];
    this.solid(colour, TRIANGLE, alpha, blend);
  }

  /** Hand over whatever has been written, in both layers. */
  end(): void {
    this.frame += 1;
    this.board.finish((run) => this.materialOf(run));
    this.glazing.finish((run) => this.materialOf(run));
    this.sweep();
  }

  /**
   * Say that a sheet has been drawn into since it was uploaded. One
   * that changed size is uploaded afresh: three keeps a texture's
   * first size for good and writes later uploads into its corner, which
   * is what stretched and shifted the cave's lamp mask on a phone
   */
  invalidate(sheet: QuadSheet): void {
    for (const sampling of ['pixels', 'smooth'] as const) {
      const key = this.keyOf(sheet, sampling);
      const held = this.textures.get(key);

      if (held == null) {
        continue;
      }
      if (held.userData.width !== sheet.width || held.userData.height !== sheet.height) {
        this.forget(key);
      } else {
        held.needsUpdate = true;
      }
    }
  }

  dispose(): void {
    for (const held of this.textures.values()) {
      held.dispose();
    }
    this.textures.clear();

    for (const held of this.materials.values()) {
      held.dispose();
    }
    this.materials.clear();
    this.used.clear();
    this.board.mesh.geometry.dispose();
    this.glazing.mesh.geometry.dispose();
  }

  /** Let go of sheets nobody has drawn for a while, with the materials that sample them. */
  private sweep(): void {
    if (this.textures.size <= SHEET_LIMIT) {
      return;
    }
    for (const key of this.textures.keys()) {
      if (this.frame - (this.used.get(key) ?? 0) > SHEET_PATIENCE) {
        this.forget(key);
      }
    }
  }

  /** Drop one sheet's texture, with the materials that sample it */
  private forget(key: string): void {
    this.textures.get(key)?.dispose();
    this.textures.delete(key);
    this.used.delete(key);

    for (const [name, material] of this.materials) {
      if (name.startsWith(`${key}|`)) {
        material.dispose();
        this.materials.delete(name);
      }
    }
  }

  private keyOf(sheet: QuadSheet | null, sampling: QuadSampling): string {
    const known = sheet ?? this.blank;
    let id = this.ids.get(known);

    if (id == null) {
      this.named += 1;
      id = `${this.named}`;
      this.ids.set(known, id);
    }
    return `${id}|${sampling}`;
  }

  private textureOf(sheet: QuadSheet | null, sampling: QuadSampling): Texture {
    const key = this.keyOf(sheet, sampling);
    const known = this.textures.get(key);

    if (known != null) {
      return known;
    }
    const image = sheet ?? this.blank;
    const made = new Texture(image);

    // Top left rather than bottom left, so a source rectangle is the
    // same one the page was cut with
    made.flipY = false;
    // Premultiplied on the way in, as the blending expects: left straight,
    // every soft edge (a word's outline, an aura's glow) comes out bright
    made.premultiplyAlpha = true;
    made.magFilter = sampling === 'smooth' ? LinearFilter : NearestFilter;
    made.minFilter = made.magFilter;
    made.generateMipmaps = false;
    made.needsUpdate = true;
    // The size it was stored at, so a resized sheet is known to need a new one
    made.userData = { width: image.width, height: image.height };
    this.textures.set(key, made);
    return made;
  }

  /**
   * How a run meets the picture. Every source is premultiplied and the
   * alpha channel is always plain source-over, so a wash never eats
   * the picture's own opacity
   */
  private materialOf(run: Run): RawShaderMaterial {
    const sheetKey = this.keyOf(run.sheet, run.sampling);
    const key = `${sheetKey}|${run.blend}${run.solid ? '|solid' : ''}`;

    this.used.set(sheetKey, this.frame);
    const known = this.materials.get(key);

    if (known != null) {
      return known;
    }
    const made = new RawShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: run.solid ? SOLID_FRAGMENT : FRAGMENT,
      uniforms: {
        viewport: { value: this.viewport },
        sheet: { value: this.textureOf(run.sheet, run.sampling) },
      },
      transparent: true,
      depthTest: true,
      // Both ways round: a quad's corners come in the order the caller
      // had them, which is clockwise on the page for some and
      // anticlockwise for others
      side: DoubleSide,
      // Written over rather than into: a mark is flat on whatever it
      // lies on, and two of them on one cell are both meant to show.
      // A pokemon's own picture is the exception, so effects behind it hide
      depthWrite: run.solid,
      blending: CustomBlending,
      blendSrc: run.blend === 'multiply' ? DstColorFactor : OneFactor,
      blendDst: run.blend === 'screen' ? OneMinusSrcColorFactor : OneMinusSrcAlphaFactor,
      blendSrcAlpha: OneFactor,
      blendDstAlpha: OneMinusSrcAlphaFactor,
    });

    this.materials.set(key, made);
    return made;
  }

  private write(
    sheet: QuadSheet | null,
    sampling: QuadSampling,
    blend: QuadBlend,
    corners: QuadPoint[],
    left: number,
    top: number,
    right: number,
    bottom: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ): void {
    const layer = this.on;

    layer.room();

    const last = layer.runs.length === 0 ? null : layer.runs[layer.runs.length - 1];

    const solid = this.solidity;

    if (
      last?.sheet === sheet &&
      last.sampling === sampling &&
      last.blend === blend &&
      last.solid === solid
    ) {
      last.length += 6;
    } else {
      layer.runs.push({ sheet, sampling, blend, solid, start: layer.filled, length: 6 });
    }
    // Premultiplied throughout, so what is left of a carried board is
    // taken out of the colour as well as the alpha
    const fade = this.carryAlpha;
    const zoom = this.carryScale;

    for (const corner of RING) {
      const at = layer.filled * STRIDE;

      layer.vertices[at] = corners[corner].x * zoom + this.carryX;
      layer.vertices[at + 1] = corners[corner].y * zoom + this.carryY;
      // The first two corners are the top of the box and the last two
      // its foot, which is the order a quad's ring comes in
      layer.vertices[at + 2] = corner <= 1 ? this.high : this.near;
      // A ring runs top left, top right, bottom right, bottom left
      layer.vertices[at + 3] = corner === 0 || corner === 3 ? left : right;
      layer.vertices[at + 4] = corner <= 1 ? top : bottom;
      layer.vertices[at + 5] = red * fade;
      layer.vertices[at + 6] = green * fade;
      layer.vertices[at + 7] = blue * fade;
      layer.vertices[at + 8] = alpha * fade;
      layer.filled += 1;
    }
  }
}
