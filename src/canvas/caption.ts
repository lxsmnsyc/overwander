/**
 * The little label in the corner of a map.
 *
 * Both maps say the same thing about wherever they are pointed — the
 * ground and the coordinates — and both say it in the picture rather
 * than beside it, so both draw it the same way and from here.
 *
 * It is a badge rather than outlined text. Text with a stroke around
 * it reads over anything, but at this size the stroke is most of the
 * letter; a plate behind it keeps the letters thin and still lifts
 * them off whatever colour the ground happens to be.
 */

const FONT_SIZE = 11;
const FONT = `600 ${FONT_SIZE}px ui-sans-serif, system-ui, sans-serif`;

/**
 * How far the badge sits from the corner, and how much of it is the
 * plate rather than the words
 */
const INSET = 6;
const PADDING_X = 6;
const PADDING_Y = 4;
const RADIUS = 5;

const PLATE = 'rgba(17, 20, 24, 0.62)';
const INK = '#f6f5f2';

export default function drawCaption(context: CanvasRenderingContext2D, text: string): void {
  if (text === '') {
    return;
  }

  context.font = FONT;
  context.textAlign = 'left';
  context.textBaseline = 'top';

  const width = context.measureText(text).width + PADDING_X * 2;
  const height = FONT_SIZE + PADDING_Y * 2;

  context.fillStyle = PLATE;
  context.beginPath();
  context.roundRect(INSET, INSET, width, height, RADIUS);
  context.fill();

  context.fillStyle = INK;
  context.fillText(text, INSET + PADDING_X, INSET + PADDING_Y);
}
