import AleaRNG from './alea';

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

/**
 * Diagonal gradients (±1, ±1): their √2 length stretches the classic
 * ±√2/2 range of 2D Perlin noise to exactly [-1, 1]
 */
function grad(hash: number, x: number, y: number): number {
  return ((hash & 1) === 0 ? x : -x) + ((hash & 2) === 0 ? y : -y);
}

/**
 * Seeded 2D Perlin gradient noise: smooth, deterministic values in
 * [-1, 1] with zero at every integer lattice point
 */
export default class PerlinNoise {
  /**
   * The classic doubled permutation table, shuffled by the seed
   */
  private readonly permutation = new Uint8Array(512);

  constructor(seed: string) {
    const rng = new AleaRNG(seed);
    const table = new Uint8Array(256);

    for (let i = 0; i < 256; i++) {
      table[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.random() * (i + 1));
      [table[i], table[j]] = [table[j], table[i]];
    }
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = table[i & 255];
    }
  }

  noise(x: number, y: number): number {
    const cellX = Math.floor(x) & 255;
    const cellY = Math.floor(y) & 255;
    const fracX = x - Math.floor(x);
    const fracY = y - Math.floor(y);

    const u = fade(fracX);
    const v = fade(fracY);

    const p = this.permutation;
    const a = p[cellX] + cellY;
    const b = p[cellX + 1] + cellY;

    return lerp(
      v,
      lerp(u, grad(p[a], fracX, fracY), grad(p[b], fracX - 1, fracY)),
      lerp(u, grad(p[a + 1], fracX, fracY - 1), grad(p[b + 1], fracX - 1, fracY - 1)),
    );
  }
}
