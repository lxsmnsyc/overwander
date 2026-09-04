import { describe, expect, it } from 'vitest';
import { MoveCategories, MoveAffects, Moves, Types as _T } from '../../src/data/ids/moves';
import { Types } from '../../src/data/constants/types';
import { getMoveData } from '../../src/data/moves';
import registerGameData from '../../src/data';
import { delayShapeFor, effectShapeFor } from '../../src/canvas/battle/moves';
import { writeFileSync } from 'node:fs';

registerGameData();

const TYPE_NAME: Record<number, string> = {};
for (const [key, value] of Object.entries(Types)) {
  if (typeof value === 'number') TYPE_NAME[value] = key;
}

describe('probe', () => {
  it('dumps', () => {
    const lines: string[] = [];

    for (const value of Object.values(Moves)) {
      if (typeof value !== 'number') continue;
      const move = value as Moves;
      let data;
      try { data = getMoveData(move); } catch { continue; }
      if (data == null) continue;
      const effect = effectShapeFor(move);
      const delay = delayShapeFor(move, 0) ?? 'none';
      const cat = data.category === MoveCategories.Status ? 'S' : data.category === MoveCategories.Physical ? 'P' : 'M';
      lines.push([effect, delay, data.name, TYPE_NAME[data.type] ?? data.type, cat, String(data.power ?? 0), `flags${data.flags}`, `aff${data.affects}`, data.delay == null ? '-' : String(data.delay)].join('\t'));
    }

    writeFileSync('/tmp/shapes.tsv', lines.join('\n'));
    expect(lines.length).toBeGreaterThan(0);
  });
});
