/**
 * How a Pokemon Mystery Dungeon tileset rip is laid out.
 *
 * Everything else about one of these sheets is measured off it. These
 * two are the parts written across the top in English and in the
 * caption underneath, which no amount of looking at pixels recovers,
 * so they are offered as a starting point and the form lets them be
 * changed.
 */

/** The terrain columns in the order they sit, each naming its palette. */
export const DEFAULT_TERRAINS =
  'walls-a/0 walls-b/1 wall-alt-1-a/0 wall-alt-1-b/1 wall-alt-2-a/0 wall-alt-2-b/1 ground-a/0 ground-b/1 water/2 water-sparkle/3';

/**
 * How long one palette frame is held, in game frames at 60 a second,
 * one per palette. The sheets print these in a box of their own, and
 * the two palettes of a rip do not have to agree
 */
export const DEFAULT_SPEEDS = '8';

/**
 * The roles a board draws with, and so the ones a pack has to fill.
 * Shared rather than server-side, because the form offers one field
 * per role and the canvas asks by the same names
 */
export type DrawnRole = 'wall' | 'ground' | 'water';

export const DRAWN_ROLES: DrawnRole[] = ['wall', 'ground', 'water'];
