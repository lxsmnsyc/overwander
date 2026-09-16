/**
 * Integer hashing for anything the world derives from where it is.
 *
 * Every function here is pure: the same numbers in give the same
 * number out, on every machine, with nothing carried between calls.
 * That is what lets a decision own its own key rather than a place in
 * a stream, so adding one decision cannot shift another.
 */

/** One Murmur3 round, folding a 32-bit word into the running hash */
function round(hash: number, word: number): number {
  let k = Math.imul(word | 0, 0xcc9e2d51);

  k = (k << 15) | (k >>> 17);
  k = Math.imul(k, 0x1b873593);

  const h = hash ^ k;

  return (Math.imul((h << 13) | (h >>> 19), 5) + 0xe6546b64) | 0;
}

/** Murmur3's finaliser, which spreads every input bit across the output */
function finish(hash: number, words: number): number {
  let h = hash ^ words;

  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** An unsigned 32-bit hash of two integers */
export function hash2(a: number, b: number): number {
  return finish(round(round(0, a), b), 2);
}

/** An unsigned 32-bit hash of three integers */
export function hash3(a: number, b: number, c: number): number {
  return finish(round(round(round(0, a), b), c), 3);
}

/** FNV-1a over a string, for folding a text key into an integer once */
export function hashString(text: string): number {
  let hash = 0x811c9dc5;

  for (let at = 0; at < text.length; at++) {
    hash = Math.imul(hash ^ text.charCodeAt(at), 16777619);
  }
  return hash >>> 0;
}

/**
 * Murmur3 over a string's characters from a seed of its own. Asked
 * alongside `hashString`, the two together are a 64-bit fold of the
 * text, which is what keeps millions of keys from sharing one
 */
export function hashStringFrom(text: string, seed: number): number {
  let hash = seed | 0;

  for (let at = 0; at < text.length; at++) {
    hash = round(hash, text.charCodeAt(at));
  }
  return finish(hash, text.length);
}

/** A hash as a number in [0, 1), the shape a roll is written against */
export function toUnit(hash: number): number {
  return hash / 0x100000000;
}
