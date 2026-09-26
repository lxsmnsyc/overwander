import type { Resource } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { failed, readable } from '../src/components/app/resource-reads';

/** Just enough of a resource for the two readers, which only look at its state */
function resource<T>(
  state: Resource<T>['state'],
  value: T | undefined,
  error?: unknown,
): Resource<T> {
  const read = (): T | undefined => {
    if (state === 'errored') {
      throw error;
    }
    return value;
  };

  // A stand-in: only the fields the readers look at are real
  /* oxlint-disable typescript/no-unsafe-type-assertion */
  return Object.defineProperties(read, {
    state: { value: state },
    error: { value: error },
    loading: { value: false },
    latest: { get: read },
  }) as Resource<T>;
  /* oxlint-enable typescript/no-unsafe-type-assertion */
}

describe('a resource read that can fail', () => {
  it('answers what came back', () => {
    const ready = resource('ready', [1, 2]);

    expect(readable(ready)).toEqual([1, 2]);
    expect(failed(ready)).toBeNull();
  });

  it('answers nothing, and says why, rather than throwing', () => {
    const refused = resource<number[]>(
      'errored',
      undefined,
      new Error('Could not read your bag just now.'),
    );

    expect(readable(refused)).toBeUndefined();
    expect(failed(refused)).toBe('Could not read your bag just now.');
  });

  it('says nothing for a failure that is not an Error', () => {
    expect(failed(resource<number>('errored', undefined, 'raw'))).toBeNull();
  });
});
