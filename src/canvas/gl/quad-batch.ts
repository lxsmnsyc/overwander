/**
 * Textured quads, drawn a few hundred at a time.
 *
 * The board's ground is 324 tiles laid on a tilted grid, and a 2D
 * context charges for each of them: a save, a skewed transform, a
 * blit and a restore, every frame, whatever size the window is. Here
 * they are written into one buffer and handed over in a handful of
 * calls, one per sheet they came from.
 *
 * Everything is in the canvas's own CSS pixels, the same coordinates
 * the 2D passes use, so a caller projects a cell exactly as it did
 * before and passes the four corners it already had.
 */

import parseColour from './colour';

/** A corner, in canvas pixels. */
export interface QuadPoint {
  x: number;
  y: number;
}

/** The part of a sheet a quad is cut from, in that sheet's pixels. */
export interface QuadSource {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What a sheet can be: the tilesets recolour into canvases. */
export type QuadSheet = HTMLCanvasElement | HTMLImageElement | ImageBitmap;

const VERTEX = `#version 300 es
in vec2 spot;
in vec2 uv;
in vec4 tint;
uniform vec2 viewport;
out vec2 pass_uv;
out vec4 pass_tint;

void main() {
  pass_uv = uv;
  pass_tint = tint;
  // Canvas pixels to clip space, with y flipped: the page counts down
  // from the top and the device counts up from the bottom
  vec2 clip = spot / viewport * 2.0 - 1.0;

  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
in vec2 pass_uv;
in vec4 pass_tint;
uniform sampler2D sheet;
out vec4 colour;

void main() {
  colour = texture(sheet, pass_uv) * pass_tint;
}`;

/** Position, texture coordinate and tint: eight floats a vertex. */
const STRIDE = 8;
const PER_QUAD = 6 * STRIDE;

/** How many quads the buffer starts with. It grows, and never shrinks */
const ROOM = 512;

/**
 * How many sheets may sit unused before the cache is swept. A biome's
 * tileset is a few dozen recoloured canvases, and walking into another
 * biome strands every one of them
 */
const SHEET_LIMIT = 64;

/** How many frames a sheet may go untouched before it is let go. */
const SHEET_PATIENCE = 600;

interface Held {
  texture: WebGLTexture;
  /** The frame it was last drawn on, for sweeping */
  used: number;
  /** Whether the sheet has been drawn into since this was uploaded */
  stale: boolean;
}

/**
 * How a sheet is sampled. Pixel art is drawn at its own edges, and a
 * shape scaled down to a few pixels is not
 */
export type QuadSampling = 'pixels' | 'smooth';

/**
 * How a quad meets what is already under it.
 *
 * The two beside `over` are the hour's own: light taken out of the
 * picture and light added to it. They are exact only where what they
 * cover is opaque, which is why the layer paints its own backdrop
 * rather than letting the page show through
 */
export type QuadBlend = 'over' | 'multiply' | 'screen';

/** One stretch of the buffer drawn from a single sheet, one way. */
interface Run {
  texture: WebGLTexture;
  blend: QuadBlend;
  start: number;
  length: number;
}

function compile(gl: WebGL2RenderingContext, kind: number, source: string): WebGLShader | null {
  const shader = gl.createShader(kind);

  if (shader == null) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: WebGL2RenderingContext): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);

  if (vertex == null || fragment == null) {
    return null;
  }

  const program = gl.createProgram();

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  // Attached copies are the program's now, and the program is the only
  // thing that needed them
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default class QuadBatch {
  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly array: WebGLVertexArrayObject;
  private readonly viewport: WebGLUniformLocation | null;

  /** A single opaque texel, which is what a flat colour is drawn with */
  private readonly blank: WebGLTexture;

  private readonly sheets = new Map<QuadSheet, Held>();

  private vertices = new Float32Array(ROOM * PER_QUAD);
  /** How many vertices are written, not how many floats */
  private filled = 0;

  private readonly runs: Run[] = [];
  private runCount = 0;

  /** Bumped once a frame, so an unused sheet can be aged out */
  private stamp = 0;

  /**
   * How far everything written from here is carried, and how much of
   * it is left. A board on its way over a boundary is drawn where it
   * is going rather than where it lives, and the backdrop and the
   * hour's light are not going with it
   */
  private carryX = 0;
  private carryY = 0;
  private carryAlpha = 1;
  private carryScale = 1;

  /**
   * Build one, or answer null where the browser will not give a
   * context: a caller that cannot have this draws the old way
   */
  static create(canvas: HTMLCanvasElement): QuadBatch | null {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      // Never composited by the browser: the board reads this straight
      // back with `drawImage`, in the frame it was drawn in
      preserveDrawingBuffer: false,
    });

    if (gl == null) {
      return null;
    }

    const program = link(gl);

    if (program == null) {
      return null;
    }
    return new QuadBatch(canvas, gl, program);
  }

  private constructor(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
  ) {
    this.gl = gl;
    this.canvas = canvas;
    this.program = program;
    this.buffer = gl.createBuffer();
    this.array = gl.createVertexArray();
    this.viewport = gl.getUniformLocation(program, 'viewport');

    gl.bindVertexArray(this.array);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

    const bytes = STRIDE * 4;
    const spot = gl.getAttribLocation(program, 'spot');
    const uv = gl.getAttribLocation(program, 'uv');
    const tint = gl.getAttribLocation(program, 'tint');

    gl.enableVertexAttribArray(spot);
    gl.vertexAttribPointer(spot, 2, gl.FLOAT, false, bytes, 0);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, bytes, 8);
    gl.enableVertexAttribArray(tint);
    gl.vertexAttribPointer(tint, 4, gl.FLOAT, false, bytes, 16);
    gl.bindVertexArray(null);

    this.blank = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.blank);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }

  /**
   * Size the layer and empty it. `ratio` is real pixels per drawn one,
   * which is the backing store rather than anything the quads see
   */
  begin(width: number, height: number, ratio: number): void {
    const gl = this.gl;
    const across = Math.max(1, Math.round(width * ratio));
    const down = Math.max(1, Math.round(height * ratio));
    const canvas = this.canvas;

    if (canvas.width !== across || canvas.height !== down) {
      canvas.width = across;
      canvas.height = down;
    }
    gl.viewport(0, 0, across, down);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.stamp += 1;
    this.filled = 0;
    this.runCount = 0;
    gl.useProgram(this.program);
    gl.uniform2f(this.viewport, width, height);
    gl.enable(gl.BLEND);
    this.carry(0, 0);
  }

  /**
   * Where everything written from here lands, until it is called
   * again: scaled about the layer's own origin, moved by `x, y`, and
   * drawn at `alpha`. `carry(0, 0)` puts it back.
   *
   * It is what a 2D context would carry in its transform. A board on
   * its way over a boundary uses the move and the fade; a field drawn
   * in its own coordinates and centred on the page uses the scale
   */
  carry(x: number, y: number, alpha = 1, scale = 1): void {
    this.carryX = x;
    this.carryY = y;
    this.carryAlpha = alpha;
    this.carryScale = scale;
  }

  /**
   * A tile cut from a sheet, laid on four corners in ring order.
   * `colour` tints it, for a sheet that carries a shape rather than a
   * picture: one round drop stands in for every drop in the sky
   */
  quad(
    sheet: QuadSheet,
    source: QuadSource,
    corners: QuadPoint[],
    alpha = 1,
    colour?: string,
    sampling: QuadSampling = 'pixels',
    blend: QuadBlend = 'over',
  ): void {
    const held = this.textureOf(sheet, sampling);

    if (held == null) {
      return;
    }
    const tint = colour == null ? null : parseColour(colour);

    if (colour != null && tint == null) {
      return;
    }
    const opacity = alpha * (tint == null ? 1 : tint[3]);
    const red = opacity * (tint == null ? 1 : tint[0]);
    const green = opacity * (tint == null ? 1 : tint[1]);
    const blue = opacity * (tint == null ? 1 : tint[2]);

    // An image reports its laid-out size as `width`; the size that
    // matters is the one it was decoded at
    const width = ('naturalWidth' in sheet ? sheet.naturalWidth : sheet.width) || 1;
    const height = ('naturalHeight' in sheet ? sheet.naturalHeight : sheet.height) || 1;

    this.write(
      held,
      corners,
      source.x / width,
      source.y / height,
      (source.x + source.width) / width,
      (source.y + source.height) / height,
      red,
      green,
      blue,
      opacity,
      blend,
    );
  }

  /**
   * Four corners in one colour, written the way the 2D passes write
   * it. A notation this cannot read draws nothing rather than black
   */
  solid(colour: string, corners: QuadPoint[], alpha = 1, blend: QuadBlend = 'over'): void {
    const read = parseColour(colour);

    if (read == null) {
      return;
    }
    const opacity = read[3] * alpha;

    this.write(
      this.blank,
      corners,
      0,
      0,
      1,
      1,
      read[0] * opacity,
      read[1] * opacity,
      read[2] * opacity,
      opacity,
      blend,
    );
  }

  /**
   * A straight line of the given width, drawn as the quad it covers.
   * Nothing is mitred: at the widths a grid is ruled in, a join is
   * smaller than the pixel it would be drawn on
   */
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
    // The normal, out to half the width on either side
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

  /**
   * A closed ring of lines round four corners, which is what a stroked
   * quad is. Each edge is drawn whole, so two cells sharing one lay
   * their lines over each other exactly as two stroked paths would
   */
  outline(colour: string, corners: QuadPoint[], width: number, alpha = 1): void {
    for (let corner = 0; corner < corners.length; corner++) {
      this.line(colour, corners[corner], corners[(corner + 1) % corners.length], width, alpha);
    }
  }

  /**
   * Three corners rather than four. Written as a quad with its last
   * corner doubled, which rasterises the one triangle and nothing at
   * all for the second
   */
  triangle(colour: string, corners: QuadPoint[], alpha = 1, blend: QuadBlend = 'over'): void {
    this.solid(colour, [corners[0], corners[1], corners[2], corners[2]], alpha, blend);
  }

  /** Hand over whatever has been written, one call per sheet. */
  end(): void {
    const gl = this.gl;

    if (this.filled === 0) {
      this.sweep();
      return;
    }
    gl.bindVertexArray(this.array);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      this.vertices.subarray(0, this.filled * STRIDE),
      gl.DYNAMIC_DRAW,
    );
    gl.activeTexture(gl.TEXTURE0);

    let mode: QuadBlend | null = null;

    for (let run = 0; run < this.runCount; run++) {
      const stretch = this.runs[run];

      if (stretch.blend !== mode) {
        this.blendAs(stretch.blend);
        mode = stretch.blend;
      }
      gl.bindTexture(gl.TEXTURE_2D, stretch.texture);
      gl.drawArrays(gl.TRIANGLES, stretch.start, stretch.length);
    }
    gl.bindVertexArray(null);
    this.sweep();
  }

  /**
   * Say that a sheet has been drawn into since it was uploaded, so the
   * next quad off it uploads again. The texture is kept and written
   * over rather than thrown away: a sheet that is repainted every
   * frame would otherwise be a texture built and destroyed every frame
   */
  invalidate(sheet: QuadSheet): void {
    const held = this.sheets.get(sheet);

    if (held != null) {
      held.stale = true;
    }
  }

  /** Give back everything held, for a context that is going away. */
  dispose(): void {
    const gl = this.gl;

    for (const held of this.sheets.values()) {
      gl.deleteTexture(held.texture);
    }
    this.sheets.clear();
    gl.deleteTexture(this.blank);
    gl.deleteBuffer(this.buffer);
    gl.deleteVertexArray(this.array);
    gl.deleteProgram(this.program);
  }

  /**
   * Two triangles into the buffer, joined to the run before them where
   * they came off the same sheet
   */
  private write(
    texture: WebGLTexture,
    corners: QuadPoint[],
    left: number,
    top: number,
    right: number,
    bottom: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
    blend: QuadBlend,
  ): void {
    this.room();

    const last = this.runCount === 0 ? null : this.runs[this.runCount - 1];

    if (last?.texture === texture && last.blend === blend) {
      last.length += 6;
    } else {
      const fresh = { texture, blend, start: this.filled, length: 6 };

      if (this.runCount < this.runs.length) {
        this.runs[this.runCount] = fresh;
      } else {
        this.runs.push(fresh);
      }
      this.runCount += 1;
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
      const at = this.filled * STRIDE;

      this.vertices[at] = corners[corner].x * zoom + this.carryX;
      this.vertices[at + 1] = corners[corner].y * zoom + this.carryY;
      this.vertices[at + 2] = us[corner];
      this.vertices[at + 3] = vs[corner];
      this.vertices[at + 4] = red * fade;
      this.vertices[at + 5] = green * fade;
      this.vertices[at + 6] = blue * fade;
      this.vertices[at + 7] = alpha * fade;
      this.filled += 1;
    }
  }

  /**
   * How the next run meets the picture. Every source here is
   * premultiplied, and the alpha channel is always plain source-over:
   * only the colour is blended, so a wash never eats the layer's own
   * opacity.
   *
   * `multiply` gives `a*Cs*Cb + (1-a)*Cb` and `screen` gives
   * `Cb + a*Cs - a*Cs*Cb`, which is what a 2D context computes for
   * each of them over an opaque destination
   */
  private blendAs(blend: QuadBlend): void {
    const gl = this.gl;

    if (blend === 'multiply') {
      gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      return;
    }
    if (blend === 'screen') {
      gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_COLOR, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      return;
    }
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  /** Twice the room whenever a quad would not fit in what is left. */
  private room(): void {
    if ((this.filled + 6) * STRIDE <= this.vertices.length) {
      return;
    }
    const grown = new Float32Array(this.vertices.length * 2);

    grown.set(this.vertices);
    this.vertices = grown;
  }

  /**
   * The sheet as a texture, uploaded the first time it is asked for.
   * The tilesets recolour into canvases that are built once and then
   * cycled, so nothing here is re-uploaded frame to frame
   */
  private textureOf(sheet: QuadSheet, sampling: QuadSampling = 'pixels'): WebGLTexture | null {
    const gl = this.gl;
    const known = this.sheets.get(sheet);

    if (known != null) {
      known.used = this.stamp;
      if (known.stale) {
        gl.bindTexture(gl.TEXTURE_2D, known.texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        known.stale = false;
      }
      return known.texture;
    }

    const texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // Pixel art is laid on a tilted board and scaled up, where
    // smoothing is the same mistake as leaving it on in the 2D pass. A
    // shape scaled *down* to a few pixels is the opposite case
    const filter = sampling === 'smooth' ? gl.LINEAR : gl.NEAREST;

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.sheets.set(sheet, { texture, used: this.stamp, stale: false });
    return texture;
  }

  /** Let go of sheets nobody has drawn for a while. */
  private sweep(): void {
    if (this.sheets.size <= SHEET_LIMIT) {
      return;
    }
    for (const [sheet, held] of this.sheets) {
      if (this.stamp - held.used > SHEET_PATIENCE) {
        this.gl.deleteTexture(held.texture);
        this.sheets.delete(sheet);
      }
    }
  }
}
