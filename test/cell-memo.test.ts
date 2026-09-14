import { describe, expect, it } from 'vitest';
import CellMemo from '../src/core/cell-memo';

describe('CellMemo', () => {
  it('keeps negative and far apart cells apart', () => {
    const memo = new CellMemo<number>();

    memo.set(-3, 5, 1);
    memo.set(3, -5, 2);
    memo.set(-32_768, 32_767, 3);

    expect(memo.get(-3, 5)).toBe(1);
    expect(memo.get(3, -5)).toBe(2);
    expect(memo.get(-32_768, 32_767)).toBe(3);
    expect(memo.get(5, -3)).toBeUndefined();
  });

  it('stays bounded and keeps the cells still being read', () => {
    const memo = new CellMemo<number>();

    memo.set(0, 0, 7);
    // Walk far enough to turn both generations over, reading the first cell as we go
    for (let step = 1; step <= 300_000; step++) {
      memo.set(step, 0, step);
      if (step % 1000 === 0) {
        expect(memo.get(0, 0)).toBe(7);
      }
    }
    expect(memo.get(1, 0)).toBeUndefined();
    expect(memo.get(300_000, 0)).toBe(300_000);
  });
});
