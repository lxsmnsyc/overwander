import { describe, expect, it } from 'vitest';
import { getServerCallId } from '../../src/model/build';

describe('which function a server call names', () => {
  it('reads the id of an ordinary call', () => {
    expect(getServerCallId('/_server/data/readBag-1a2b3c4d')).toBe('readBag-1a2b3c4d');
  });

  it('reads the id of a form action and of the live wire', () => {
    expect(getServerCallId('/_server/readBag-1a2b3c4d')).toBe('readBag-1a2b3c4d');
    expect(getServerCallId('/_server/live/watch-1a2b3c4d')).toBe('watch-1a2b3c4d');
  });

  it('decodes an escaped id', () => {
    expect(getServerCallId('/_server/data/a.b%20c-1a2b3c4d')).toBe('a.b c-1a2b3c4d');
  });

  it('leaves everything that is not a server call alone', () => {
    expect(getServerCallId('/overworld')).toBeNull();
    expect(getServerCallId('/_server')).toBeNull();
    expect(getServerCallId('/_server/')).toBeNull();
    expect(getServerCallId('/_server/data/')).toBeNull();
    expect(getServerCallId('/_server/data/a/b')).toBeNull();
    expect(getServerCallId('/_live')).toBeNull();
  });
});
