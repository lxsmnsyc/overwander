/**
 * How big the window on the world is that a player walks in the middle
 * of.
 *
 * Two sizes rather than one, because the board does two things and
 * they want different distances: how much of the world is drawn, and
 * how much of it the player is actually standing in.
 *
 * It is here rather than with the projection because both the canvas,
 * which lays it back under the camera, and the walk, which finds
 * routes across it, need the same numbers and neither owns the other.
 */

/**
 * How many cells fill the picture across its middle: the unit the
 * projection is calibrated to, and so what decides how steeply the
 * ground recedes. Odd, so there is a true middle cell for the player
 * to stand on
 */
export const BOARD_SPAN = 21;

/**
 * How far the board reaches, in cells: what the player may press, what
 * the grid is ruled over, which chunks are asked for windows, and how
 * near a pokemon has to be to be standing there. All the one distance,
 * so that everywhere a player can act on is somewhere things happen.
 *
 * A circle rather than a square: a square board is a square of
 * country, and a corner of one is both the furthest a player can see
 * and the least useful place to see it, since nothing is ever reached
 * diagonally
 */
export const BOARD_RADIUS = BOARD_SPAN / 2;

/**
 * How far the country is drawn, in cells: past the edge of the picture
 * on every side, so a player looks out over the world rather than at a
 * board of it laid on a coloured page
 */
export const VIEW_RADIUS = 20;

/**
 * The square all of that is indexed in, and its middle. Wide enough to
 * hold the drawn circle, since a cell of the board is one number and a
 * number cannot be negative
 */
export const BOARD_CELLS = VIEW_RADIUS * 2 + 1;
export const BOARD_CENTER = VIEW_RADIUS;
export const BOARD_COUNT = BOARD_CELLS * BOARD_CELLS;
