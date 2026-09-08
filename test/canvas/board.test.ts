import { describe, expect, it } from 'vitest';
import {
  ASPECT,
  BOARD_CELLS,
  BOARD_CENTER,
  BOARD_RADIUS,
  BORDER_CELLS,
  PAINT_CELLS,
  PITCH,
  SPRITE_FACINGS,
  VIEW_RADIUS,
  boardCellAtFraction,
  boardCells,
  boardIndexOf,
  cellAtFraction,
  compassMarks,
  facingFrom,
  fitPicture,
  isBoardCell,
  paintOrder,
  projectBoardCell,
  projectBoardCellQuad,
  projectCell,
  projectCellQuad,
  projectGround,
  reachOf,
  unprojectGround,
  viewCells,
  yawTurns,
} from '../../src/canvas/board';
/** Every cell of the board, by index */
const BOARD = boardCells().map((cell) => cell.y * BOARD_CELLS + cell.x);

describe('the board projection', () => {
  it('lays the ground back under the camera', () => {
    // Not straight down any more, and not edge-on either
    expect(PITCH).toBeGreaterThan(0);
    expect(PITCH).toBeLessThan(90);

    // The picture is wider than it is deep, because the depth is what
    // the tilt foreshortens
    expect(ASPECT).toBeLessThan(1);

    const far = projectGround({ u: 1, v: 0 }).x - projectGround({ u: 0, v: 0 }).x;
    const near = projectGround({ u: 1, v: 1 }).x - projectGround({ u: 0, v: 1 }).x;

    // A trapezoid rather than a squashed square: the row at the back
    // is narrower than the row at the front
    expect(far).toBeLessThan(near);
    // ...and things standing on it are drawn smaller the further back
    // they are
    expect(projectGround({ u: 0.5, v: 0 }).scale).toBeLessThan(
      projectGround({ u: 0.5, v: 1 }).scale,
    );
  });

  it('reads back exactly, which is what makes the board pressable', () => {
    let worst = 0;

    for (let across = 0; across <= 20; across++) {
      for (let back = 0; back <= 20; back++) {
        const point = { u: across / 20, v: back / 20 };
        const there = projectGround(point);
        const home = unprojectGround(there.x, there.y);

        worst = Math.max(worst, Math.abs(home.u - point.u), Math.abs(home.v - point.v));
      }
    }

    // Solved rather than sampled, so the only error is the one
    // floating point brings
    expect(worst).toBeLessThan(1e-9);
  });

  it('puts the middle of every cell back in that cell', () => {
    for (const index of BOARD) {
      const middle = projectCell(index);

      expect(cellAtFraction(middle.x, middle.y), `cell ${index}`).toBe(index);
    }
  });

  it('draws every cell inside the picture, corners and all', () => {
    for (const index of BOARD) {
      for (const corner of projectCellQuad(index)) {
        expect(corner.x).toBeGreaterThanOrEqual(0);
        expect(corner.x).toBeLessThanOrEqual(1);
        expect(corner.y).toBeGreaterThanOrEqual(0);
        expect(corner.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it('answers nothing for a press beside the board', () => {
    // The picture is a rectangle and the board inside it is not, so
    // the far corners are ground the player is not standing on
    expect(cellAtFraction(0.01, 0.01)).toBeNull();
    expect(cellAtFraction(0.99, 0.01)).toBeNull();
    // And past the edges entirely
    expect(cellAtFraction(-0.2, 0.5)).toBeNull();
    expect(cellAtFraction(0.5, 1.4)).toBeNull();
  });

  it('keeps the rows in order from the back of the board forwards', () => {
    // Which is what the painter relies on to let a pokemon in front
    // stand over the one behind it
    for (let row = 1; row < BOARD_CELLS; row++) {
      const behind = projectCell((row - 1) * BOARD_CELLS + BOARD_CENTER);
      const front = projectCell(row * BOARD_CELLS + BOARD_CENTER);

      expect(front.y).toBeGreaterThan(behind.y);
      expect(front.scale).toBeGreaterThan(behind.scale);
    }
  });
});

describe('fitting the picture to a screen', () => {
  it('keeps its proportions whatever shape the screen is', () => {
    for (const [width, height] of [
      [1280, 720],
      [390, 844],
      [1024, 1024],
      [2560, 1080],
    ]) {
      const frame = fitPicture(width, height);

      expect(frame.height / frame.width, `${width}x${height}`).toBeCloseTo(ASPECT, 6);
      // Inside the screen, and off its edges: a board fitted to the
      // last pixel loses its far corner as soon as it is turned
      expect(frame.x).toBeGreaterThan(0);
      expect(frame.y).toBeGreaterThan(0);
      expect(frame.x + frame.width).toBeLessThan(width);
      // ...and clear of the bottom by more than the top, since the
      // menu stands there
      expect(height - (frame.y + frame.height)).toBeGreaterThan(frame.y);
    }
  });

  it('is as large as the screen allows', () => {
    // Wide screens are held by their height and tall ones by their
    // width, which is the whole of what fitting means
    expect(fitPicture(4000, 720).height).toBeGreaterThan(600);
    expect(fitPicture(400, 4000).width).toBeGreaterThan(360);
    // Twice the screen is twice the picture
    expect(fitPicture(2560, 1440).width).toBeCloseTo(fitPicture(1280, 720).width * 2, 6);
  });
});

describe('the country drawn past the board', () => {
  it('is a good deal wider than what the player can press', () => {
    const painted = viewCells();

    expect(VIEW_RADIUS).toBeGreaterThan(BOARD_RADIUS);
    expect(painted.length).toBeGreaterThan(boardCells().length * 2);
    for (const cell of painted) {
      expect(reachOf(cell)).toBeLessThanOrEqual(VIEW_RADIUS);
    }
    // Everything the player can press is country they can see
    for (const cell of boardCells()) {
      expect(painted).toContainEqual(cell);
    }
  });

  it('runs off the picture on every side', () => {
    // Which is what fills the screen: the picture is fitted round the
    // board, and the country carries on past it
    for (const way of [
      { x: BOARD_CENTER, y: 0 },
      { x: 0, y: BOARD_CENTER },
      { x: BOARD_CELLS - 1, y: BOARD_CENTER },
      { x: BOARD_CENTER, y: BOARD_CELLS - 1 },
    ]) {
      const drawn = projectBoardCell(way);

      expect(drawn.x < 0 || drawn.x > 1 || drawn.y < 0 || drawn.y > 1).toBe(true);
    }
  });

  it('reaches further than the board can slide between steps', () => {
    // The camera falls at most one whole cell behind a step
    expect(PAINT_CELLS).toBeGreaterThan(BORDER_CELLS);
  });
});

describe('the camera the ground is drawn through', () => {
  it('takes its own shift back out of a reading off the picture', () => {
    const shift: [number, number] = [0.4, -0.6];

    for (const cell of [
      { x: BOARD_CENTER, y: BOARD_CENTER - 5 },
      { x: BOARD_CENTER + 4, y: BOARD_CENTER + 3 },
      { x: BOARD_CENTER, y: BOARD_CENTER + 5 },
    ]) {
      // Drawn where the camera puts it, and read back as the cell it
      // actually is: a player pressing a square presses what they see
      const drawn = projectBoardCell({ x: cell.x + shift[0], y: cell.y + shift[1] });

      expect(boardCellAtFraction(drawn.x, drawn.y, 0, shift)).toEqual(cell);
    }
  });
});

describe('the circle the board is', () => {
  it('is as far in every direction, and cuts the corners off', () => {
    const cells = boardCells();

    // A square board would be a square of country, and its corners
    // both the furthest a player can see and the least useful place
    // to see it, since nothing is ever reached diagonally
    expect(cells.length).toBeLessThan(BOARD_CELLS * BOARD_CELLS);
    expect(cells.length).toBeGreaterThan(Math.PI * (BOARD_RADIUS - 1) ** 2);
    expect(cells.length).toBeLessThan(Math.PI * (BOARD_RADIUS + 1) ** 2);

    for (const cell of cells) {
      expect(reachOf(cell)).toBeLessThanOrEqual(BOARD_RADIUS);
    }
    // The corners of the square are country rather than board, and
    // so is anything further out than the reach
    expect(isBoardCell({ x: 0, y: 0 })).toBe(false);
    expect(isBoardCell({ x: BOARD_CENTER, y: BOARD_CENTER - Math.floor(BOARD_RADIUS) })).toBe(true);
    expect(isBoardCell({ x: BOARD_CENTER, y: BOARD_CENTER + Math.ceil(BOARD_RADIUS) })).toBe(false);
  });

  it('leaves the player in the middle of it', () => {
    expect(isBoardCell({ x: BOARD_CENTER, y: BOARD_CENTER })).toBe(true);
    expect(reachOf({ x: BOARD_CENTER, y: BOARD_CENTER })).toBe(0);
    // Odd, so the middle is a cell rather than a corner between four
    expect(BOARD_CELLS % 2).toBe(1);
  });

  it('is drawn inside the picture however the board is turned', () => {
    for (let step = 0; step < 24; step++) {
      const yaw = (step / 24) * 2 * Math.PI;

      for (const cell of boardCells()) {
        for (const corner of projectBoardCellQuad(cell, yaw)) {
          expect(corner.x, `board at ${yaw}`).toBeGreaterThanOrEqual(-1e-9);
          expect(corner.x).toBeLessThanOrEqual(1 + 1e-9);
          expect(corner.y).toBeGreaterThanOrEqual(-1e-9);
          expect(corner.y).toBeLessThanOrEqual(1 + 1e-9);
        }
      }
    }
  });

  it('reads every one of its cells back as itself, and nothing outside it', () => {
    for (const cell of boardCells()) {
      const middle = projectBoardCell(cell);

      expect(boardCellAtFraction(middle.x, middle.y)).toEqual(cell);
      expect(cellAtFraction(middle.x, middle.y)).toBe(cell.y * BOARD_CELLS + cell.x);
    }
    // A square of the corner is drawn, since the ground slides, but it
    // is not somewhere a player may be asked to walk
    expect(boardIndexOf({ x: 0, y: 0 })).toBeNull();
  });
});

describe('the compass', () => {
  it('stands its marks off the board, one to each side', () => {
    const marks = compassMarks();

    // Only one of the four is told apart, and it is the one a player
    // is orienting by
    expect(marks.map((mark) => mark.north)).toEqual([true, false, false, false]);

    // Inside the picture, and outside the board: north is beyond the
    // far edge, south beyond the near one
    for (const mark of marks) {
      expect(mark.x).toBeGreaterThanOrEqual(0);
      expect(mark.x).toBeLessThanOrEqual(1);
      expect(mark.y).toBeGreaterThanOrEqual(0);
      expect(mark.y).toBeLessThanOrEqual(1);
      expect(boardCellAtFraction(mark.x, mark.y)).toBeNull();
    }

    const [north, east, south, west] = marks;

    expect(north.y).toBeLessThan(projectGround({ u: 0.5, v: 0 }).y);
    expect(south.y).toBeGreaterThan(projectGround({ u: 0.5, v: 1 }).y);
    expect(west.x).toBeLessThan(east.x);
  });

  it('carries the marks round with the board', () => {
    // A quarter turn puts what was north where east was: the marks
    // are ground points, so they turn with everything else on it
    const facing = compassMarks();
    const turned = compassMarks(Math.PI / 2);

    expect(turned[0].x).toBeCloseTo(facing[1].x, 6);
    expect(turned[0].y).toBeCloseTo(facing[1].y, 6);
  });
});

describe('walking the camera round the board', () => {
  const QUARTER = Math.PI / 2;

  it('reads back exactly at any angle', () => {
    for (const yaw of [0, 0.3, 1, QUARTER, 2.5, -0.7, 6]) {
      for (const index of BOARD.filter((_, at) => at % 7 === 0)) {
        const middle = projectCell(index, yaw);

        expect(cellAtFraction(middle.x, middle.y, yaw), `cell ${index} at ${yaw}`).toBe(index);
      }
    }
  });

  it('keeps the whole board inside the picture however it is turned', () => {
    // The frame is fitted once, to the widest the board ever gets, so
    // that turning it does not make it lurch toward the camera
    for (let step = 0; step < 24; step++) {
      const yaw = (step / 24) * 2 * Math.PI;

      for (const index of [BOARD[0], BOARD[BOARD.length - 1], BOARD[BOARD.length >> 1]]) {
        for (const corner of projectCellQuad(index, yaw)) {
          expect(corner.x, `corner at ${yaw}`).toBeGreaterThanOrEqual(-1e-9);
          expect(corner.x).toBeLessThanOrEqual(1 + 1e-9);
          expect(corner.y).toBeGreaterThanOrEqual(-1e-9);
          expect(corner.y).toBeLessThanOrEqual(1 + 1e-9);
        }
      }
    }
  });

  it('paints from the back forwards, whichever way it is turned', () => {
    for (const yaw of [0, 0.8, QUARTER, 3.9]) {
      const order = paintOrder(yaw);

      expect(order).toHaveLength(BOARD.length);
      expect(new Set(order).size).toBe(order.length);

      for (let at = 1; at < order.length; at++) {
        expect(projectCell(order[at], yaw).y).toBeGreaterThanOrEqual(
          projectCell(order[at - 1], yaw).y,
        );
      }
    }
  });

  it('turns what is standing on it with the board', () => {
    // Facing the camera, seen head on, is still facing the camera
    expect(facingFrom(0, 0)).toBe(0);

    // A quarter turn of the camera is two of the eight facings, and
    // it goes the other way: the camera moves, the pokemon does not
    expect(facingFrom(0, QUARTER)).toBe(SPRITE_FACINGS - 2);
    expect(facingFrom(2, QUARTER)).toBe(0);

    // Whatever the angle, it lands on one of the eight
    for (const yaw of [0.1, 1.2, -3, 9]) {
      for (let facing = 0; facing < SPRITE_FACINGS; facing++) {
        const seen = facingFrom(facing, yaw);

        expect(Number.isInteger(seen)).toBe(true);
        expect(seen).toBeGreaterThanOrEqual(0);
        expect(seen).toBeLessThan(SPRITE_FACINGS);
      }
    }
  });
});

describe('which quarter the camera is standing in', () => {
  it('counts the quarters a board has been turned', () => {
    expect(yawTurns(0)).toBe(0);
    expect(yawTurns(Math.PI / 2)).toBe(1);
    expect(yawTurns(Math.PI)).toBe(2);
    expect(yawTurns((3 * Math.PI) / 2)).toBe(3);
    expect(yawTurns(2 * Math.PI)).toBe(0);
  });

  it('serves a camera in between from whichever quarter is nearest', () => {
    expect(yawTurns((Math.PI / 2) * 0.4)).toBe(0);
    expect(yawTurns((Math.PI / 2) * 0.6)).toBe(1);
  });

  it('answers a quarter for a camera walked the other way round', () => {
    expect(yawTurns(-Math.PI / 2)).toBe(3);
    expect(yawTurns(-Math.PI)).toBe(2);
    expect(yawTurns(-4 * Math.PI)).toBe(0);
  });
});
