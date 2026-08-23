/**
 * What a piece of ground is, as far as drawing it is concerned.
 *
 * A rip carries several walls and two grounds under different
 * palettes. A board wants one of each, so every terrain column is
 * filed under what it is for and the board asks by that rather than by
 * the name the artist gave it.
 */

export type TerrainRole = 'wall' | 'ground' | 'water' | 'other';

/** The word in a terrain's name that says what it is. */
const NAMED: [word: string, role: TerrainRole][] = [
  ['wall', 'wall'],
  ['ground', 'ground'],
  ['water', 'water'],
];

/**
 * What a terrain column is for, taken from the words in its name.
 *
 * A name holding two of them is a **transition** and is neither: the
 * rips carry a `water-ground` column for the shore, and read as water
 * it would be picked ahead of the open sea and drawn across a whole
 * chunk. A name holding none is carried through rather than refused,
 * since an extra terrain is harmless where a missing one is not
 */
export function roleFromName(name: string): TerrainRole {
  const words = name.toLowerCase().split(/[^a-z]+/);
  const found = new Set<TerrainRole>();

  for (const [word, role] of NAMED) {
    if (words.some((part) => part.startsWith(word))) {
      found.add(role);
    }
  }
  return found.size === 1 ? [...found][0] : 'other';
}

/**
 * Whether a neighbour counts as the same ground for the purpose of
 * drawing this cell's edges.
 *
 * Water reads as ground to the shore beside it, which is the rips'
 * own note: counted as different, every coast would be drawn with the
 * ledge that belongs at the foot of a wall. It is one-sided on
 * purpose, so the water still gets its shoreline
 */
export function joins(self: TerrainRole, neighbour: TerrainRole): boolean {
  return self === neighbour || (self === 'ground' && neighbour === 'water');
}
