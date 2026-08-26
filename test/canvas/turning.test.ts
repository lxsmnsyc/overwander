import { describe, expect, it } from 'vitest';
import { isTurningPress } from '../../src/components/overworld/chunk-canvas';

describe('what turns the board rather than pressing it', () => {
  const LEFT = 0;
  const MIDDLE = 1;
  const RIGHT = 2;

  it('takes the right button, and the Mac gesture that stands in for it', () => {
    expect(isTurningPress({ button: RIGHT, ctrlKey: false })).toBe(true);
    // A trackpad and a Magic Mouse both ship without a right button;
    // control and the left one is what that platform means by a
    // secondary click everywhere else in the system
    expect(isTurningPress({ button: LEFT, ctrlKey: true })).toBe(true);
  });

  it('leaves an ordinary press alone', () => {
    expect(isTurningPress({ button: LEFT, ctrlKey: false })).toBe(false);
    expect(isTurningPress({ button: MIDDLE, ctrlKey: false })).toBe(false);
  });

  it('costs a right-clicking machine nothing', () => {
    // Control-clicking a right button was never a way to press a cell,
    // so counting it as a turn takes nothing away
    expect(isTurningPress({ button: RIGHT, ctrlKey: true })).toBe(true);
  });
});
