/**
 * How long a pointer has to mean it.
 *
 * A pointer crossing a row of squares is over each of them for a few
 * milliseconds, and a card that opens on the crossing is a card that
 * opens at every one of them. The wait is what tells resting on
 * something apart from passing over it.
 *
 * The close wait is the other half: it is the gap between the trigger
 * and the card, and between two triggers side by side.
 *
 * A keyboard waits for neither. Tabbing to something is deliberate in
 * a way that moving a pointer over it is not, and neither does a hover
 * card taking over from one already up (see `WARM`).
 *
 * Tooltips wait for nothing at all: a label is read at a glance.
 */
export const OPEN_DELAY = 400;
export const CLOSE_DELAY = 400;

/**
 * How long after a hover card goes the next one still opens at once.
 * Moving from one square to the next is still reading, not crossing
 */
export const WARM = 300;
