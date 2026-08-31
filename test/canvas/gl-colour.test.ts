import { describe, expect, it } from 'vitest';
import parseColour from '../../src/canvas/gl/colour';

/**
 * The GL layer reads the board's own colour table rather than a second
 * one, so it has to understand every notation that table is written in.
 */

describe('a colour for the ground layer', () => {
  it('reads the notations the board is written in', () => {
    // The biome table, which is plain six-digit hex
    expect(parseColour('#1d5b90')).toEqual([0x1d / 255, 0x5b / 255, 0x90 / 255, 1]);
    // The chunk's own surface, which carries its alpha separately
    expect(parseColour('rgba(255, 255, 255, 0.10)')).toEqual([1, 1, 1, 0.1]);
    expect(parseColour('rgb(0, 128, 255)')).toEqual([0, 128 / 255, 1, 1]);
  });

  it('doubles the digits of the short form', () => {
    expect(parseColour('#abc')).toEqual(parseColour('#aabbcc'));
    expect(parseColour('#abcd')).toEqual(parseColour('#aabbccdd'));
  });

  it('reads an alpha written as a fourth pair', () => {
    expect(parseColour('#00000080')).toEqual([0, 0, 0, 0x80 / 255]);
  });

  it('answers null for anything it cannot read, so nothing is drawn black', () => {
    expect(parseColour('oklch(0.5 0.1 200)')).toBeNull();
    expect(parseColour('rebeccapurple')).toBeNull();
    expect(parseColour('#12345')).toBeNull();
    expect(parseColour('rgb(a, b, c)')).toBeNull();
  });

  it('gives the same answer every time, since it remembers them', () => {
    const first = parseColour('#123456');

    expect(parseColour('#123456')).toEqual(first);
  });
});
