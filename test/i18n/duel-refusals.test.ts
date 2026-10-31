import { describe, expect, it } from 'vitest';
import describeDuelRefusal from '../../src/i18n/duel-refusals';

describe('describeDuelRefusal', () => {
  it('says nothing when nothing is refused', () => {
    expect(describeDuelRefusal(null)).toBeNull();
  });

  it('says each kind of refusal in English', () => {
    expect(describeDuelRefusal({ kind: 'mythical' })).toBe('mythical');
    expect(describeDuelRefusal({ kind: 'legendary' })).toBe('legendary');
    expect(describeDuelRefusal({ kind: 'form-item' })).toBe('holds a form item');
  });

  it('formats the stat total it names', () => {
    expect(describeDuelRefusal({ kind: 'stat-total', total: 1200 })).toBe('stat total 1,200');
  });
});
