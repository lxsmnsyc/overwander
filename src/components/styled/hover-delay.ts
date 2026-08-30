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
 * a way that moving a pointer over it is not.
 */
export const OPEN_DELAY = 400;
export const CLOSE_DELAY = 400;
