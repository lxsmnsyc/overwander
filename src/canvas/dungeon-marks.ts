import type { Direction } from '../overworld/dungeon/floor';

/**
 * The dungeon tiles no sheet has, drawn in code: a spinner's arrow, a
 * barrier, its switch, cracked floor and the hole it becomes, and a
 * ledge's drop. The user asked for these four to be drawn this way
 * rather than waiting on art. Each is painted once per look and laid
 * flat on its cell
 */

/** How many pixels a side each mark is painted at */
const SIZE = 64;

const PAINTED = new Map<string, HTMLCanvasElement>();

function painted(
  key: string,
  paint: (context: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  const held = PAINTED.get(key);

  if (held != null) {
    return held;
  }

  const canvas = document.createElement('canvas');

  canvas.width = SIZE;
  canvas.height = SIZE;

  const context = canvas.getContext('2d');

  if (context != null) {
    paint(context);
  }
  PAINTED.set(key, canvas);
  return canvas;
}

/** Turn the context so that "up" on the canvas points the given way */
function facing(context: CanvasRenderingContext2D, direction: Direction): void {
  context.translate(SIZE / 2, SIZE / 2);
  context.rotate((direction * Math.PI) / 2);
  context.translate(-SIZE / 2, -SIZE / 2);
}

/** A metal plate with a bright arrow down its middle */
export function spinnerMark(direction: Direction): HTMLCanvasElement {
  return painted(`spinner${direction}`, (context) => {
    context.fillStyle = '#3b4250';
    context.fillRect(4, 4, SIZE - 8, SIZE - 8);
    context.strokeStyle = '#1d2129';
    context.lineWidth = 4;
    context.strokeRect(4, 4, SIZE - 8, SIZE - 8);
    facing(context, direction);
    context.fillStyle = '#f5c542';
    for (const top of [12, 30]) {
      context.beginPath();
      context.moveTo(SIZE / 2, top);
      context.lineTo(SIZE - 14, top + 16);
      context.lineTo(SIZE - 22, top + 22);
      context.lineTo(SIZE / 2, top + 10);
      context.lineTo(22, top + 22);
      context.lineTo(14, top + 16);
      context.closePath();
      context.fill();
    }
  });
}

/** Crackling bars across the doorway, or the empty frame once it is open */
export function barrierMark(open: boolean): HTMLCanvasElement {
  return painted(`barrier${open ? 1 : 0}`, (context) => {
    context.fillStyle = '#20242c';
    context.fillRect(0, 26, 8, 12);
    context.fillRect(SIZE - 8, 26, 8, 12);
    if (open) {
      context.strokeStyle = 'rgba(240, 90, 90, 0.35)';
      context.lineWidth = 2;
      context.strokeRect(8, 28, SIZE - 16, 8);
      return;
    }
    context.fillStyle = 'rgba(240, 70, 70, 0.55)';
    context.fillRect(8, 24, SIZE - 16, 16);
    context.strokeStyle = '#ffd0d0';
    context.lineWidth = 2;
    for (const y of [27, 32, 37]) {
      context.beginPath();
      for (let x = 8; x <= SIZE - 8; x += 6) {
        context.lineTo(x, y + (x % 12 === 0 ? -2 : 2));
      }
      context.stroke();
    }
  });
}

/** A floor panel with a lamp: red before the first flip, green after */
export function switchMark(flipped: boolean): HTMLCanvasElement {
  return painted(`switch${flipped ? 1 : 0}`, (context) => {
    context.fillStyle = '#5b6270';
    context.fillRect(12, 12, SIZE - 24, SIZE - 24);
    context.strokeStyle = '#262a33';
    context.lineWidth = 4;
    context.strokeRect(12, 12, SIZE - 24, SIZE - 24);
    context.fillStyle = flipped ? '#5be07a' : '#e05b5b';
    context.beginPath();
    context.arc(SIZE / 2, SIZE / 2, 10, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(255, 255, 255, 0.6)';
    context.beginPath();
    context.arc(SIZE / 2 - 3, SIZE / 2 - 3, 3, 0, Math.PI * 2);
    context.fill();
  });
}

/** Cracks across the floor, or the hole left once it gave way */
export function crackedMark(broken: boolean): HTMLCanvasElement {
  return painted(`cracked${broken ? 1 : 0}`, (context) => {
    if (broken) {
      context.fillStyle = '#050608';
      context.beginPath();
      const rim = [
        [10, 14],
        [24, 6],
        [40, 10],
        [56, 8],
        [58, 26],
        [54, 44],
        [58, 56],
        [40, 58],
        [22, 54],
        [8, 58],
        [6, 36],
      ];

      for (const [x, y] of rim) {
        context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
      context.strokeStyle = '#3a3a40';
      context.lineWidth = 3;
      context.stroke();
      return;
    }
    context.strokeStyle = 'rgba(20, 20, 24, 0.75)';
    context.lineWidth = 2;
    for (const line of [
      [
        [8, 20],
        [22, 26],
        [30, 18],
        [44, 30],
        [58, 24],
      ],
      [
        [22, 26],
        [26, 42],
        [18, 56],
      ],
      [
        [44, 30],
        [42, 46],
        [54, 58],
      ],
    ]) {
      context.beginPath();
      for (const [x, y] of line) {
        context.lineTo(x, y);
      }
      context.stroke();
    }
  });
}

/** A ledge's lip, shaded on the side it drops away to */
export function ledgeMark(direction: Direction): HTMLCanvasElement {
  return painted(`ledge${direction}`, (context) => {
    facing(context, (direction + 2) % 4);
    context.fillStyle = 'rgba(0, 0, 0, 0.45)';
    context.fillRect(0, 44, SIZE, 20);
    context.fillStyle = '#8a6a42';
    context.fillRect(0, 38, SIZE, 8);
    context.fillStyle = '#b8935e';
    context.fillRect(0, 36, SIZE, 3);
  });
}
