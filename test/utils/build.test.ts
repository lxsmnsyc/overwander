import { describe, expect, it } from 'vitest';
import { isStaleCall } from '../../src/utils/build';

describe('which server calls are refused', () => {
  it('lets through a call from the live build', () => {
    expect(isStaleCall('/_server', 'abc', 'abc')).toBe(false);
  });

  it('refuses a call from another build', () => {
    expect(isStaleCall('/_server', 'old', 'abc')).toBe(true);
  });

  it('refuses a call that names no build', () => {
    expect(isStaleCall('/_server', null, 'abc')).toBe(true);
  });

  it('leaves everything that is not a server call alone', () => {
    expect(isStaleCall('/overworld', null, 'abc')).toBe(false);
  });
});
