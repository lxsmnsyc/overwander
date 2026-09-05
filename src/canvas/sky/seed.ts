/** The one random this file has: a hash, so a sky is the same sky every frame */
/**
 * A number between 0 and 1 that is always the same for the same seed.
 *
 * The sky is derived rather than stored, and a meteor is no different:
 * every watcher of the same second sees the same one cross. It is the
 * one-argument cousin of `scatter` below, which salts an index instead
 */
export default function seeded(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43_758.545;

  return value - Math.floor(value);
}
