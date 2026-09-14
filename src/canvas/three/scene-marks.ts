import {
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  DoubleSide,
  DstColorFactor,
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

/** One stretch of the buffer drawn from a single sheet, one way. */
interface Run {
  sheet: QuadSheet | null;
  sampling: QuadSampling;
  blend: QuadBlend;
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
class MarkLayer {
  readonly mesh: Mesh<BufferGeometry, Material[]>;
  vertices = new Float32Array(ROOM * 6 * STRIDE);
  filled = 0;
  readonly runs: Run[] = [];

  constructor(order: number) {
    const geometry = new BufferGeometry();

    geometry.setAttribute('spot', new BufferAttribute(new Float32Array(0), 3));
    geometry.setAttribute('uv', new BufferAttribute(new Float32Array(0), 2));
    geometry.setAttribute('tint', new BufferAttribute(new Float32Array(0), 4));
    this.mesh = new Mesh<BufferGeometry, Material[]>(geometry, []);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = order;
  }

  room(): void {
    if ((this.filled + 6) * STRIDE > this.vertices.length) {
      const grown = new Float32Array(this.vertices.length * 2);

      grown.set(this.vertices);
      this.vertices = grown;
    }
  }

  /** Hand over whatever has been written, one group per run. */
  finish(materialOf: (run: Run) => RawShaderMaterial): void {
    const geometry = this.mesh.geometry;

    if (geometry.getAttribute('spot').count < this.filled) {
      geometry.setAttribute('spot', new BufferAttribute(new Float32Array(this.filled * 3), 3));
      geometry.setAttribute('uv', new BufferAttribute(new Float32Array(this.filled * 2), 2));
      geometry.setAttribute('tint', new BufferAttribute(new Float32Array(this.filled * 4), 4));
    }
    const places = geometry.getAttribute('spot');
    const uvs = geometry.getAttribute('uv');
    const tints = geometry.getAttribute('tint');

    for (let vertex = 0; vertex < this.filled; vertex += 1) {
      const at = vertex * STRIDE;

      places.setXYZ(vertex, this.vertices[at], this.vertices[at + 1], this.vertices[at + 2]);
      uvs.setXY(vertex, this.vertices[at + 3], this.vertices[at + 4]);
      tints.setXYZW(
        vertex,
        this.vertices[at + 5],
        this.vertices[at + 6],
        this.vertices[at + 7],
        this.vertices[at + 8],
      );
    }
    places.needsUpdate = true;
    uvs.needsUpdate = true;
    tints.needsUpdate = true;
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
  private readonly blank = blankSheet();
  /** How near the viewer whatever is written next lies */
  private near = 0;
  /** And how near its top edge is, for a picture standing up in the world */
  private high = 0;
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

    this.solid(
      colour,
      [
        { x: from.x + nx, y: from.y + ny },
        { x: to.x + nx, y: to.y + ny },
        { x: to.x - nx, y: to.y - ny },
        { x: from.x - nx, y: from.y - ny },
      ],
      alpha,
      blend,
    );
  }

  outline(colour: string, corners: QuadPoint[], width: number, alpha = 1): void {
    for (let corner = 0; corner < corners.length; corner++) {
      this.line(colour, corners[corner], corners[(corner + 1) % corners.length], width, alpha);
    }
  }

  triangle(colour: string, corners: QuadPoint[], alpha = 1, blend: QuadBlend = 'over'): void {
    this.solid(colour, [corners[0], corners[1], corners[2], corners[2]], alpha, blend);
  }

  /** Hand over whatever has been written, in both layers. */
  end(): void {
    this.board.finish((run) => this.materialOf(run));
    this.glazing.finish((run) => this.materialOf(run));
  }

  /** Say that a sheet has been drawn into since it was uploaded. */
  invalidate(sheet: QuadSheet): void {
    for (const sampling of ['pixels', 'smooth'] as const) {
      const held = this.textures.get(this.keyOf(sheet, sampling));

      if (held != null) {
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
    this.board.mesh.geometry.dispose();
    this.glazing.mesh.geometry.dispose();
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
    const made = new Texture(sheet ?? this.blank);

    // Top left rather than bottom left, so a source rectangle is the
    // same one the page was cut with
    made.flipY = false;
    made.magFilter = sampling === 'smooth' ? LinearFilter : NearestFilter;
    made.minFilter = made.magFilter;
    made.generateMipmaps = false;
    made.needsUpdate = true;
    this.textures.set(key, made);
    return made;
  }

  /**
   * How a run meets the picture. Every source is premultiplied and the
   * alpha channel is always plain source-over, so a wash never eats
   * the picture's own opacity
   */
  private materialOf(run: Run): RawShaderMaterial {
    const key = `${this.keyOf(run.sheet, run.sampling)}|${run.blend}`;
    const known = this.materials.get(key);

    if (known != null) {
      return known;
    }
    const made = new RawShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
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
      // lies on, and two of them on one cell are both meant to show
      depthWrite: false,
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

    if (last?.sheet === sheet && last.sampling === sampling && last.blend === blend) {
      last.length += 6;
    } else {
      layer.runs.push({ sheet, sampling, blend, start: layer.filled, length: 6 });
    }
    // Ring order in, two triangles out: the far corner is shared by
    // both, so it is written first in each
    const order = [0, 1, 2, 0, 2, 3];
    const us = [left, right, right, left];
    const vs = [top, top, bottom, bottom];
    // Premultiplied throughout, so what is left of a carried board is
    // taken out of the colour as well as the alpha
    const fade = this.carryAlpha;
    const zoom = this.carryScale;

    for (const corner of order) {
      const at = layer.filled * STRIDE;

      layer.vertices[at] = corners[corner].x * zoom + this.carryX;
      layer.vertices[at + 1] = corners[corner].y * zoom + this.carryY;
      // The first two corners are the top of the box and the last two
      // its foot, which is the order a quad's ring comes in
      layer.vertices[at + 2] = corner <= 1 ? this.high : this.near;
      layer.vertices[at + 3] = us[corner];
      layer.vertices[at + 4] = vs[corner];
      layer.vertices[at + 5] = red * fade;
      layer.vertices[at + 6] = green * fade;
      layer.vertices[at + 7] = blue * fade;
      layer.vertices[at + 8] = alpha * fade;
      layer.filled += 1;
    }
  }
}
