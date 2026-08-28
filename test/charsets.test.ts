import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Awards from '../src/data/ids/awards';
import {
  CHARSETS,
  DEFAULT_CHARSET,
  FREE_CHARSETS,
  getCharset,
  getCharsetName,
} from '../src/data/overworld/charsets';
import {
  ELITE_MEMBERS,
  ELITE_MEMBER_CHARSETS,
  ELITE_MEMBER_HONORS,
  GYM_LEADERS,
  GYM_LEADER_BADGES,
  GYM_LEADER_CHARSETS,
} from '../src/data/overworld/experts';
import { ACHIEVEMENT_TRAINERS } from '../src/data/achievements';
import { TRAINER_CHARSETS } from '../src/data/overworld/trainers';

/**
 * The characters a trainer may go about as, and what unlocks each.
 *
 * The list is derived from the expert and trainer tables rather than
 * written out, so what is worth testing is that the derivation covers
 * them and that every sheet it names is one the game can actually
 * draw.
 */

describe('the characters a trainer may wear', () => {
  it('starts everybody with the two player characters and nothing else', () => {
    const free = CHARSETS.filter((charset) => charset.lock.kind === 'free');

    expect(free.map((charset) => charset.sheet)).toEqual(FREE_CHARSETS);
    expect(FREE_CHARSETS).toContain(DEFAULT_CHARSET);
  });

  it('names a sheet that is actually on disk', () => {
    // A sheet nobody packed is a square that draws nothing, and the
    // picker would offer it anyway: the lock says it was earned
    const missing = CHARSETS.filter(
      (charset) => !existsSync(`public/sprites/overworld/${charset.sheet}`),
    );

    expect(missing.map((charset) => charset.sheet)).toEqual([]);
  });

  it('pairs every gym leader with their own badge', () => {
    for (const leader of GYM_LEADERS) {
      for (const sheet of GYM_LEADER_CHARSETS[leader]) {
        const found = getCharset(sheet);

        // Red is the Champion's sheet as well as the free one, and the
        // free claim is the one that stands
        if (FREE_CHARSETS.includes(sheet)) {
          continue;
        }
        expect(found?.lock).toEqual({ kind: 'award', award: GYM_LEADER_BADGES[leader] });
      }
    }
  });

  it('pairs every one of the Elite Four with their own mark', () => {
    for (const member of ELITE_MEMBERS) {
      for (const sheet of ELITE_MEMBER_CHARSETS[member]) {
        expect(getCharset(sheet)?.lock).toEqual({
          kind: 'award',
          award: ELITE_MEMBER_HONORS[member],
        });
      }
    }
  });

  it('pairs every trainer class with its own line', () => {
    for (const trainer of ACHIEVEMENT_TRAINERS) {
      for (const sheet of TRAINER_CHARSETS[trainer]) {
        expect(getCharset(sheet)?.lock).toEqual({ kind: 'trainer', trainer });
      }
    }
  });

  it('leaves the Champion the one seat that unlocks nothing else', () => {
    const seats = CHARSETS.filter(
      (charset) => charset.lock.kind === 'award' && charset.lock.award === Awards.KantoChampion,
    );

    // Red's free sheet is claimed before the Champion's, so what the
    // seat is worth is the other style of him
    expect(seats.map((charset) => charset.sheet)).toEqual(['characters/lgpe/red']);
  });

  it('says who a sheet is, and which game it is drawn from', () => {
    expect(getCharsetName('characters/frlg/brock')).toBe('Brock (FRLG)');
    expect(getCharsetName('characters/lgpe/brock')).toBe('Brock (LGPE)');
    // A sheet nobody offers still has to be called something
    expect(getCharsetName('characters/frlg/nobody')).toBe('Trainer');
  });
});
