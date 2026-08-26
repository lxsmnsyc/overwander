
/**
 * The picture's own measurements and colours. Everything drawn is laid
 * out in these coordinates whatever the element is sized to.
 */

/**
 * The drawing is done in these coordinates whatever the element is
 * sized to, so nothing has to be recomputed when the page is
 */
export const WIDTH = 640;

export const HEIGHT = 360;

/**
 * How many pixels a field unit is worth at the middle of the field.
 *
 * It is a fixed number on purpose. Fitting the camera to the crowd
 * would make a duel and a twelve-player raid different games — the
 * same pokemon would be drawn at two sizes depending on who else
 * turned up
 */
export const FIELD_UNIT = 6;

/**
 * How big a pokemon is drawn, in field units rather than pixels.
 *
 * Tied to the field's own scale so that pulling the camera back pulls
 * everything back with it: a size fixed in pixels would keep itself
 * while the ground shrank underneath it, and a party spread around a
 * circle would come out as one overlapping smudge
 */
export const PARTY_SLOT = FIELD_UNIT * 2.6;

/**
 * The boss is drawn large, since it is one thing against a party and
 * the size is what says so
 */
export const BOSS_RADIUS = FIELD_UNIT * 5.6;

/**
 * How small a slot is allowed to draw its pokemon. Below this a sprite
 * is a smudge, so a crowded far side lets them overlap rather than
 * shrinking to nothing
 */
export const MIN_RADIUS = 8;

/** The size a slot has to reach before it prints its own name. */
export const NAMED_RADIUS = PARTY_SLOT;

/**
 * How far past its own radius a pokemon answers the pointer, for the
 * few slots with no sheet yet. Anything drawn answers for the box it
 * was actually drawn in
 */
export const HIT_REACH = 1.4;

/**
 * What the field says while the fight's sheets are still coming
 */
export const LOADING_LABEL = 'Loading…';

export const COLORS = {
  field: '#101823',
  mine: '#4c9a6a',
  theirs: '#9a4c5a',
  boss: '#9a5a3c',
  down: '#3a4250',
  health: '#4cc46a',
  hurt: '#c4a24c',
  low: '#c4544c',
  cast: '#4c9ac4',
  channel: '#9a6ac4',
  track: '#26303e',
  text: '#e6ecf5',
} as const;
